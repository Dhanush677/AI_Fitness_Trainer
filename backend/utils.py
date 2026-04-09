from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable
import sys
from time import sleep

import cv2


def encode_frame(frame) -> bytes | None:
    """Convert an OpenCV frame into JPEG bytes for FastAPI streaming."""
    success, buffer = cv2.imencode(".jpg", frame)
    return buffer.tobytes() if success else None


def serialize_landmarks(landmarks: Iterable) -> list[dict[str, float]]:
    """Turn MediaPipe landmarks into plain JSON-friendly dictionaries."""
    return [
        {
            "x": round(float(landmark.x), 4),
            "y": round(float(landmark.y), 4),
            "z": round(float(getattr(landmark, "z", 0.0)), 4),
            "visibility": round(float(getattr(landmark, "visibility", 0.0)), 4),
        }
        for landmark in landmarks
    ]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _configure_capture(capture: cv2.VideoCapture) -> None:
    """Apply a conservative webcam configuration that works on most laptops."""
    capture.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    if hasattr(cv2, "CAP_PROP_FOURCC"):
        capture.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))


def open_camera_capture(index: int = 0) -> tuple[cv2.VideoCapture, str]:
    """
    Try several OpenCV camera backends because some Windows webcams open on one
    backend but return blank frames on another.
    """
    candidates: list[tuple[str, int | None]] = [("default", None)]

    if sys.platform.startswith("win"):
        candidates = []

        if hasattr(cv2, "CAP_DSHOW"):
            candidates.append(("DirectShow", cv2.CAP_DSHOW))

        if hasattr(cv2, "CAP_MSMF"):
            candidates.append(("Media Foundation", cv2.CAP_MSMF))

        candidates.append(("default", None))

    attempts: list[str] = []

    for backend_name, backend_flag in candidates:
        capture = (
            cv2.VideoCapture(index, backend_flag)
            if backend_flag is not None
            else cv2.VideoCapture(index)
        )

        if not capture.isOpened():
            capture.release()
            attempts.append(f"{backend_name}: could not open camera")
            continue

        _configure_capture(capture)

        for _ in range(20):
            success, frame = capture.read()
            if success and frame is not None and getattr(frame, "size", 0) > 0:
                return capture, backend_name
            sleep(0.05)

        capture.release()
        attempts.append(f"{backend_name}: opened camera but received no frames")

    attempted_backends = ", ".join(attempts) if attempts else "no camera backends were available"
    raise RuntimeError(
        "Could not get a valid webcam frame. Tried these backends: "
        f"{attempted_backends}. Close other camera apps and try again."
    )
