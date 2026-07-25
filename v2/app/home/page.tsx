"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HeartHandshake, MessageCircle, Zap } from "lucide-react";
import Orb from "@/components/Orb";
import CountUp from "@/components/CountUp";
import { useProfile } from "@/lib/use-profile";
import { daysInRecovery, rupeesSaved } from "@/lib/profile-store";
import { t } from "@/lib/copy";
import type { Profile } from "@/lib/types";

export default function Home() {
  const { profile, ready } = useProfile();
  const router = useRouter();
  const [persona, setPersona] = useState<"you" | "caregiver">("you");

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);

  useEffect(() => {
    if (persona === "caregiver") router.push("/caregiver");
  }, [persona, router]);

  if (!profile) {
    return (
      <main className="grid min-h-dvh place-items-center bg-base">
        <Orb size={120} />
      </main>
    );
  }

  return <HomeView profile={profile} persona={persona} setPersona={setPersona} />;
}

function HomeView({
  profile,
  persona,
  setPersona,
}: {
  profile: Profile;
  persona: "you" | "caregiver";
  setPersona: (p: "you" | "caregiver") => void;
}) {
  const router = useRouter();
  const days = useMemo(() => daysInRecovery(profile), [profile]);
  const rupees = useMemo(() => rupeesSaved(profile), [profile]);
  const lang = profile.language;

  const greeting =
    lang === "en" ? `Hello, ${profile.name}` : `${t("greeting", lang)}, ${profile.name}`;
  const towardWhom = profile.lovedOneName ?? profile.desire;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 py-6">
      {/* persona switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-surface p-1 shadow-float" role="tablist" aria-label="View">
          {(
            [
              { k: "you", label: t("you", lang) },
              { k: "caregiver", label: t("caregiver", lang) },
            ] as const
          ).map((o) => (
            <button
              key={o.k}
              role="tab"
              aria-selected={persona === o.k}
              onClick={() => setPersona(o.k)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                persona === o.k ? "bg-gradient-to-r from-teal to-lavender text-base" : "text-slate-300"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`mt-8 text-center font-display text-3xl font-semibold text-slate-50 ${
          lang !== "en" ? "font-tamil" : ""
        }`}
      >
        {greeting}
      </motion.h1>

      {/* the orb — SOS */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
        <Orb size={230} onPress={() => router.push("/sos")} label="SOS — press when a craving hits" />
        <p className="text-center text-sm text-slate-400">{t("pressCircle", lang)}</p>
      </div>

      {/* counters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06, ease: "easeOut" }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-2xl bg-surface p-4 shadow-float">
          <p className="font-display text-3xl text-teal">
            <CountUp value={days} />
          </p>
          <p className="mt-1 text-xs text-slate-400">{t("daysLabel", lang)} in recovery</p>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-float">
          <p className="font-display text-3xl text-lavender">
            <CountUp value={rupees} prefix="₹" />
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {t("towardLabel", lang)} {towardWhom}
          </p>
        </div>
      </motion.div>

      {/* secondary actions */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <ActionButton icon={<MessageCircle size={18} />} label={t("checkIn", lang)} onClick={() => router.push("/checkin")} />
        <ActionButton icon={<Zap size={18} />} label={t("cravingHit", lang)} onClick={() => router.push("/swap")} />
        <ActionButton icon={<HeartHandshake size={18} />} label={t("iSlipped", lang)} onClick={() => router.push("/slip")} />
      </div>

      {profile.isSample && (
        <p className="mt-4 text-center text-xs text-slate-500">Viewing sample data (Ravi)</p>
      )}
    </main>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface px-2 py-3 text-center text-xs font-medium text-slate-200 shadow-float transition-transform active:scale-95"
    >
      <span className="text-teal">{icon}</span>
      {label}
    </button>
  );
}
