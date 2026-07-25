"use client";

import { HeartPulse, IndianRupee, Target } from "lucide-react";
import { daysInRecovery, rupeesSaved } from "@/lib/profile-store";
import type { Desire, Profile } from "@/lib/types";

const GOALS: Record<Desire, { amount: number; label: string }> = {
  "Good food": { amount: 5_000, label: "family meals" },
  "A gadget": { amount: 25_000, label: "your gadget goal" },
  "For my child": { amount: 20_000, label: "your child’s goal" },
  "Saving up": { amount: 50_000, label: "your savings goal" },
};

export default function RecoveryImpact({ profile }: { profile: Profile }) {
  const saved = rupeesSaved(profile);
  const days = daysInRecovery(profile);
  const goal = GOALS[profile.desire];
  const progress = Math.min(100, Math.round((saved / goal.amount) * 100));
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <section aria-labelledby="impact-title" className="mt-4 rounded-3xl bg-surface p-5 shadow-float">
      <h2 id="impact-title" className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Your recovery impact
      </h2>
      <div className="mt-4 grid grid-cols-[112px_1fr] items-center gap-4">
        <div className="relative h-28 w-28">
          <svg viewBox="0 0 100 100" className="-rotate-90" role="img" aria-label={`${progress}% toward ${goal.label}`}>
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#273244" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="url(#impact-gradient)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
            <defs>
              <linearGradient id="impact-gradient">
                <stop stopColor="#2dd4bf" />
                <stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 grid place-items-center font-display text-2xl text-teal">
            {progress}%
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <IndianRupee size={18} className="mt-0.5 shrink-0 text-teal" />
            <p><strong className="text-slate-50">₹{saved.toLocaleString("en-IN")}</strong><br /><span className="text-sm text-slate-400">kept for what matters</span></p>
          </div>
          <div className="flex items-start gap-2">
            <Target size={18} className="mt-0.5 shrink-0 text-lavender" />
            <p className="text-sm text-slate-300">{progress}% toward {goal.label}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-base/60 p-4">
        <HeartPulse className="shrink-0 text-teal" />
        <p className="text-sm text-slate-300">
          <strong className="text-slate-50">{days} days</strong> your body has had away from this habit.
          Every day is health momentum.
        </p>
      </div>
    </section>
  );
}
