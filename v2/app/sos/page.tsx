"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, Check } from "lucide-react";
import RevealText from "@/components/RevealText";
import Transparency from "@/components/Transparency";
import Skeleton from "@/components/Skeleton";
import { useProfile } from "@/lib/use-profile";
import { speak, stopSpeaking } from "@/lib/tts";
import { logEvent } from "@/lib/events";
import { fontClassFor, type AiMeta, type Profile, type ScriptResponse } from "@/lib/types";

const CALL_NUMBER = "+919500756675"; // "Kumar" — the user's real supporter contact

export default function SosPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  if (!profile) {
    return <main className="min-h-dvh bg-base" aria-busy />;
  }
  return <Sos profile={profile} />;
}

function Sos({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [script, setScript] = useState<string | null>(null);
  const [meta, setMeta] = useState<AiMeta | null>(null);
  const [closing, setClosing] = useState<{ text: string; meta: AiMeta } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void logEvent("sos", profile.name, { trigger: profile.trigger });

    (async () => {
      try {
        const res = await fetch("/api/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile,
            localTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }),
        });
        const data = (await res.json()) as ScriptResponse;
        setScript(data.text);
        setMeta(data.meta);
        void speak(data.text, profile.language);
      } catch {
        setScript("Breathe with me. In… and out. This moment will pass.");
        setMeta({ provider: "offline", modelId: "pre-written", latencyMs: 0, isOfflineFallback: true });
      }
    })();

    return () => stopSpeaking();
  }, [profile]);

  async function onOkay() {
    stopSpeaking();
    void logEvent("okay", profile.name, {});
    try {
      const res = await fetch("/api/okay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = (await res.json()) as ScriptResponse;
      setClosing(data);
      void speak(data.text, profile.language);
      setTimeout(() => router.replace("/home"), 3200);
    } catch {
      router.replace("/home");
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-base">
      {/* breathing background — the orb continues, everything else fades up */}
      <motion.div
        aria-hidden
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.6, opacity: 0.35 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="orb-breathe pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 45% 40%, rgba(45,212,191,0.5), rgba(167,139,250,0.4) 55%, transparent 74%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
        {closing ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="font-display text-3xl leading-snug text-slate-50">{closing.text}</p>
            <div className="mt-2 flex justify-center">
              <Transparency meta={closing.meta} lang={profile.language} />
            </div>
          </motion.div>
        ) : (
          <>
            <div className="min-h-[160px]">
              {!script || !meta ? (
                <Skeleton lines={4} />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <RevealText
                    text={script}
                    className={`text-2xl leading-relaxed text-slate-50 ${fontClassFor(
                      profile.language,
                    )}`}
                  />
                  <Transparency meta={meta} lang={profile.language} />
                </motion.div>
              )}
            </div>

            <div className="mt-10 space-y-3">
              <a
                href={`tel:${CALL_NUMBER}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-5 text-lg font-semibold text-slate-50 shadow-float active:scale-[0.98]"
              >
                <Phone size={20} className="text-teal" /> Call Kumar
              </a>
              <button
                onClick={onOkay}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal to-lavender py-5 text-lg font-semibold text-base shadow-glow active:scale-[0.98]"
              >
                <Check size={20} /> I&apos;m okay now
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
