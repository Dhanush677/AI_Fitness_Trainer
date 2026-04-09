from __future__ import annotations

from typing import Sequence

import cv2

try:
    import mediapipe as mp
except ImportError as error:  # pragma: no cover - dependency path
    raise RuntimeError(
        "MediaPipe is not installed in the backend environment. "
        "Run `pip install -r requirements.txt` inside the backend folder."
    ) from error

try:
    MP_POSE_MODULE = mp.solutions.pose
except AttributeError:
    try:
        from mediapipe.python.solutions import pose as MP_POSE_MODULE
    except Exception as error:  # pragma: no cover - dependency path
        raise RuntimeError(
            "The installed MediaPipe package does not expose the legacy Pose Solution API. "
            "Reinstall the backend dependencies so mediapipe==0.10.21 is installed."
        ) from error

from exercise_logic import (
    EXERCISE_LABELS,
    ExerciseName,
    ExerciseSide,
    WorkoutState,
    analyze_exercise,
    create_initial_state,
    resolve_tracking_side,
)
from utils import serialize_landmarks


class PoseProcessor:
    """Process webcam frames with MediaPipe Pose and exercise logic."""

    def __init__(self, exercise_name: ExerciseName) -> None:
        self.exercise_name = exercise_name
        self.state = create_initial_state(exercise_name)
        self.mp_pose = MP_POSE_MODULE
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def process_frame(self, frame):
        mirrored_frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(mirrored_frame, cv2.COLOR_BGR2RGB)
        rgb_frame.flags.writeable = False
        results = self.pose.process(rgb_frame)
        rgb_frame.flags.writeable = True

        landmarks_payload: list[dict[str, float]] = []

        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            tracked_side = resolve_tracking_side(landmarks)
            self.state = analyze_exercise(
                self.exercise_name,
                landmarks,
                self.state,
                tracked_side,
            )
            self._draw_pose(mirrored_frame, landmarks, tracked_side, self.state.is_correct_form)
            landmarks_payload = serialize_landmarks(landmarks)
        else:
            self.state = WorkoutState(
                counter=self.state.counter,
                stage=self.state.stage,
                angle=self.state.angle,
                feedback="Step into the frame so your full body is visible.",
                is_correct_form=False,
            )

        self._draw_hud(mirrored_frame)

        return mirrored_frame, {
            **self.state.to_dict(),
            "exercise": self.exercise_name,
            "landmarks": landmarks_payload,
        }

    def _draw_pose(
        self,
        frame,
        landmarks: Sequence,
        tracked_side: ExerciseSide,
        is_correct_form: bool,
    ) -> None:
        height, width, _ = frame.shape
        line_color = (0, 220, 0) if is_correct_form else (0, 0, 255)
        point_color = (255, 255, 255)

        left = {
            "shoulder": 11,
            "elbow": 13,
            "wrist": 15,
            "hip": 23,
            "knee": 25,
            "ankle": 27,
        }
        right = {
            "shoulder": 12,
            "elbow": 14,
            "wrist": 16,
            "hip": 24,
            "knee": 26,
            "ankle": 28,
        }
        indexes = left if tracked_side == "left" else right

        connections = [
            (indexes["shoulder"], indexes["elbow"]),
            (indexes["elbow"], indexes["wrist"]),
            (indexes["shoulder"], indexes["hip"]),
            (indexes["hip"], indexes["knee"]),
            (indexes["knee"], indexes["ankle"]),
        ]

        if self.exercise_name == "pushup":
            connections.append((indexes["hip"], indexes["ankle"]))

        for start_index, end_index in connections:
            start = landmarks[start_index]
            end = landmarks[end_index]

            if getattr(start, "visibility", 1.0) < 0.35 or getattr(end, "visibility", 1.0) < 0.35:
                continue

            start_point = (int(start.x * width), int(start.y * height))
            end_point = (int(end.x * width), int(end.y * height))
            cv2.line(frame, start_point, end_point, line_color, 4)

        for landmark in landmarks:
            if getattr(landmark, "visibility", 1.0) < 0.35:
                continue
            point = (int(landmark.x * width), int(landmark.y * height))
            cv2.circle(frame, point, 4, point_color, -1)

    def _draw_hud(self, frame) -> None:
        status_color = (0, 220, 0) if self.state.is_correct_form else (0, 0, 255)
        exercise_label = EXERCISE_LABELS[self.exercise_name]

        cv2.rectangle(frame, (20, 20), (500, 170), (15, 23, 42), -1)
        cv2.putText(frame, exercise_label, (35, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (248, 250, 252), 2)
        cv2.putText(frame, f"Reps: {self.state.counter}", (35, 92), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (248, 250, 252), 2)
        cv2.putText(
            frame,
            f"Angle: {round(self.state.angle, 1)}",
            (35, 126),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (248, 250, 252),
            2,
        )
        cv2.putText(frame, self.state.feedback[:48], (35, 158), cv2.FONT_HERSHEY_SIMPLEX, 0.65, status_color, 2)

    def close(self) -> None:
        self.pose.close()
