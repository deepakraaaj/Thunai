"use client";

import { ShieldCheck, Sparkles } from "lucide-react";
import type { AiMeta } from "@/lib/types";
import type { Language } from "@/lib/types";
import { t } from "@/lib/copy";

/**
 * The honesty line under every generated script. Live generations show
 * provider · model · latency. Offline fallbacks are clearly badged and never
 * dressed up as live AI.
 */
export default function Transparency({ meta, lang }: { meta: AiMeta; lang: Language }) {
  if (meta.isOfflineFallback) {
    return (
      <p role="status" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber/10 px-3 py-1 text-xs font-medium text-amber">
        <ShieldCheck size={13} aria-hidden />
        {t("offlineBadge", lang)}
      </p>
    );
  }
  return (
    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400">
      <Sparkles size={13} aria-hidden className="text-teal" />
      {t("generatedLive", lang)} · {meta.provider} · {meta.modelId} · {meta.latencyMs}ms
    </p>
  );
}
