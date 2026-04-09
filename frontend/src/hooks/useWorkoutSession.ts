import { useCallback, useEffect, useState } from "react";
import {
  API_BASE_URL,
  DEFAULT_STATUS,
  type ExerciseName,
  type SessionStatus,
  normalizeStatus,
} from "../utils/workout";

const STATUS_POLL_INTERVAL = 400;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const useWorkoutSession = () => {
  const [status, setStatus] = useState<SessionStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamToken, setStreamToken] = useState<number>(Date.now());

  const fetchStatus = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/session/status`);

    if (!response.ok) {
      throw new Error("The backend status endpoint is not responding.");
    }

    const data = normalizeStatus(await response.json());
    setStatus(data);
    setError(data.error);
    return data;
  }, []);

  const startSession = useCallback(async (exercise: ExerciseName | null) => {
    if (!exercise) {
      setError("Select an exercise before starting the camera.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/session/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exercise }),
      });

      if (!response.ok) {
        throw new Error("The backend could not start the workout session.");
      }

      const data = normalizeStatus(await response.json());
      setStatus(data);
      setError(data.error);
      setStreamToken(Date.now());
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to start the session."));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/session/stop`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("The backend could not stop the workout session.");
      }

      const data = normalizeStatus(await response.json());
      setStatus(data);
      setError(data.error);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to stop the session."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus().catch((requestError) => {
      setError(getErrorMessage(requestError, "Connect the backend to continue."));
    });
  }, [fetchStatus]);

  useEffect(() => {
    if (!status.isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void fetchStatus().catch((requestError) => {
        setError(getErrorMessage(requestError, "Live updates are temporarily unavailable."));
      });
    }, STATUS_POLL_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [fetchStatus, status.isRunning]);

  useEffect(() => {
    return () => {
      void fetch(`${API_BASE_URL}/session/stop`, { method: "POST" }).catch(() => {
        // Ignore cleanup errors when the browser tab closes.
      });
    };
  }, []);

  return {
    status,
    error,
    isLoading,
    streamUrl: status.isRunning
      ? `${API_BASE_URL}/video_feed?stream=${streamToken}`
      : null,
    startSession,
    stopSession,
    refreshStatus: fetchStatus,
  };
};
