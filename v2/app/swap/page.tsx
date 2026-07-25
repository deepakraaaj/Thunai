"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, LifeBuoy } from "lucide-react";
import Transparency from "@/components/Transparency";
import Skeleton from "@/components/Skeleton";
import { useProfile } from "@/lib/use-profile";
import { speak, stopSpeaking } from "@/lib/tts";
import { logEvent } from "@/lib/events";
import { fontClassFor, type Desire, type Profile, type SwapResponse } from "@/lib/types";

/** A real Maps search per desire, so the swap has somewhere to go. */
function mapsQuery(desire: Desire): string {
  switch (desire) {
    case "Good food":
      return "restaurants near me";
    case "A gadget":
      return "electronics store near me";
    case "For my child":
      return "toy store near me";
    case "Saving up":
    default:
      return "bank near me";
  }
}

export default function SwapPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();
  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);
  if (!profile) return <main className="min-h-dvh bg-base" aria-busy />;
  return <Swap profile={profile} />;
}

function Swap({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [result, setResult] = useState<SwapResponse | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void logEvent("swap", profile.name, {});
    (async () => {
      try {
        const res = await fetch("/api/swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        });
        const data = (await res.json()) as SwapResponse;
        setResult(data);
        void speak(data.text, profile.language);
      } catch {
        setResult({
          text: "That money could become something you actually want. It adds up faster than it feels.",
          meta: { provider: "offline", modelId: "pre-written", latencyMs: 0, isOfflineFallback: true },
        });
      }
    })();
    return () => stopSpeaking();
  }, [profile]);

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    mapsQuery(profile.desire),
  )}`;
  const week = Math.round(profile.dailySpend) * 7;

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
        <h1 className="font-display text-2xl font-semibold text-slate-50">Craving hit?</h1>
      </header>

      <div className="flex flex-1 flex-col justify-center">
        <div className="min-h-[130px]">
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
            {/* the swap card */}
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl bg-gradient-to-br from-teal/20 to-lavender/15 p-5 shadow-float ring-1 ring-teal/30 active:scale-[0.98]"
            >
              <p className="text-sm text-slate-300">This week that&apos;s</p>
              <p className="font-display text-3xl text-teal">₹{week.toLocaleString("en-IN")}</p>
              <p className="mt-1 flex items-center gap-1.5 text-slate-100">
                Toward {profile.desire} <ExternalLink size={15} className="text-teal" />
              </p>
            </a>

            {/* escalate to SOS */}
            <button
              onClick={() => router.push("/sos")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-4 text-lg font-medium text-slate-200 shadow-float active:scale-[0.98]"
            >
              <LifeBuoy size={20} className="text-lavender" /> I need more help
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
