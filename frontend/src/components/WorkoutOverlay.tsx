import { Activity, Clock3, Repeat2, ShieldCheck, TriangleAlert } from "lucide-react";
import { formatDuration, getExerciseLabel, type SessionStatus } from "../utils/workout";

type WorkoutOverlayProps = {
  status: SessionStatus;
};

export const WorkoutOverlay = ({ status }: WorkoutOverlayProps) => {
  const statusLabel = status.isCorrectForm ? "Correct posture" : "Adjust posture";
  const statusIcon = status.isCorrectForm ? ShieldCheck : TriangleAlert;
  const StatusIcon = statusIcon;

  return (
    <>
      <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap gap-3">
        <div className="rounded-3xl bg-slate-950/75 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Exercise</p>
          <p className="mt-1 font-display text-xl">{getExerciseLabel(status.exercise)}</p>
        </div>

        <div className="rounded-3xl bg-slate-950/75 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-300">
            <Repeat2 className="h-4 w-4" />
            Reps
          </div>
          <p className="mt-1 font-display text-3xl">{status.counter}</p>
        </div>

        <div className="rounded-3xl bg-slate-950/75 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-300">
            <Activity className="h-4 w-4" />
            Angle
          </div>
          <p className="mt-1 font-display text-3xl">{Math.round(status.angle)}&deg;</p>
        </div>

        <div className="rounded-3xl bg-slate-950/75 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-300">
            <Clock3 className="h-4 w-4" />
            Duration
          </div>
          <p className="mt-1 font-display text-3xl">{formatDuration(status.duration)}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-[26px] bg-white/92 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div
            className={[
              "rounded-2xl p-2",
              status.isCorrectForm ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700",
            ].join(" ")}
          >
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Live Feedback</p>
            <p className="mt-1 font-semibold text-slate-900">{statusLabel}</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-700">{status.feedback}</p>
      </div>
    </>
  );
};
