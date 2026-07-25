"use client";

/** A tap-target chip for onboarding + choices. Selected = teal→lavender fill. */
export default function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "w-full rounded-2xl px-5 py-4 text-left text-lg font-medium transition-all",
        "shadow-float active:scale-[0.98]",
        selected
          ? "bg-gradient-to-r from-teal to-lavender text-base"
          : "bg-surface text-slate-100 hover:bg-[#161f31]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
