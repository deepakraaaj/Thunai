"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";

interface Props {
  userName: string;
  daysSober: number;
  checkinCount?: number;
  isSlipped?: boolean;
}

export const LivingGarden: React.FC<Props> = ({
  userName,
  daysSober,
  checkinCount = 5,
  isSlipped = false,
}) => {
  // Calculate garden stage (1 to 5)
  const growthStage = Math.min(5, Math.max(1, Math.floor(daysSober / 15) + 1));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-lavender-500/10 blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-300 border border-teal-500/20">
              <Sparkles className="h-3 w-3 text-teal-400" /> Living Garden
            </span>
            {isSlipped && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                Growth Paused • Intact
              </span>
            )}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">
            {userName}&apos;s Sanctuary Tree
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Tree Level</span>
          <p className="text-sm font-bold text-teal-300">Stage {growthStage} of 5</p>
        </div>
      </div>

      {/* Interactive Growing SVG Tree */}
      <div className="relative my-4 flex h-48 w-full items-center justify-center rounded-xl bg-slate-950/60 p-4 border border-slate-800/80">
        <svg viewBox="0 0 200 180" className="h-full w-full max-w-[240px]">
          {/* Ground soil */}
          <path
            d="M 20 160 Q 100 150 180 160"
            fill="none"
            stroke="#334155"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Trunk */}
          <motion.path
            d="M 100 160 Q 98 120 100 80 Q 102 60 100 50"
            fill="none"
            stroke="#5d4037"
            strokeWidth={8 + growthStage * 1.5}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Left Branch */}
          {growthStage >= 2 && (
            <motion.path
              d="M 100 110 Q 75 90 60 85"
              fill="none"
              stroke="#5d4037"
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}

          {/* Right Branch */}
          {growthStage >= 3 && (
            <motion.path
              d="M 100 95 Q 125 75 140 70"
              fill="none"
              stroke="#5d4037"
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          )}

          {/* Canopy Leaves (Foliage Clusters) */}
          <motion.g
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "backOut" }}
          >
            {/* Base Foliage */}
            <circle cx="100" cy="50" r={20 + growthStage * 4} fill="#2dd4bf" opacity="0.8" />
            <circle cx="82" cy="60" r={16 + growthStage * 3} fill="#14b8a6" opacity="0.85" />
            <circle cx="118" cy="60" r={16 + growthStage * 3} fill="#0d9488" opacity="0.85" />

            {/* Stage 2+ Extra Leaves */}
            {growthStage >= 2 && (
              <circle cx="55" cy="80" r="14" fill="#a78bfa" opacity="0.75" />
            )}
            {growthStage >= 3 && (
              <circle cx="145" cy="65" r="14" fill="#2dd4bf" opacity="0.8" />
            )}

            {/* Stage 4+ Flowers */}
            {growthStage >= 4 && (
              <>
                <circle cx="90" cy="40" r="5" fill="#f59e0b" />
                <circle cx="110" cy="45" r="5" fill="#f43f5e" />
                <circle cx="70" cy="75" r="4" fill="#fbbf24" />
              </>
            )}

            {/* Stage 5 Full Bloom Glow */}
            {growthStage >= 5 && (
              <circle cx="100" cy="45" r="40" fill="#f59e0b" opacity="0.15" />
            )}
          </motion.g>

          {/* Floating Spirit Particles */}
          <motion.circle
            cx="70"
            cy="110"
            r="2"
            fill="#2dd4bf"
            animate={{ y: [-5, 5, -5], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.circle
            cx="130"
            cy="120"
            r="2.5"
            fill="#a78bfa"
            animate={{ y: [5, -5, 5], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
          />
        </svg>

        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-teal-400 fill-teal-400/20" />
            {checkinCount} Voice Check-ins
          </span>
          <span className="text-slate-300 font-medium">
            {isSlipped ? "Recovery Days Lived: " : "Continuity: "}
            <strong className="text-teal-300">{daysSober} Days</strong>
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed italic">
        &ldquo;Every presence count adds root strength. Your sanctuary tree never dies—slips pause growth, but every brave day stays forever.&rdquo;
      </p>
    </div>
  );
};
