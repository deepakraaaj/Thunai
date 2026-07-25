"use client";

import React, { useEffect, useState } from "react";
import { UserProfile, PredictionResponse, InsightsResponse } from "@contracts/types";
import { getPredictions, getInsights } from "../../services/api";
import { AiTransparencyDrawer } from "../../components/AiTransparencyDrawer";
import { BookOpen, Clock, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  user: UserProfile;
}

export const PredictiveAndLearnHub: React.FC<Props> = ({ user }) => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      const p = await getPredictions(user.userId);
      setPrediction(p);
      const ins = await getInsights(user.userId);
      setInsights(ins);
    }
    loadData();
  }, [user]);

  const lessons = [
    {
      id: 1,
      title: "Understanding Craving Waves",
      duration: "3 min read",
      category: "Neuroscience",
      summary:
        "Cravings act like ocean waves—they peak rapidly within 10–15 minutes and naturally subside if you ride them out without action.",
    },
    {
      id: 2,
      title: "The HALT Framework",
      duration: "4 min read",
      category: "Self-Awareness",
      summary:
        "Before reacting to an urge, check if you are Hungry, Angry, Lonely, or Tired. Addressing the HALT root cause diffuses 80% of cravings.",
    },
    {
      id: 3,
      title: "Building High-Risk Window Shields",
      duration: "5 min read",
      category: "Prevention Strategy",
      summary:
        "Friday post-work hours carry habit triggers. Pre-planning enjoyable activities with your family blocks vulnerable decision windows.",
    },
    {
      id: 4,
      title: "Compassionate Recovery vs. Shame Loops",
      duration: "4 min read",
      category: "Psychology",
      summary:
        "Guilt and streak resets cause shame spirals. True resilience celebrates continuous progress and accumulated brave days.",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. PREDICTIVE NUDGE CARD (Gentle unprompted intervention card if active) */}
      {prediction?.active && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-5 shadow-xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-amber-500/20 p-2 text-amber-400">
                <Zap className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  PREDICTIVE PRE-CRISIS NUDGE
                </span>
                <h3 className="text-base font-bold text-slate-100">
                  {prediction.window?.label || "Active Vulnerability Window"}
                </h3>
              </div>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/30">
              High Risk Period
            </span>
          </div>

          <p className="text-sm font-medium text-slate-200 leading-relaxed">
            {prediction.nudge}
          </p>

          {/* AI Transparency Drawer */}
          {prediction.meta && <AiTransparencyDrawer meta={prediction.meta} />}
        </motion.div>
      )}

      {/* 2. LIVE PERSONALIZED SUMMARY & INSIGHTS */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-teal-500/20 p-2 text-teal-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Personalized AI Insights</h3>
              <p className="text-xs text-slate-400">Weekly pattern analysis</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          {insights?.weeklySummary || "Analyzing historical patterns..."}
        </p>

        {insights && <AiTransparencyDrawer meta={insights.meta} />}
      </div>

      {/* 3. LEARN HUB (Static Lesson Cards + Detail Modal) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-teal-400" />
          <h3 className="text-base font-bold text-slate-100">Learn Hub &amp; Recovery Resources</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => setActiveLesson(activeLesson === lesson.id ? null : lesson.id)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/90 p-4 transition-all hover:bg-slate-800/80 hover:border-teal-500/40 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="rounded bg-slate-800 px-2 py-0.5 font-medium text-slate-300">
                  {lesson.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {lesson.duration}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                {lesson.title}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {lesson.summary}
              </p>
              {activeLesson === lesson.id && (
                <div className="pt-2 text-xs text-teal-300 font-medium border-t border-slate-800">
                  Lesson completed! Your living garden tree gains strength.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
