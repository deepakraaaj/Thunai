"use client";

import React, { useState } from "react";
import { UserProfile } from "@contracts/types";
import { getActiveUser } from "../services/api";
import { IndividualHome } from "../features/dashboard/IndividualHome";
import { SosFlow } from "../features/sos/SosFlow";
import { VoiceCheckin } from "../features/checkin/VoiceCheckin";
import { SlipFlow } from "../features/slip/SlipFlow";
import { CaregiverDashboard } from "../features/caregiver/CaregiverDashboard";
import { PredictiveAndLearnHub } from "../features/predictive/PredictiveAndLearnHub";
import { ScenarioControl } from "../components/ScenarioControl";
import { Smartphone, Monitor, BookOpen, Anchor as AnchorIcon } from "lucide-react";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getActiveUser());
  const [activeTab, setActiveTab] = useState<"individual" | "caregiver" | "learn">("individual");
  const [showSos, setShowSos] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showSlip, setShowSlip] = useState(false);

  const handlePersonaChange = (newUser: UserProfile) => {
    setCurrentUser(newUser);
  };

  return (
    <main className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-teal-500 selection:text-slate-950">
      {/* Top Application Header Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 font-black shadow-md shadow-teal-500/20">
              <AnchorIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-100 tracking-tight flex items-center gap-1.5">
                Anchor <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Recovery</span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Web-only • Mobile-first crisis &amp; zero-typing platform
              </p>
            </div>
          </div>

          {/* Persona & Viewport Selector */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab("individual")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "individual"
                  ? "bg-teal-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Individual View</span>
            </button>

            <button
              onClick={() => setActiveTab("caregiver")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "caregiver"
                  ? "bg-lavender-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Caregiver Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("learn")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "learn"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Learn &amp; Insights</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-6">
        {activeTab === "individual" && (
          <div className="mx-auto max-w-md">
            {/* Mobile Viewport Wrapper */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4 shadow-2xl">
              <IndividualHome
                user={currentUser}
                onOpenSos={() => setShowSos(true)}
                onOpenCheckin={() => setShowCheckin(true)}
                onOpenSlip={() => setShowSlip(true)}
              />
            </div>
          </div>
        )}

        {activeTab === "caregiver" && (
          <div className="mx-auto max-w-4xl">
            <CaregiverDashboard />
          </div>
        )}

        {activeTab === "learn" && (
          <div className="mx-auto max-w-2xl">
            <PredictiveAndLearnHub user={currentUser} />
          </div>
        )}
      </div>

      {/* Modals & Fullscreen Overlays */}
      {showSos && (
        <SosFlow user={currentUser} onClose={() => setShowSos(false)} />
      )}

      {showCheckin && (
        <VoiceCheckin
          user={currentUser}
          onClose={() => setShowCheckin(false)}
          onCheckinComplete={() => setCurrentUser({ ...currentUser })}
        />
      )}

      {showSlip && (
        <SlipFlow user={currentUser} onClose={() => setShowSlip(false)} />
      )}

      {/* Floating "Load test scenario" Seeder Control */}
      <ScenarioControl
        activeUser={currentUser}
        onPersonaChange={handlePersonaChange}
      />
    </main>
  );
}
