"use client";

import React, { useState } from "react";
import { UserProfile } from "@contracts/types";
import { postScenarioLoad, setActiveUserPersona, getActiveUser } from "../services/api";
import { Database, RefreshCw } from "lucide-react";

interface Props {
  activeUser: UserProfile;
  onPersonaChange: (newUser: UserProfile) => void;
}

export const ScenarioControl: React.FC<Props> = ({ activeUser, onPersonaChange }) => {
  const [loading, setLoading] = useState(false);
  const [seededMsg, setSeededMsg] = useState("");

  const handleSeed = async () => {
    setLoading(true);
    setSeededMsg("");
    try {
      const res = await postScenarioLoad({ reset: true });
      setSeededMsg(`Seeded ${res.seeded.users.length} profiles & ${res.seeded.timelineEvents} events (Inputs Only)`);
      onPersonaChange(getActiveUser());
      setLoading(false);
      setTimeout(() => setSeededMsg(""), 4000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSwitchPersona = (persona: "ravi" | "meera") => {
    setActiveUserPersona(persona);
    onPersonaChange(getActiveUser());
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 mx-auto max-w-xl rounded-2xl border border-teal-500/30 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Scenario Info Badge */}
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-teal-300">
            <Database className="h-3.5 w-3.5" />
          </span>
          <div>
            <span className="font-bold text-slate-200">Load Test Scenario</span>
            <span className="text-[10px] text-slate-400 block">Inputs Only • Evaluator Free-Roam</span>
          </div>
        </div>

        {/* Persona Selectors & Reset */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => handleSwitchPersona("ravi")}
              className={`rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
                activeUser.name === "Ravi"
                  ? "bg-teal-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Ravi (Tamil)
            </button>
            <button
              onClick={() => handleSwitchPersona("meera")}
              className={`rounded px-2.5 py-1 text-[11px] font-bold transition-all ${
                activeUser.name === "Meera"
                  ? "bg-teal-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Meera (English)
            </button>
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 font-bold text-teal-300 hover:bg-slate-700 active:scale-95 border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Seeding..." : "Seed Data"}</span>
          </button>
        </div>
      </div>

      {seededMsg && (
        <div className="mt-2 text-center text-[10px] font-semibold text-teal-300 bg-teal-950/60 py-1 rounded border border-teal-500/20">
          {seededMsg}
        </div>
      )}
    </div>
  );
};
