"use client";

import React, { useState } from "react";
import { UserProfile } from "@contracts/types";
import { LivingGarden } from "./LivingGarden";
import { UrgeSurfer } from "../tools/UrgeSurfer";
import { AnchorWall } from "../tools/AnchorWall";
import { SponsorChat } from "../tools/SponsorChat";
import { Mic, HeartHandshake, ShieldAlert, IndianRupee, Calendar, Shield, Sparkles, MessageCircle, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  user: UserProfile;
  onOpenSos: () => void;
  onOpenCheckin: () => void;
  onOpenSlip: () => void;
}

export const IndividualHome: React.FC<Props> = ({
  user,
  onOpenSos,
  onOpenCheckin,
  onOpenSlip,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"garden" | "urge" | "anchors" | "chat">("garden");

  // Calculate total money saved
  const dailySavings = user.dailyCostInr || 525;
  const totalSaved = user.daysSober * dailySavings;

  return (
    <div className="space-y-5 pb-12">
      {/* Top Greeting Header */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 border border-slate-800 shadow-md">
        <div>
          <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase">
            Anchor Recovery Companion
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-0.5">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Today is another step forward. We are walking with you.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-500/20">
            {user.language === "ta" ? "தமிழ் (Tamil)" : "English"}
          </span>
        </div>
      </div>

      {/* Interactive Tool Navigation Tabs */}
      <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800 gap-1">
        <button
          onClick={() => setActiveSubTab("garden")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeSubTab === "garden"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> Garden
        </button>

        <button
          onClick={() => setActiveSubTab("urge")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeSubTab === "urge"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="h-3.5 w-3.5" /> De-escalate
        </button>

        <button
          onClick={() => setActiveSubTab("anchors")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeSubTab === "anchors"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Heart className="h-3.5 w-3.5" /> Anchors
        </button>

        <button
          onClick={() => setActiveSubTab("chat")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeSubTab === "chat"
              ? "bg-teal-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" /> Chat
        </button>
      </div>

      {/* Tab Content Rendering */}
      {activeSubTab === "garden" && (
        <>
          <LivingGarden userName={user.name} daysSober={user.daysSober} />

          {/* Metric Cards (Sober Days & Rupee Counter) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sober Days Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Recovery Days</span>
                <div className="rounded-full bg-teal-500/10 p-2 text-teal-400">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-extrabold text-teal-300">{user.daysSober}</span>
                <span className="ml-1.5 text-xs text-slate-400">days lived</span>
              </div>
              <span className="mt-2 text-[11px] text-slate-400">
                Stage: <strong className="text-slate-200 capitalize">{user.stage}</strong>
              </span>
            </div>

            {/* Rupee Savings Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Saved Toward Goal</span>
                <div className="rounded-full bg-amber-500/10 p-2 text-amber-400">
                  <IndianRupee className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-extrabold text-amber-300">
                  ₹{totalSaved.toLocaleString("en-IN")}
                </span>
              </div>
              <span className="mt-2 text-[11px] text-amber-200/80 font-medium truncate">
                For {user.motivation}
              </span>
            </div>
          </div>
        </>
      )}

      {activeSubTab === "urge" && <UrgeSurfer />}
      {activeSubTab === "anchors" && <AnchorWall user={user} />}
      {activeSubTab === "chat" && <SponsorChat user={user} />}

      {/* ONE HUGE SOS BUTTON */}
      <div className="pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onOpenSos}
          className="group relative flex w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 shadow-2xl shadow-rose-600/30 transition-all hover:shadow-rose-600/50"
          aria-label="Activate SOS Emergency Craving Flow"
        >
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 blur opacity-40 group-hover:opacity-75 transition duration-300" />
          <div className="relative flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-3 text-white backdrop-blur-md">
              <ShieldAlert className="h-8 w-8 animate-pulse" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black tracking-widest text-rose-100 uppercase">
                EMERGENCY SUPPORT
              </span>
              <h2 className="text-2xl font-black text-white tracking-wide">
                ACTIVATE SOS
              </h2>
            </div>
          </div>
          <p className="relative mt-2 text-xs font-medium text-rose-100/90 text-center">
            Craving or crisis? Tap for high-contrast Tamil voice guidance &amp; sponsor contact
          </p>
        </motion.button>
      </div>

      {/* Primary Action Row: Voice Check-In & "I Slipped" */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Voice Check-in */}
        <button
          onClick={onOpenCheckin}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-teal-500/30 bg-slate-900/90 p-4 text-center transition-all hover:bg-slate-800/80 hover:border-teal-500/60 active:scale-95"
        >
          <div className="rounded-full bg-teal-500/20 p-3 text-teal-300">
            <Mic className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">Voice Check-In</h4>
            <p className="text-[11px] text-slate-400">Zero-typing speech reflection</p>
          </div>
        </button>

        {/* "I Slipped" Flow */}
        <button
          onClick={onOpenSlip}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-center transition-all hover:bg-slate-800/80 hover:border-slate-700 active:scale-95"
        >
          <div className="rounded-full bg-lavender-500/20 p-3 text-lavender-300">
            <HeartHandshake className="h-6 w-6 text-lavender-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">&ldquo;I Slipped&rdquo;</h4>
            <p className="text-[11px] text-slate-400">Shame-free re-anchoring</p>
          </div>
        </button>
      </div>
    </div>
  );
};
