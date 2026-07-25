"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { UserProfile, SosResponse } from "@contracts/types";
import { postSosScript } from "../../services/api";
import { AiTransparencyDrawer } from "../../components/AiTransparencyDrawer";
import { Volume2, VolumeX, PhoneCall, Wind, Sparkles, X, Heart, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  user: UserProfile;
  onClose: () => void;
}

export const SosFlow: React.FC<Props> = ({ user, onClose }) => {
  const [response, setResponse] = useState<SosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<"script" | "breathe" | "distract">("script");
  const [breathePhase, setBreathePhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");

  const synthRef = useRef<SpeechSynthesis | null>(null);

  const speakScript = useCallback((text: string, langCode: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === "ta" ? "ta-IN" : "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, []);

  // Initialize and call SOS script API on mount
  useEffect(() => {
    let isMounted = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    async function loadSos() {
      setLoading(true);
      try {
        const res = await postSosScript({ userId: user.userId });
        if (isMounted) {
          setResponse(res);
          setLoading(false);
          speakScript(res.script, res.language);
        }
      } catch (err) {
        console.error("SOS call failed", err);
        if (isMounted) setLoading(false);
      }
    }

    loadSos();

    return () => {
      isMounted = false;
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [user, speakScript]);

  // Breathing timer cycle (4s inhale, 4s hold, 4s exhale)
  useEffect(() => {
    if (activeTab !== "breathe") return;

    const interval = setInterval(() => {
      setBreathePhase((prev) => {
        if (prev === "Inhale") return "Hold";
        if (prev === "Hold") return "Exhale";
        return "Inhale";
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const toggleSpeech = () => {
    if (!synthRef.current || !response) return;
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    } else {
      speakScript(response.script, response.language);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 p-4 sm:p-6 animate-breathing overflow-y-auto">
      {/* High-contrast Panic Mode Header */}
      <div className="flex items-center justify-between border-b border-rose-500/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-rose-500/20 p-2 text-rose-400">
            <ShieldAlert className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-rose-400 uppercase">
              PANIC MODE ACTIVE
            </span>
            <h2 className="text-xl font-black text-white">Anchor Emergency Coping</h2>
          </div>
        </div>
        <button
          onClick={() => {
            if (synthRef.current) synthRef.current.cancel();
            onClose();
          }}
          className="rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
          aria-label="Close Panic Mode"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Main Content Body (Enlarged 120% scale for shaking hands) */}
      <div className="my-auto py-4 space-y-5 text-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
            <p className="text-sm font-semibold text-slate-300">
              Generating live Tamil recovery script...
            </p>
          </div>
        ) : activeTab === "script" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-teal-500/40 bg-slate-900/95 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2 text-sm font-bold text-teal-300">
                <Heart className="h-5 w-5 text-teal-400 fill-teal-400/30" />
                Live Guidance ({response?.language === "ta" ? "Tamil" : "English"})
              </span>
              <button
                onClick={toggleSpeech}
                className="flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1.5 text-xs font-bold text-teal-300 border border-teal-500/40 hover:bg-teal-500/30"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-4 w-4 text-amber-400" /> Mute Audio
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 text-teal-300" /> Listen Again
                  </>
                )}
              </button>
            </div>

            {/* Script Text */}
            <p className="text-xl sm:text-2xl font-bold leading-relaxed text-slate-100 tracking-wide">
              &ldquo;{response?.script}&rdquo;
            </p>

            {/* AI Transparency Drawer */}
            {response && <AiTransparencyDrawer meta={response.meta} />}
          </motion.div>
        ) : activeTab === "breathe" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-teal-500/40 bg-slate-900/95 p-8 text-center shadow-2xl"
          >
            <h3 className="text-xl font-bold text-slate-200">Guided Breathing</h3>
            <p className="text-sm text-slate-400 mb-6">Focus on the circle below</p>

            {/* Breathing Circle Overlay */}
            <div className="relative flex h-52 w-52 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-teal-500/20" />
              <div className="h-44 w-44 rounded-full bg-teal-500/20 animate-circle-pulse flex items-center justify-center border-2 border-teal-400">
                <span className="text-2xl font-extrabold text-teal-200">{breathePhase}</span>
              </div>
            </div>

            <p className="mt-6 text-sm text-teal-300 font-semibold">
              Inhale peace for 4s • Hold for 4s • Exhale tension for 4s
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-lavender-500/40 bg-slate-900/95 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-xl font-bold text-lavender-300">5-4-3-2-1 Grounding Distraction</h3>
            <ul className="space-y-3 text-base text-slate-200 font-medium">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/20 text-teal-300 font-bold">5</span>
                Look around: Name 5 things you see right now.
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/20 text-teal-300 font-bold">4</span>
                Touch: Notice 4 physical textures near your hands.
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/20 text-teal-300 font-bold">3</span>
                Listen: Identify 3 distinct background sounds.
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/20 text-teal-300 font-bold">2</span>
                Smell: Take 2 slow breaths and notice smells.
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500/20 text-teal-300 font-bold">1</span>
                Taste: Take a slow sip of cold water.
              </li>
            </ul>
          </motion.div>
        )}
      </div>

      {/* THREE GIANT FOLLOW-UP BUTTONS */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {/* Giant Button 1: Call Sponsor */}
        <a
          href="tel:9876543210"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-b from-emerald-600 to-teal-700 p-4 text-center text-white shadow-lg active:scale-95 transition-all"
        >
          <PhoneCall className="h-7 w-7" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
            Call Sponsor
          </span>
        </a>

        {/* Giant Button 2: Breathe With Me */}
        <button
          onClick={() => setActiveTab(activeTab === "breathe" ? "script" : "breathe")}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-4 text-center text-white shadow-lg active:scale-95 transition-all ${
            activeTab === "breathe"
              ? "bg-teal-500 border-2 border-white ring-2 ring-teal-400"
              : "bg-gradient-to-b from-teal-700 to-cyan-800"
          }`}
        >
          <Wind className="h-7 w-7" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
            Breathe With Me
          </span>
        </button>

        {/* Giant Button 3: Distract Me */}
        <button
          onClick={() => setActiveTab(activeTab === "distract" ? "script" : "distract")}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-4 text-center text-white shadow-lg active:scale-95 transition-all ${
            activeTab === "distract"
              ? "bg-lavender-600 border-2 border-white ring-2 ring-lavender-400"
              : "bg-gradient-to-b from-purple-700 to-indigo-800"
          }`}
        >
          <Sparkles className="h-7 w-7" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
            Distract Me
          </span>
        </button>
      </div>
    </div>
  );
};
