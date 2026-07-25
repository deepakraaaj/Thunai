"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bell, BellRing, HeartHandshake, MapPin, MessageCircle, Zap, Check, X } from "lucide-react";
import Transparency from "@/components/Transparency";
import Skeleton from "@/components/Skeleton";
import { useProfile } from "@/lib/use-profile";
import { fetchEvents, subscribeEvents } from "@/lib/events";
import { relativeTime } from "@/lib/relative-time";
import type { AiMeta, RecoveryEvent, EventType, Profile } from "@/lib/types";
import { postJson } from "@/lib/api-client";
import { enableCaregiverAlerts, notifyCaregiver } from "@/lib/caregiver-alerts";

const EVENT_META: Record<EventType, { icon: React.ReactNode; label: string; tone: string }> = {
  sos: { icon: <Bell size={16} />, label: "Pressed SOS", tone: "text-teal" },
  "nearby-risk": { icon: <MapPin size={16} />, label: "Near a risky location", tone: "text-amber" },
  checkin: { icon: <MessageCircle size={16} />, label: "Checked in", tone: "text-lavender" },
  slip: { icon: <HeartHandshake size={16} />, label: "Had a slip", tone: "text-amber" },
  swap: { icon: <Zap size={16} />, label: "Faced a craving", tone: "text-teal" },
  okay: { icon: <Check size={16} />, label: "Rode it out", tone: "text-teal" },
};

export default function CaregiverPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();
  const [watchName, setWatchName] = useState<string | null>(null);

  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get("watch")?.trim();
    setWatchName(name ? name.slice(0, 40) : "");
  }, []);

  useEffect(() => {
    if (ready && watchName === "" && !profile) router.replace("/onboarding");
  }, [ready, watchName, profile, router]);

  if (!ready || watchName === null) {
    return <main className="min-h-dvh bg-base" aria-busy />;
  }
  if (profile) return <Caregiver profile={profile} watchedName={watchName || profile.name} />;
  if (!watchName) return <main className="min-h-dvh bg-base" aria-busy />;

  const linkedProfile: Profile = {
    name: watchName,
    substance: "Something else",
    stage: "just-starting",
    startDays: 0,
    createdAt: 0,
    trigger: "Evenings",
    doingItFor: "Myself",
    dailySpend: 0,
    desire: "Saving up",
    language: "en",
  };
  return <Caregiver profile={linkedProfile} watchedName={watchName} linked />;
}

function Caregiver({
  profile,
  watchedName,
  linked = false,
}: {
  profile: Profile;
  watchedName: string;
  linked?: boolean;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<RecoveryEvent[] | null>(null);
  const [coaching, setCoaching] = useState<{ text: string; meta: AiMeta } | null>(null);
  const [alerting, setAlerting] = useState(false);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [activeAlert, setActiveAlert] = useState<RecoveryEvent | null>(null);
  const [notificationState, setNotificationState] = useState<
    NotificationPermission | "unsupported" | "unknown"
  >("unknown");
  const seen = useRef<Set<string>>(new Set());

  const onSosAlert = useCallback(async () => {
    setAlerting(true);
    setLoadingCoach(true);
    setCoaching(null);
    try {
      const data = await postJson<{ text: string; meta: AiMeta }>(
        "/api/caregiver-script",
        { profile },
      );
      setCoaching(data);
    } catch {
      setCoaching({
        text: "SAY:\n- I'm here with you.\nAVOID:\n- Don't lecture right now.",
        meta: {
          provider: "offline",
          modelId: "pre-written",
          latencyMs: 0,
          isOfflineFallback: true,
        },
      });
    } finally {
      setLoadingCoach(false);
    }
  }, [profile]);

  useEffect(() => {
    let active = true;
    fetchEvents(watchedName).then((e) => {
      if (active) {
        e.forEach((ev) => seen.current.add(ev.id));
        setEvents(e);
        const latestAlert = e.find(
          (event) => event.type === "nearby-risk" || event.type === "sos",
        );
        if (latestAlert?.type === "nearby-risk") {
          setActiveAlert(latestAlert);
          setAlerting(true);
        } else if (latestAlert?.type === "sos") {
          setActiveAlert(latestAlert);
          void onSosAlert();
        }
      }
    });
    const unsub = subscribeEvents(watchedName, (evt) => {
      if (seen.current.has(evt.id)) return;
      seen.current.add(evt.id);
      setEvents((prev) => [evt, ...(prev ?? [])]);
      if (evt.type === "sos") {
        setActiveAlert(evt);
        notifyCaregiver({ personName: watchedName, type: "sos" });
        void onSosAlert();
      }
      if (evt.type === "nearby-risk") {
        setActiveAlert(evt);
        notifyCaregiver({
          personName: watchedName,
          type: "nearby-risk",
          placeName:
            typeof evt.payload.placeName === "string" ? evt.payload.placeName : undefined,
          distanceMeters:
            typeof evt.payload.distanceMeters === "number"
              ? evt.payload.distanceMeters
              : undefined,
        });
        setAlerting(true);
        setLoadingCoach(false);
        setCoaching(null);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, [onSosAlert, watchedName]);

  async function enableAlerts() {
    const state = await enableCaregiverAlerts();
    setNotificationState(state);
    if (state === "granted") {
      notifyCaregiver({ personName: watchedName, type: "nearby-risk", placeName: "test alert" });
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 py-6">
      <header className="flex items-center gap-3">
        <button
          onClick={() => router.replace("/home")}
          aria-label="Back to home"
          className="rounded-full p-2 text-slate-300 hover:bg-surface"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-50">
            You&apos;re supporting {watchedName}
          </h1>
          <p className="text-sm text-slate-400">Their moments show up here in real time.</p>
          {linked && <p className="mt-1 text-xs font-medium text-teal">Connected through Supabase Realtime</p>}
        </div>
      </header>

      <button
        onClick={() => void enableAlerts()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-teal/30 bg-teal/10 py-3 text-sm font-semibold text-teal"
      >
        <BellRing size={17} />
        {notificationState === "granted"
          ? "Sound, vibration & browser alerts enabled"
          : notificationState === "denied"
            ? "Browser alerts blocked — enable them in site settings"
            : notificationState === "unsupported"
              ? "Sound alerts enabled"
              : "Enable caregiver alerts"}
      </button>

      {/* SOS alert + auto coaching */}
      <AnimatePresence>
        {alerting && (
          <motion.section
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="mt-5 rounded-2xl bg-gradient-to-br from-teal/20 to-lavender/15 p-5 shadow-glow ring-1 ring-teal/40"
          >
            <div className="flex items-center justify-between">
              <p className={`flex items-center gap-2 font-semibold ${activeAlert?.type === "nearby-risk" ? "text-amber" : "text-teal"}`}>
                {activeAlert?.type === "nearby-risk" ? <MapPin size={18} /> : <Bell size={18} />}
                {activeAlert?.type === "nearby-risk"
                  ? `${watchedName} may be near a risky location`
                  : `${watchedName} just needs support right now`}
              </p>
              <button
                onClick={() => setAlerting(false)}
                aria-label="Dismiss alert"
                className="rounded-full p-1 text-slate-300 hover:bg-black/20"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4">
              {activeAlert?.type === "nearby-risk" ? (
                <div className="space-y-3">
                  <p className="text-slate-100">
                    Near {String(activeAlert.payload.placeName ?? "a wine shop")}
                    {typeof activeAlert.payload.distanceMeters === "number"
                      ? ` · ${activeAlert.payload.distanceMeters}m away`
                      : ""}
                  </p>
                  {activeAlert.payload.simulated === true && (
                    <p className="inline-flex rounded-full bg-lavender/15 px-3 py-1 text-xs text-lavender">
                      Judge simulation
                    </p>
                  )}
                  <p className="text-sm text-slate-300">
                    Reach out gently: “I’m here with you. Want me to stay on the phone for a few minutes?”
                  </p>
                </div>
              ) : loadingCoach || !coaching ? (
                <Skeleton lines={4} />
              ) : (
                <>
                  <CoachingLists text={coaching.text} />
                  <Transparency meta={coaching.meta} lang="en" />
                </>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* timeline */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
          Timeline
        </h2>
        {events === null ? (
          <div className="space-y-3">
            <Skeleton lines={2} />
            <Skeleton lines={2} />
          </div>
        ) : events.length === 0 ? (
          <EmptyTimeline name={watchedName} />
        ) : (
          <ul className="space-y-3">
            {events.map((e) => {
              const m = EVENT_META[e.type];
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-float"
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-full bg-black/30 ${m.tone}`}>
                    {m.icon}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-100">{m.label}</p>
                    {typeof e.payload?.mood === "string" && (
                      <p className="text-xs text-slate-400">felt {e.payload.mood}</p>
                    )}
                    {e.type === "nearby-risk" && (
                      <p className="text-xs text-slate-400">
                        {String(e.payload.placeName ?? "wine shop")} · {String(e.payload.distanceMeters ?? "?")}m
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{relativeTime(e.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

/** Render the SAY / AVOID lists produced by the caregiver prompt. */
function CoachingLists({ text }: { text: string }) {
  const sayMatch = text.match(/SAY:\s*([\s\S]*?)(?:AVOID:|$)/i);
  const avoidMatch = text.match(/AVOID:\s*([\s\S]*)$/i);
  const toLines = (s?: string) =>
    (s ?? "")
      .split("\n")
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  const say = toLines(sayMatch?.[1]);
  const avoid = toLines(avoidMatch?.[1]);

  if (say.length === 0 && avoid.length === 0) {
    return <p className="whitespace-pre-line text-slate-100">{text}</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal">Say this</p>
        <ul className="space-y-1.5">
          {say.map((l, i) => (
            <li key={i} className="flex gap-2 text-slate-100">
              <Check size={16} className="mt-0.5 shrink-0 text-teal" /> {l}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber">Avoid saying</p>
        <ul className="space-y-1.5">
          {avoid.map((l, i) => (
            <li key={i} className="flex gap-2 text-slate-300">
              <X size={16} className="mt-0.5 shrink-0 text-amber" /> {l}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EmptyTimeline({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-surface/50 p-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-black/30 text-teal">
        <HeartHandshake size={22} />
      </div>
      <p className="font-medium text-slate-200">All quiet for now</p>
      <p className="mt-1 text-sm text-slate-400">
        When {name} checks in or reaches for support, you&apos;ll see it here — and get a gentle
        script for how to help.
      </p>
    </div>
  );
}
