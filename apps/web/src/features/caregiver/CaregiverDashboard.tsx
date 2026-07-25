"use client";

import React, { useEffect, useState, useCallback } from "react";
import { LinkedUserStatus, CaregiverScriptResponse } from "@contracts/types";
import { getCaregiverDashboard, postCaregiverScript } from "../../services/api";
import { AiTransparencyDrawer } from "../../components/AiTransparencyDrawer";
import { Bell, ShieldAlert, UserCheck, PhoneCall, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const CaregiverDashboard: React.FC = () => {
  const [linkedUsers, setLinkedUsers] = useState<LinkedUserStatus[]>([]);
  const [activeSosAlert, setActiveSosAlert] = useState<boolean>(false);
  const [coachingScript, setCoachingScript] = useState<CaregiverScriptResponse | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);

  const triggerCoachingScript = useCallback(async () => {
    setLoadingScript(true);
    try {
      const scriptRes = await postCaregiverScript({ sosEventId: "sos-evt-live" });
      setCoachingScript(scriptRes);
      setLoadingScript(false);
    } catch (e) {
      console.error(e);
      setLoadingScript(false);
    }
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      const data = await getCaregiverDashboard("cg-priya-101");
      setLinkedUsers(data.linkedUsers);
    }
    loadDashboard();

    // SSE / Polling Channel simulator for real-time SOS alerts
    const interval = setInterval(async () => {
      const data = await getCaregiverDashboard("cg-priya-101");
      setLinkedUsers(data.linkedUsers);

      const hasSos = data.linkedUsers.some((u) => u.latestRiskLevel === "critical");
      if (hasSos && !activeSosAlert) {
        setActiveSosAlert(true);
        triggerCoachingScript();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeSosAlert, triggerCoachingScript]);

  return (
    <div className="space-y-6">
      {/* Caregiver Portal Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-5 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-lavender-500/20 px-2.5 py-0.5 text-xs font-medium text-lavender-300 border border-lavender-500/30">
              <UserCheck className="h-3.5 w-3.5" /> Caregiver Portal • Consent Linked
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            Priya&apos;s Sponsor Companion Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Real-time SSE monitoring &amp; live AI coaching scripts during high-risk moments
          </p>
        </div>

        <button
          onClick={() => {
            setActiveSosAlert(true);
            triggerCoachingScript();
          }}
          className="flex items-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all self-start sm:self-auto"
        >
          <Bell className="h-4 w-4 text-amber-400 animate-bounce" /> Simulate SOS Alert Channel
        </button>
      </div>

      {/* SOS REAL-TIME CRITICAL ALERT BANNER */}
      <AnimatePresence>
        {activeSosAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-3xl border-2 border-rose-500/50 bg-rose-950/30 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-rose-600 p-2 text-white">
                  <ShieldAlert className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-rose-400 tracking-wider">
                    CRITICAL SOS MOMENT DETECTED
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Ravi triggered SOS Panic Mode
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveSosAlert(false)}
                className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:text-white"
              >
                Dismiss Alert
              </button>
            </div>

            {/* Live Coaching Script ("Say This / Not That") */}
            <div className="rounded-2xl bg-slate-900 p-4 border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-teal-300">
                <Sparkles className="h-4 w-4 text-teal-400" />
                Live Coaching Guide (&ldquo;Say This / Not That&rdquo;)
              </div>
              {loadingScript ? (
                <p className="text-xs text-slate-400 animate-pulse">Generating coaching guide...</p>
              ) : (
                <p className="text-sm font-medium text-slate-200 leading-relaxed">
                  {coachingScript?.script}
                </p>
              )}

              {/* AI Transparency Drawer */}
              {coachingScript && <AiTransparencyDrawer meta={coachingScript.meta} />}
            </div>

            {/* Quick Action Button */}
            <div className="flex gap-3">
              <a
                href="tel:9876543210"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-all shadow-md"
              >
                <PhoneCall className="h-4 w-4" /> Call Ravi Immediately
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Linked Users Status Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Linked Recovery Partners ({linkedUsers.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {linkedUsers.map((user) => (
            <div
              key={user.userId}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-100">{user.name}</h4>
                  <p className="text-xs text-slate-400">Consent Verified • Individual Persona</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-teal-300">{user.daysSober}</span>
                  <span className="text-xs text-slate-400 block">Days Sober</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Risk Level:</span>
                <span
                  className={`font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    user.latestRiskLevel === "critical"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : user.latestRiskLevel === "high"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  }`}
                >
                  {user.latestRiskLevel}
                </span>
              </div>

              {/* Timeline Feed */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400">Recent Timeline:</span>
                {user.latestEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start justify-between rounded-lg bg-slate-950/60 p-2.5 text-xs border border-slate-800/60"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{evt.title}</span>
                      {evt.detail && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{evt.detail}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                      {new Date(evt.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
