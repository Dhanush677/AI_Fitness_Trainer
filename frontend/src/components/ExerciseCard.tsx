import type { LucideIcon } from "lucide-react";

type ExerciseCardProps = {
  title: string;
  description: string;
  cue: string;
  focus: string;
  icon: LucideIcon;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

export const ExerciseCard = ({
  title,
  description,
  cue,
  focus,
  icon: Icon,
  selected,
  disabled = false,
  onSelect,
}: ExerciseCardProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={[
        "glass-panel w-full p-5 text-left transition duration-200",
        selected
          ? "border-emerald-500/70 ring-2 ring-emerald-500/20"
          : "hover:-translate-y-1 hover:border-slate-200",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-slate-950 p-3 text-white">
          <Icon className="h-6 w-6" />
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
            selected
              ? "bg-emerald-500/10 text-emerald-700"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {selected ? "Selected" : "Tap to choose"}
        </span>
      </div>

      <h3 className="mt-5 font-display text-2xl text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Tracking Focus
        </p>
        <p className="mt-2 text-sm font-medium text-slate-800">{focus}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{cue}</p>
      </div>
    </button>
  );
};
