import { useState } from "react";
import {
  Camera,
  CircleStop,
  Dumbbell,
  Hand,
  Radar,
  ScanSearch,
  Sparkles,
  Waves,
} from "lucide-react";
import { ExerciseCard } from "../components/ExerciseCard";
import { WorkoutOverlay } from "../components/WorkoutOverlay";
import { useWorkoutSession } from "../hooks/useWorkoutSession";
import {
  EXERCISE_OPTIONS,
  getExerciseLabel,
  type ExerciseName,
} from "../utils/workout";

const iconMap = {
  "bicep-curl": Dumbbell,
  squat: Waves,
  pushup: Hand,
};

export const IndexPage = () => {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseName | null>(null);
  const { status, error, isLoading, streamUrl, startSession, stopSession } = useWorkoutSession();

  const selectedOption =
    EXERCISE_OPTIONS.find((option) => option.id === selectedExercise) ?? null;

  const handleStart = async () => {
    await startSession(selectedExercise);
  };

  return (
    <main className="dashboard-shell min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel overflow-hidden px-6 py-8 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                AI Smart Fitness Trainer using Computer Vision
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-slate-950 sm:text-5xl">
                Choose the workout first, then launch a live posture-aware AI coach.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                The Python backend owns the webcam, MediaPipe pose detection, rep counting,
                and green/red skeleton drawing. The React frontend stays focused on exercise
                selection, live status, and a clear presentation layer.
              </p>
            </div>

            <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-soft">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                    Important Rule
                  </p>
                  <p className="mt-1 font-display text-2xl">Camera stays off by default</p>
                </div>
              </div>

              <ol className="mt-6 space-y-3 text-sm leading-6 text-slate-200">
                <li>1. Select one exercise card.</li>
                <li>2. Press Start Workout to activate the backend webcam.</li>
                <li>3. Follow the live feedback and green/red skeleton stream.</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.18fr]">
          <div className="space-y-6">
            <div className="glass-panel px-6 py-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Exercise Selection
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-slate-950">
                    Pick your movement
                  </h2>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700">
                  <ScanSearch className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {EXERCISE_OPTIONS.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    title={exercise.title}
                    description={exercise.description}
                    cue={exercise.cue}
                    focus={exercise.focus}
                    icon={iconMap[exercise.id]}
                    selected={selectedExercise === exercise.id}
                    disabled={status.isRunning}
                    onSelect={() => setSelectedExercise(exercise.id)}
                  />
                ))}
              </div>
            </div>

            <div className="glass-panel px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Session Control
              </p>
              <h2 className="mt-2 font-display text-3xl text-slate-950">
                {selectedOption ? selectedOption.title : "Select an exercise to unlock the camera"}
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {selectedOption
                  ? selectedOption.cue
                  : "The Start Workout button stays disabled until an exercise is selected."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!selectedExercise || status.isRunning || isLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Camera className="h-4 w-4" />
                  {isLoading ? "Connecting..." : "Start Workout"}
                </button>

                <button
                  type="button"
                  onClick={() => void stopSession()}
                  disabled={!status.isRunning || isLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CircleStop className="h-4 w-4" />
                  Stop Workout
                </button>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel overflow-hidden p-4">
              <div className="stream-frame relative aspect-[16/10] overflow-hidden rounded-[24px]">
                {streamUrl ? (
                  <>
                    <img
                      src={streamUrl}
                      alt="Processed workout stream"
                      className="h-full w-full object-cover"
                    />
                    <WorkoutOverlay status={status} />
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
                    <div className="rounded-full bg-white/10 p-4">
                      <Radar className="h-10 w-10" />
                    </div>
                    <h3 className="mt-6 font-display text-3xl">
                      Backend video stream appears here
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                      Select an exercise, then press Start Workout. The backend will open the
                      webcam, process posture with MediaPipe Pose, and stream the green/red
                      skeleton overlay back to this dashboard.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="glass-panel px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Current Exercise
                </p>
                <p className="mt-3 font-display text-2xl text-slate-950">
                  {getExerciseLabel(status.exercise ?? selectedExercise)}
                </p>
              </div>

              <div className="glass-panel px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Reps Counted
                </p>
                <p className="mt-3 font-display text-2xl text-slate-950">{status.counter}</p>
              </div>

              <div className="glass-panel px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Landmarks
                </p>
                <p className="mt-3 font-display text-2xl text-slate-950">
                  {status.landmarks.length || 0}
                </p>
              </div>

              <div className="glass-panel px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Camera Backend
                </p>
                <p className="mt-3 font-display text-xl text-slate-950">
                  {status.cameraBackend ?? "Waiting to connect"}
                </p>
              </div>
            </div>

            <div className="glass-panel px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Architecture Choice
              </p>
              <h2 className="mt-2 font-display text-3xl text-slate-950">
                Backend-controlled camera for the simplest reliable workflow
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                This version uses FastAPI + OpenCV + MediaPipe on the backend. That keeps
                the AI and camera logic in Python, while the React frontend remains clean,
                beginner-friendly, and easy to present in a final-year demo.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
