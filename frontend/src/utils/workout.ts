export type ExerciseName = "bicep-curl" | "squat" | "pushup";

export type PoseLandmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export type SessionStatus = {
  exercise: ExerciseName | null;
  counter: number;
  stage: string;
  angle: number;
  feedback: string;
  isCorrectForm: boolean;
  landmarks: PoseLandmark[];
  isRunning: boolean;
  duration: number;
  cameraBackend: string | null;
  error: string | null;
  updatedAt: string;
};

export type ExerciseOption = {
  id: ExerciseName;
  title: string;
  description: string;
  cue: string;
  focus: string;
};

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const EXERCISE_OPTIONS: ExerciseOption[] = [
  {
    id: "bicep-curl",
    title: "Bicep Curls",
    description: "Track elbow flexion, rep depth, and elbow stability.",
    cue: "Keep your elbow close to your torso and finish every curl.",
    focus: "Shoulder - Elbow - Wrist",
  },
  {
    id: "squat",
    title: "Squats",
    description: "Watch squat depth, torso posture, and knee position.",
    cue: "Sit back, keep your chest lifted, and reach below 90 degrees.",
    focus: "Hip - Knee - Ankle",
  },
  {
    id: "pushup",
    title: "Pushups",
    description: "Measure elbow bend and shoulder-hip-ankle alignment.",
    cue: "Keep your body in one line and use a full pressing range.",
    focus: "Shoulder - Elbow - Wrist",
  },
];

export const DEFAULT_STATUS: SessionStatus = {
  exercise: null,
  counter: 0,
  stage: "down",
  angle: 0,
  feedback: "Choose an exercise before starting the camera.",
  isCorrectForm: false,
  landmarks: [],
  isRunning: false,
  duration: 0,
  cameraBackend: null,
  error: null,
  updatedAt: new Date().toISOString(),
};

export const getExerciseLabel = (exercise: ExerciseName | null): string => {
  const match = EXERCISE_OPTIONS.find((option) => option.id === exercise);
  return match?.title ?? "No exercise selected";
};

export const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const normalizeStatus = (data: Partial<SessionStatus>): SessionStatus => ({
  ...DEFAULT_STATUS,
  ...data,
  landmarks: data.landmarks ?? [],
  error: data.error ?? null,
  updatedAt: data.updatedAt ?? new Date().toISOString(),
});
