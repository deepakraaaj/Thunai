// =============================================================================
// tts.ts — Client voice ladder: Sarvam (via /api/tts) → browser speechSynthesis
// → silent (text stays on screen). Voice NEVER blocks the UI.
// =============================================================================

"use client";

import type { Language } from "./types";

function ttsLang(language: Language): "ta-IN" | "en-IN" {
  return language === "en" ? "en-IN" : "ta-IN";
}

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Speak `text` in the profile language. Resolves when audio starts (or when it
 * falls through to the browser tier). Failures are swallowed — the text on
 * screen is the guaranteed-visible fallback.
 */
export async function speak(text: string, language: Language): Promise<void> {
  stopSpeaking();
  const target = ttsLang(language);

  // Tier 1: Sarvam via our server proxy.
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLanguageCode: target }),
    });
    if (res.ok) {
      const { audioBase64 } = (await res.json()) as { audioBase64?: string };
      if (audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        currentAudio = audio;
        await audio.play();
        return;
      }
    }
  } catch {
    // fall through to browser TTS
  }

  // Tier 2: browser speechSynthesis.
  browserSpeak(text, target);
}

function browserSpeak(text: string, target: "ta-IN" | "en-IN"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = target;
    const voices = window.speechSynthesis.getVoices();
    const match =
      voices.find((v) => v.lang === target) ||
      voices.find((v) => v.lang.startsWith(target.split("-")[0]!));
    if (match) utter.voice = match;
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  } catch {
    // Tier 3: silent — the text remains on screen.
  }
}
