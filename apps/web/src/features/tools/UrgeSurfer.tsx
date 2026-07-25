"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Play, Pause, RefreshCw, Volume2, VolumeX, Zap, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calmingAudio } from "../../utils/audio";

export const UrgeSurfer: React.FC = () => {
  const [urgeLevel, setUrgeLevel] = useState<number>(6);
  const [isSurfing, setIsSurfing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [bubbles, setBubbles] = useState([
    { id: 1, text: "Work Stress", popped: false },
    { id: 2, text: "Evening Urge", popped: false },
    { id: 3, text: "Boredom", popped: false },
    { id: 4, text: "Habit Reflex", popped: false },
    { id: 5, text: "Anxiety", popped: false },
  ]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSurfing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsSurfing(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSurfing, timeLeft]);

  const toggleTimer = () => {
    if (!isSurfing && timeLeft === 0) setTimeLeft(180);
    setIsSurfing(!isSurfing);
  };

  const resetTimer = () => {
    setIsSurfing(false);
    setTimeLeft(180);
  };

  const handlePopBubble = (id: number) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
    );
  };

  const resetBubbles = () => {
    setBubbles((prev) => prev.map((b) => ({ ...b, popped: false })));
  };

  const toggleSound = () => {
    const active = calmingAudio.toggle();
    setIsPlayingAudio(active);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="space-y-6">
      {/* Urge Intensity Slider */}
      <div className="rounded-3xl border border-teal-500/30 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-teal-500/20 p-2 text-teal-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Craving Intensity Assessment</h3>
              <p className="text-xs text-slate-400">Rate your current urge from 1 to 10</p>
            </div>
          </div>
          <span
            className={`text-lg font-black px-3 py-1 rounded-xl border ${
              urgeLevel >= 8
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : urgeLevel >= 5
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-teal-500/20 text-teal-300 border-teal-500/40"
            }`}
          >
            Level {urgeLevel} / 10
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={urgeLevel}
          onChange={(e) => setUrgeLevel(parseInt(e.target.value))}
          className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-400"
        />

        <div className="flex justify-between text-[11px] font-semibold text-slate-400">
          <span>1 (Mild Thought)</span>
          <span>5 (Moderate Craving)</span>
          <span>10 (Severe Peak)</span>
        </div>

        <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 leading-relaxed font-medium">
          {urgeLevel >= 8
            ? "⚠️ Peak Craving Detected: Remember that neuro-chemical urges crest within 3 minutes like a wave. Ride the wave below without acting."
            : urgeLevel >= 5
            ? "🌊 Moderate Urge: Your brain is testing a habitual memory loop. Pop the trigger bubbles below or start ocean soundscapes."
            : "🌱 Mild Craving: Great job catching it early. Take a 3-minute breathwork pause now."}
        </p>
      </div>

      {/* 3-Minute Urge Surfing Timer */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-xl text-center space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold text-teal-300 uppercase tracking-wider">
            <Shield className="h-4 w-4" /> 3-Minute Urge Surfing Wave
          </span>
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              isPlayingAudio
                ? "bg-teal-500/20 text-teal-300 border-teal-500/40 animate-pulse"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {isPlayingAudio ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {isPlayingAudio ? "Ocean Wave Audio Playing" : "Play Ocean Sounds"}
          </button>
        </div>

        <div className="py-2">
          <div className="text-5xl font-black text-teal-300 font-mono tracking-tight">
            {formatTime(timeLeft)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isSurfing ? "Surfing the wave... Stay still & breathe slow" : "Click Start to begin 180s de-escalation"}
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={toggleTimer}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-teal-400 transition-all shadow-md active:scale-95"
          >
            {isSurfing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isSurfing ? "Pause Wave" : "Start 3-Min Wave"}
          </button>

          <button
            onClick={resetTimer}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-all border border-slate-700"
          >
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* Interactive Bubble Burst Grounding Game */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-400" /> Interactive Trigger Bubble Burst
            </h3>
            <p className="text-xs text-slate-400">Tap thoughts to pop them and clear mental space</p>
          </div>
          <button
            onClick={resetBubbles}
            className="text-xs font-semibold text-teal-400 hover:underline"
          >
            Reset Bubbles
          </button>
        </div>

        <div className="flex flex-wrap gap-3 py-3 justify-center">
          {bubbles.map((b) => (
            <AnimatePresence key={b.id}>
              {!b.popped ? (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.4, opacity: 0 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handlePopBubble(b.id)}
                  className="rounded-full bg-gradient-to-tr from-teal-500/20 to-cyan-500/30 px-4 py-2.5 text-xs font-bold text-teal-200 border border-teal-500/40 shadow-lg shadow-teal-500/10 cursor-pointer"
                >
                  🫧 {b.text} (Tap to Pop)
                </motion.button>
              ) : (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="rounded-full bg-slate-800/60 px-3 py-1.5 text-[11px] font-medium text-slate-500 line-through border border-slate-800"
                >
                  ✨ Popped
                </motion.span>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>
    </div>
  );
};
