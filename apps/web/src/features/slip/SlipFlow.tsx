"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, SlipResponse } from "@contracts/types";
import { postSlipScript } from "../../services/api";
import { AiTransparencyDrawer } from "../../components/AiTransparencyDrawer";
import { MessageSquare, MapPin, Heart, X, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  user: UserProfile;
  onClose: () => void;
}

export const SlipFlow: React.FC<Props> = ({ user, onClose }) => {
  const [response, setResponse] = useState<SlipResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSlip() {
      setLoading(true);
      try {
        const res = await postSlipScript({ userId: user.userId });
        setResponse(res);
        setLoading(false);
      } catch (err) {
        console.error("Slip call failed", err);
        setLoading(false);
      }
    }
    loadSlip();
  }, [user]);

  // Deep links
  const whatsappUrl = response
    ? `https://wa.me/?text=${encodeURIComponent(response.whatsappDraft)}`
    : "#";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "substance support group AA meetings near me"
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-lavender-500/20 p-2 text-lavender-300">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Compassionate Re-anchoring</h3>
              <p className="text-xs text-slate-400">Growth is continuous • Today counts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Headline = Total Recovery Days Lived */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Recovery Days Built
          </span>
          <div className="flex items-center justify-center gap-2 text-3xl font-extrabold text-teal-300">
            <CheckCircle2 className="h-7 w-7 text-teal-400" />
            <span>{user.daysSober} Days Lived</span>
          </div>
          <p className="text-xs text-slate-400 pt-1">
            Your living garden stays intact. A slip pauses growth but never erases your courage.
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm font-semibold text-slate-400 animate-pulse">
            Generating live compassionate response...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live AI Script */}
            <div className="rounded-2xl border border-lavender-500/30 bg-slate-950/90 p-4 space-y-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-lavender-300">
                <Sparkles className="h-3.5 w-3.5" /> Compassionate Script
              </span>
              <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
                &ldquo;{response?.script}&rdquo;
              </p>
            </div>

            {/* Deep Links Action Row */}
            <div className="space-y-2.5 pt-1">
              {/* WhatsApp Deep Link */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Send WhatsApp Reach-Out Draft</span>
                </div>
                <span className="text-xs bg-emerald-800/60 px-2 py-0.5 rounded text-emerald-100">
                  Caregiver
                </span>
              </a>

              {/* Maps Deep Link for Nearby Support */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700 active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-teal-400" />
                  <span>Find Nearby Support Groups</span>
                </div>
                <span className="text-xs text-slate-400">Maps</span>
              </a>
            </div>

            {/* AI Transparency Drawer */}
            {response && <AiTransparencyDrawer meta={response.meta} />}

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              Return Home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
