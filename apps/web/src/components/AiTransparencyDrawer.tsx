"use client";

import React, { useState } from "react";
import { AiMeta } from "@contracts/types";
import { Cpu, ShieldCheck, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface Props {
  meta?: AiMeta;
}

export const AiTransparencyDrawer: React.FC<Props> = ({ meta }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!meta) return null;

  const isOffline = meta.provider === "offline" || meta.isOfflineFallback;

  return (
    <div className="mt-3 border-t border-slate-800/80 pt-2 text-xs text-slate-400">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-1 px-2 rounded hover:bg-slate-800/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-teal-400" />
          <span className="font-medium text-slate-300">AI Transparency</span>
          {isOffline ? (
            <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
              <AlertCircle className="h-2.5 w-2.5" />
              Offline safety script (pre-written)
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center gap-1 rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-500/30">
              <ShieldCheck className="h-2.5 w-2.5" />
              LIVE {meta.provider.toUpperCase()}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-1.5 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800 font-mono text-[11px] leading-relaxed">
          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-slate-500">Provider:</span>
            <span className="font-semibold text-teal-400 uppercase">{meta.provider}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-slate-500">Model ID:</span>
            <span className="text-slate-300">{meta.modelId}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-slate-500">Latency:</span>
            <span className="text-amber-400">{meta.latencyMs} ms</span>
          </div>
          <div className="flex flex-col gap-1 pt-0.5">
            <span className="text-slate-500">Context Fields Used:</span>
            <div className="flex flex-wrap gap-1">
              {meta.contextFields.map((field, i) => (
                <span
                  key={i}
                  className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
          {isOffline && (
            <div className="mt-2 rounded bg-amber-950/50 p-1.5 text-[10px] text-amber-200/90 border border-amber-800/40">
              <strong>Offline Notice:</strong> Served from local pre-written safety scripts due to offline fallback mode.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
