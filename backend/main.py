from __future__ import annotations

from threading import Event, Lock, Thread
from time import sleep, time
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from exercise_logic import EXERCISE_LABELS, ExerciseName, create_initial_state
from pose_module import PoseProcessor
from utils import encode_frame, now_iso, open_camera_capture


class StartSessionRequest(BaseModel):
    exercise: Literal["bicep-curl", "squat", "pushup"]


class WorkoutSessionManager:
    def __init__(self) -> None:
        self.lock = Lock()
        self.worker_thread: Thread | None = None
        self.stop_event: Event | None = None
        self.latest_frame: bytes | None = None
        self.current_exercise: ExerciseName | None = None
        self.started_at: float | None = None
        self.status = self._build_idle_status()

    def _build_idle_status(self) -> dict:
        return {
            "exercise": None,
            "counter": 0,
            "stage": "down",
            "angle": 0.0,
            "feedback": "Choose an exercise in the frontend before starting the camera.",
            "isCorrectForm": False,
            "landmarks": [],
            "isRunning": False,
            "duration": 0,
            "cameraBackend": None,
            "error": None,
            "updatedAt": now_iso(),
        }

    def start(self, exercise: ExerciseName) -> None:
        self.stop()

        initial_state = create_initial_state(exercise)
        with self.lock:
            self.current_exercise = exercise
            self.started_at = time()
            self.latest_frame = None
            self.status = {
                **initial_state.to_dict(),
                "exercise": exercise,
                "landmarks": [],
                "isRunning": True,
                "duration": 0,
                "cameraBackend": None,
                "error": None,
                "updatedAt": now_iso(),
            }
            self.stop_event = Event()
            self.worker_thread = Thread(
                target=self._camera_loop,
                args=(exercise, self.stop_event),
                daemon=True,
            )
            self.worker_thread.start()

    def stop(self) -> None:
        worker_thread: Thread | None = None

        with self.lock:
            if self.stop_event is not None:
                self.stop_event.set()
            worker_thread = self.worker_thread

        if worker_thread and worker_thread.is_alive():
            worker_thread.join(timeout=2)

        with self.lock:
            self.worker_thread = None
            self.stop_event = None
            self.latest_frame = None
            self.current_exercise = None
            self.started_at = None
            self.status = {
                **self.status,
                "isRunning": False,
                "feedback": self.status.get("feedback") or "Session stopped.",
                "updatedAt": now_iso(),
            }

    def _camera_loop(self, exercise: ExerciseName, stop_event: Event) -> None:
        camera = None
        camera_backend = None
        processor = None

        try:
            camera, camera_backend = open_camera_capture(0)
            processor = PoseProcessor(exercise)

            while not stop_event.is_set():
                success, frame = camera.read()
                if not success:
                    sleep(0.03)
                    continue

                processed_frame, payload = processor.process_frame(frame)
                encoded_frame = encode_frame(processed_frame)

                if encoded_frame is None:
                    continue

                with self.lock:
                    duration = int(time() - self.started_at) if self.started_at else 0
                    self.latest_frame = encoded_frame
                    self.status = {
                        **payload,
                        "exercise": exercise,
                        "isRunning": True,
                        "duration": duration,
                        "cameraBackend": camera_backend,
                        "error": None,
                        "updatedAt": now_iso(),
                    }

        except Exception as error:  # pragma: no cover - runtime hardware path
            with self.lock:
                self.status = {
                    **self._build_idle_status(),
                    "exercise": exercise,
                    "feedback": "The backend hit a camera or MediaPipe error.",
                    "cameraBackend": None,
                    "error": str(error),
                    "updatedAt": now_iso(),
                }
        finally:
            if processor is not None:
                processor.close()

            if camera is not None:
                camera.release()

    def get_status(self) -> dict:
        with self.lock:
            return dict(self.status)

    def frame_generator(self):
        while True:
            with self.lock:
                frame = self.latest_frame
                is_running = self.status.get("isRunning", False)

            if frame is not None:
                yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
                sleep(0.03)
            elif is_running:
                sleep(0.03)
            else:
                break


session_manager = WorkoutSessionManager()

app = FastAPI(title="AI Smart Fitness Trainer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "availableExercises": [
            {"id": exercise, "label": label}
            for exercise, label in EXERCISE_LABELS.items()
        ],
    }


@app.post("/session/start")
def start_session(request: StartSessionRequest):
    try:
        session_manager.start(request.exercise)
        return session_manager.get_status()
    except Exception as error:  # pragma: no cover - hardware path
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.post("/session/stop")
def stop_session():
    session_manager.stop()
    return session_manager.get_status()


@app.get("/session/status")
def session_status():
    return session_manager.get_status()


@app.get("/video_feed")
def video_feed():
    return StreamingResponse(
        session_manager.frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.on_event("shutdown")
def shutdown_event():
    session_manager.stop()
