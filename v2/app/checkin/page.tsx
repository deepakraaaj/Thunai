"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, Phone } from "lucide-react";
import Transparency from "@/components/Transparency";
import Skeleton from "@/components/Skeleton";
import { useProfile } from "@/lib/use-profile";
import { useSpeech } from "@/lib/use-speech";
import { speak, stopSpeaking } from "@/lib/tts";
import { logEvent } from "@/lib/events";
import { t } from "@/lib/copy";
import type { CheckinResponse, Profile } from "@/lib/types";

const TELE_MANAS = "14416";

export default function CheckinPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();
  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);
  if (!profile) return <main className="min-h-dvh bg-base" aria-busy />;
  return <Checkin profile={profile} />;
}

function Checkin({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { transcript, setTranscript, listening, supported, start, stop } = useSpeech(
    profile.language,
  );
  const [phase, setPhase] = useState<"speak" | "loading" | "done">("speak");
  const [result, setResult] = useState<CheckinResponse | null>(null);

  useEffect(() => () => stopSpeaking(), []);

  async function submit() {
    stop();
    if (!transcript.trim()) return;
    setPhase("loading");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, transcript: transcript.trim() }),
      });
      const data = (await res.json()) as CheckinResponse;
      setResult(data);
      setPhase("done");
      void logEvent("checkin", profile.name, { mood: data.mood });
      void speak(data.reflection, profile.language);
    } catch {
      setResult({
        mood: "here",
        riskLevel: "low",
        reflection: "Thank you for checking in. Showing up like this counts.",
        meta: { provider: "offline", modelId: "pre-written", latencyMs: 0, isOfflineFallback: true },
      });
      setPhase("done");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-6">
      <header className="flex items-center gap-3">
        <button
          onClick={() => router.replace("/home")}
          aria-label="Back to home"
          className="rounded-full p-2 text-slate-300 hover:bg-surface"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-semibold text-slate-50">
          {t("checkIn", profile.language)}
        </h1>
      </header>

      <div className="flex flex-1 flex-col justify-center">
        <AnimatePresence mode="wait">
          {phase === "speak" && (
            <motion.div
              key="speak"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center text-center"
            >
              <p className="mb-8 font-display text-2xl text-slate-100">
                {t("holdToTalk", profile.language)}
              </p>

              {supported ? (
                <button
                  onMouseDown={start}
                  onMouseUp={stop}
                  onTouchStart={start}
                  onTouchEnd={stop}
                  aria-label={listening ? "Listening — release to stop" : "Hold to talk"}
                  aria-pressed={listening}
                  className={`grid h-40 w-40 place-items-center rounded-full shadow-glow transition-transform active:scale-95 ${
                    listening
                      ? "bg-gradient-to-br from-teal to-lavender orb-breathe"
                      : "bg-surface"
                  }`}
                >
                  <Mic size={48} className={listening ? "text-base" : "text-teal"} />
                </button>
              ) : (
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value.slice(0, 600))}
                  placeholder="Tell me how today felt…"
                  aria-label="How today felt"
                  rows={4}
                  className="w-full rounded-2xl bg-surface p-4 text-lg text-slate-50 shadow-float outline-none placeholder:text-slate-500"
                />
              )}

              <p className="mt-6 min-h-[48px] px-4 text-slate-300">{transcript}</p>

              <button
                onClick={submit}
                disabled={!transcript.trim()}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-teal to-lavender py-4 text-lg font-semibold text-base shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
              >
                Share with Anchor
              </button>
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Skeleton lines={4} />
            </motion.div>
          )}

          {phase === "done" && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-sm text-slate-300 shadow-float">
                <span className="h-2 w-2 rounded-full bg-teal" /> feeling {result.mood}
              </div>
              <p
                className={`font-display text-xl leading-relaxed text-slate-50 ${
                  profile.language !== "en" ? "font-tamil" : ""
                }`}
              >
                {result.reflection}
              </p>
              <Transparency meta={result.meta} lang={profile.language} />

              {result.riskLevel === "high" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-danger/10 p-5 ring-1 ring-danger/40"
                >
                  <p className="font-semibold text-danger">You don&apos;t have to hold this alone.</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Tele-MANAS is free, confidential, and there right now.
                  </p>
                  <a
                    href={`tel:${TELE_MANAS}`}
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-danger py-3.5 text-lg font-semibold text-white active:scale-[0.98]"
                  >
                    <Phone size={20} /> Call Tele-MANAS {TELE_MANAS}
                  </a>
                </motion.div>
              )}

              <button
                onClick={() => router.replace("/home")}
                className="w-full rounded-2xl bg-surface py-4 text-lg font-medium text-slate-200 shadow-float active:scale-[0.98]"
              >
                Back home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
