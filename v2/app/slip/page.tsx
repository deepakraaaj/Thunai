"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Transparency from "@/components/Transparency";
import Skeleton from "@/components/Skeleton";
import CountUp from "@/components/CountUp";
import { useProfile } from "@/lib/use-profile";
import { daysInRecovery } from "@/lib/profile-store";
import { speak, stopSpeaking } from "@/lib/tts";
import { logEvent } from "@/lib/events";
import { fontClassFor, type Profile, type SlipResponse } from "@/lib/types";
import { postJson } from "@/lib/api-client";

export default function SlipPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();
  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);
  if (!profile) return <main className="min-h-dvh bg-base" aria-busy />;
  return <Slip profile={profile} />;
}

function Slip({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [result, setResult] = useState<SlipResponse | null>(null);
  const days = daysInRecovery(profile);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void logEvent("slip", profile.name, {});
    (async () => {
      try {
        const data = await postJson<SlipResponse>("/api/slip", { profile });
        setResult(data);
        void speak(data.text, profile.language);
      } catch {
        setResult({
          text: "This doesn't erase what you've built. The days you've lived still count.",
          whatsappDraft: "Hey — I'm having a rough moment and could use some company.",
          meta: { provider: "offline", modelId: "pre-written", latencyMs: 0, isOfflineFallback: true },
        });
      }
    })();
    return () => {
      stopSpeaking();
    };
  }, [profile]);

  const whatsappNumber = profile.supporterPhone?.replace(/\D/g, "");
  const waHref = result
    ? `https://wa.me/${whatsappNumber ?? ""}?text=${encodeURIComponent(result.whatsappDraft)}`
    : "#";

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
      </header>

      <div className="flex flex-1 flex-col justify-center">
        {/* headline: total days lived — never reset */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="font-display text-6xl font-semibold text-teal">
            <CountUp value={days} />
          </p>
          <p className="mt-2 text-slate-300">days you have lived in recovery — still yours.</p>
        </motion.div>

        <div className="mt-10 min-h-[140px]">
          {!result ? (
            <Skeleton lines={4} />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p
                className={`text-xl leading-relaxed text-slate-50 ${fontClassFor(
                  profile.language,
                )}`}
              >
                {result.text}
              </p>
              <Transparency meta={result.meta} lang={profile.language} />
            </motion.div>
          )}
        </div>

        {result && (
          <div className="mt-8 space-y-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-teal to-lavender py-4 text-lg font-semibold text-base shadow-glow active:scale-[0.98]"
            >
              Send on WhatsApp
            </a>
            <button
              onClick={() => router.replace("/home")}
              className="w-full rounded-2xl bg-surface py-4 text-lg font-medium text-slate-200 shadow-float active:scale-[0.98]"
            >
              Not today
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
