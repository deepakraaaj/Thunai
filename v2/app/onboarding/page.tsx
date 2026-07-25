"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Orb from "@/components/Orb";
import Chip from "@/components/Chip";
import Transparency from "@/components/Transparency";
import { saveProfile, raviSampleProfile } from "@/lib/profile-store";
import { speak } from "@/lib/tts";
import {
  STAGE_DAYS,
  type Desire,
  type DoingItFor,
  type Language,
  type Profile,
  type Stage,
  type Substance,
  type Trigger,
} from "@/lib/types";
import type { AiMeta } from "@/lib/types";

type Draft = Partial<Profile>;

const STAGES: { label: string; value: Stage }[] = [
  { label: "Just starting", value: "just-starting" },
  { label: "A few weeks", value: "few-weeks" },
  { label: "A few months", value: "few-months" },
  { label: "6+ months", value: "six-plus" },
];
const SUBSTANCES: Substance[] = ["Alcohol", "Tobacco", "Drugs", "Something else"];
const TRIGGERS: Trigger[] = [
  "Work stress",
  "Loneliness",
  "Evenings",
  "Friends who use",
  "Family tension",
];
const FORS: DoingItFor[] = ["Myself", "My child", "Partner", "Parents"];
const DESIRES: Desire[] = ["Good food", "A gadget", "For my child", "Saving up"];

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.28, ease: "easeOut" },
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ dailySpend: 300, language: "en" });
  const [payoff, setPayoff] = useState<{ text: string; meta: AiMeta } | null>(null);
  const [loadingPayoff, setLoadingPayoff] = useState(false);

  const TOTAL = 6;

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function next() {
    setStep((s) => Math.min(TOTAL, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function finalizeProfile(d: Draft): Profile {
    const stage = (d.stage ?? "just-starting") as Stage;
    return {
      name: (d.name ?? "friend").trim().slice(0, 40) || "friend",
      substance: (d.substance ?? "Something else") as Substance,
      stage,
      startDays: STAGE_DAYS[stage],
      createdAt: Date.now(),
      trigger: (d.trigger ?? "Evenings") as Trigger,
      doingItFor: (d.doingItFor ?? "Myself") as DoingItFor,
      lovedOneName: d.lovedOneName?.trim().slice(0, 40) || undefined,
      dailySpend: Math.round(d.dailySpend ?? 300),
      desire: (d.desire ?? "Saving up") as Desire,
      language: (d.language ?? "en") as Language,
    };
  }

  async function finish() {
    const profile = finalizeProfile(draft);
    saveProfile(profile);
    setStep(TOTAL); // payoff screen
    setLoadingPayoff(true);
    try {
      const res = await fetch("/api/onboarding-payoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = (await res.json()) as { text: string; meta: AiMeta };
      setPayoff(data);
      void speak(data.text, profile.language);
    } catch {
      setPayoff({
        text: `I've got you, ${profile.name}. From here on, you don't carry this alone.`,
        meta: { provider: "offline", modelId: "pre-written", latencyMs: 0, isOfflineFallback: true },
      });
    } finally {
      setLoadingPayoff(false);
    }
  }

  function useSample() {
    const profile = raviSampleProfile();
    setDraft(profile);
    saveProfile(profile);
    void finishWith(profile);
  }

  async function finishWith(profile: Profile) {
    setStep(TOTAL);
    setLoadingPayoff(true);
    try {
      const res = await fetch("/api/onboarding-payoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = (await res.json()) as { text: string; meta: AiMeta };
      setPayoff(data);
      void speak(data.text, profile.language);
    } catch {
      setPayoff({
        text: `I've got you, ${profile.name}.`,
        meta: { provider: "offline", modelId: "pre-written", latencyMs: 0, isOfflineFallback: true },
      });
    } finally {
      setLoadingPayoff(false);
    }
  }

  const lang = (draft.language ?? "en") as Language;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-base px-6 py-8">
      {/* breathing orb background */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-30">
        <Orb size={360} />
      </div>

      <div className="relative mx-auto flex min-h-[85dvh] max-w-md flex-col">
        {/* progress + back */}
        <div className="flex items-center gap-3">
          {step > 0 && step < TOTAL && (
            <button
              onClick={back}
              aria-label="Go back one step"
              className="rounded-full p-2 text-slate-300 hover:bg-surface"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-teal" : "bg-surface"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            {/* Step 1 — name */}
            {step === 0 && (
              <motion.div key="s0" {...fade} className="flex flex-1 flex-col">
                <h1 className="font-display text-3xl font-semibold leading-tight text-slate-50">
                  What should I call you?
                </h1>
                <input
                  autoFocus
                  value={draft.name ?? ""}
                  onChange={(e) => set("name", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && draft.name?.trim() && next()}
                  placeholder="Your name"
                  aria-label="Your name"
                  maxLength={40}
                  className="mt-8 w-full rounded-2xl bg-surface px-5 py-4 text-xl text-slate-50 shadow-float outline-none placeholder:text-slate-500"
                />
                <div className="mt-auto space-y-4 pt-8">
                  <PrimaryButton disabled={!draft.name?.trim()} onClick={next}>
                    Continue
                  </PrimaryButton>
                  <button
                    onClick={useSample}
                    className="w-full text-center text-sm text-slate-400 underline underline-offset-4 hover:text-slate-200"
                  >
                    Skip — try Ravi&apos;s sample profile (sample data)
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 — leaving behind */}
            {step === 1 && (
              <Question key="s1" title="What are we leaving behind?">
                {SUBSTANCES.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={draft.substance === s}
                    onClick={() => {
                      set("substance", s);
                      setTimeout(next, 160);
                    }}
                  />
                ))}
              </Question>
            )}

            {/* Step 3 — how far */}
            {step === 2 && (
              <Question key="s2" title="How far have you come?">
                {STAGES.map((s) => (
                  <Chip
                    key={s.value}
                    label={s.label}
                    selected={draft.stage === s.value}
                    onClick={() => {
                      set("stage", s.value);
                      setTimeout(next, 160);
                    }}
                  />
                ))}
              </Question>
            )}

            {/* Step 4 — trigger */}
            {step === 3 && (
              <Question key="s3" title="When does it pull hardest?">
                {TRIGGERS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={draft.trigger === s}
                    onClick={() => {
                      set("trigger", s);
                      setTimeout(next, 160);
                    }}
                  />
                ))}
              </Question>
            )}

            {/* Step 5 — who for */}
            {step === 4 && (
              <Question key="s4" title="Who are you doing this for?">
                {FORS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={draft.doingItFor === s}
                    onClick={() => set("doingItFor", s)}
                  />
                ))}
                {draft.doingItFor && draft.doingItFor !== "Myself" && (
                  <input
                    value={draft.lovedOneName ?? ""}
                    onChange={(e) => set("lovedOneName", e.target.value)}
                    placeholder="Their name (optional) — e.g. Ananya"
                    aria-label="Loved one's name"
                    maxLength={40}
                    className="mt-1 w-full rounded-2xl bg-surface px-5 py-3.5 text-base text-slate-50 shadow-float outline-none placeholder:text-slate-500"
                  />
                )}
                <div className="pt-2">
                  <PrimaryButton disabled={!draft.doingItFor} onClick={next}>
                    Continue
                  </PrimaryButton>
                </div>
              </Question>
            )}

            {/* Step 6 — spend + desire + language */}
            {step === 5 && (
              <Question key="s5" title="What would you rather spend it on?">
                <div className="rounded-2xl bg-surface p-5 shadow-float">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-400">Daily spend</span>
                    <span className="font-display text-2xl text-teal">
                      ₹{draft.dailySpend ?? 300}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={25}
                    value={draft.dailySpend ?? 300}
                    onChange={(e) => set("dailySpend", Number(e.target.value))}
                    aria-label="Daily spend in rupees"
                    className="mt-3 w-full accent-teal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DESIRES.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      selected={draft.desire === s}
                      onClick={() => set("desire", s)}
                    />
                  ))}
                </div>
                <div className="rounded-2xl bg-surface p-2 shadow-float">
                  <div className="grid grid-cols-3 gap-1" role="group" aria-label="Language">
                    {(
                      [
                        { l: "தமிழ்", v: "ta" },
                        { l: "English", v: "en" },
                        { l: "Mix", v: "mix" },
                      ] as { l: string; v: Language }[]
                    ).map((o) => (
                      <button
                        key={o.v}
                        onClick={() => set("language", o.v)}
                        aria-pressed={draft.language === o.v}
                        className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                          draft.language === o.v
                            ? "bg-gradient-to-r from-teal to-lavender text-base"
                            : "text-slate-300"
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <PrimaryButton disabled={!draft.desire} onClick={finish}>
                    I&apos;m ready
                  </PrimaryButton>
                </div>
              </Question>
            )}

            {/* Payoff */}
            {step === TOTAL && (
              <motion.div key="payoff" {...fade} className="flex flex-1 flex-col items-center justify-center text-center">
                <Orb size={200} />
                <div className="mt-8 min-h-[96px]">
                  {loadingPayoff || !payoff ? (
                    <p className="animate-pulse font-display text-xl text-slate-300">
                      Getting things ready for you…
                    </p>
                  ) : (
                    <>
                      <p className="font-display text-2xl leading-snug text-slate-50">
                        {payoff.text}
                      </p>
                      <Transparency meta={payoff.meta} lang={lang} />
                    </>
                  )}
                </div>
                {payoff && (
                  <div className="mt-10 w-full space-y-4">
                    <p className="text-sm text-slate-400">
                      When it gets heavy, press the circle.
                    </p>
                    <PrimaryButton onClick={() => router.replace("/home")}>
                      Take me in <ArrowRight size={18} className="ml-1 inline" />
                    </PrimaryButton>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div {...fade} className="flex flex-1 flex-col">
      <h1 className="font-display text-3xl font-semibold leading-tight text-slate-50">
        {title}
      </h1>
      <div className="mt-8 space-y-3">{children}</div>
    </motion.div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-gradient-to-r from-teal to-lavender py-4 text-lg font-semibold text-base shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
    >
      {children}
    </button>
  );
}
