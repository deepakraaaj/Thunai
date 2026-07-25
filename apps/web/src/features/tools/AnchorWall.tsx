"use client";

import React, { useState } from "react";
import { UserProfile } from "@contracts/types";
import { Heart, Award, Shield, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  user: UserProfile;
}

export const AnchorWall: React.FC<Props> = ({ user }) => {
  const [pledgedToday, setPledgedToday] = useState(false);

  const anchors = [
    {
      id: 1,
      title: `${user.motivation}`,
      category: "Primary Anchor",
      quote: "Creating a bright, secure future filled with laughter and pride.",
      color: "from-teal-500/20 to-cyan-500/20",
      border: "border-teal-500/40",
    },
    {
      id: 2,
      title: "Family Peace & Sunday Dinners",
      category: "Emotional Anchor",
      quote: "Waking up clear-headed every weekend to make memories with family.",
      color: "from-lavender-500/20 to-purple-500/20",
      border: "border-lavender-500/40",
    },
    {
      id: 3,
      title: "Financial Freedom Goal",
      category: "Practical Anchor",
      quote: `Saving ₹${((user.daysSober || 90) * (user.dailyCostInr || 525)).toLocaleString("en-IN")} toward school fees & independence.`,
      color: "from-amber-500/20 to-yellow-500/20",
      border: "border-amber-500/40",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Daily Sobriety Pledge Card */}
      <div className="rounded-3xl border border-teal-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Award className="h-5 w-5 text-teal-400" />
          <span className="text-xs font-bold text-teal-300 uppercase tracking-widest">
            Daily Sobriety Commitment
          </span>
        </div>

        <h2 className="text-2xl font-black text-slate-100">
          &ldquo;Just For Today, I Am Anchored.&rdquo;
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Recovery is lived one single day at a time. Make today&apos;s pledge to protect what matters most.
        </p>

        {!pledgedToday ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPledgedToday(true)}
            className="flex items-center justify-center gap-2 mx-auto rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 active:scale-95"
          >
            <Shield className="h-5 w-5" /> Take Today&apos;s Sobriety Pledge
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-500/20 px-6 py-3 text-sm font-bold text-teal-300 border border-teal-500/40"
          >
            <CheckCircle2 className="h-5 w-5 text-teal-400" />
            Pledged for Today! +1 Root Strength Added to Garden
          </motion.div>
        )}
      </div>

      {/* Memory Wall Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-400 fill-rose-400/20" /> {user.name}&apos;s Personal Memory Anchors
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {anchors.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border ${item.border} bg-gradient-to-br ${item.color} p-4 space-y-2 shadow-sm`}
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {item.category}
              </span>
              <h4 className="text-base font-bold text-slate-100">{item.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                &ldquo;{item.quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
