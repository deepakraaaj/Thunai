"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Send, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/api-client";
import { useProfile } from "@/lib/use-profile";
import { useSpeech } from "@/lib/use-speech";
import { speak, stopSpeaking } from "@/lib/tts";
import { brandName, fontClassFor, type ScriptResponse } from "@/lib/types";
import Orb from "@/components/Orb";

type Turn = { role: "user" | "assistant"; text: string };

export default function ConversationPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sending, setSending] = useState(false);
  const speech = useSpeech(profile?.language ?? "en");

  useEffect(() => {
    if (ready && !profile) router.replace("/onboarding");
  }, [ready, profile, router]);
  useEffect(() => {
    if (!profile) return;
    const context = window.sessionStorage.getItem("thunai.conversation.context");
    if (context !== "nearby") return;
    window.sessionStorage.removeItem("thunai.conversation.context");
    const text =
      profile.language === "hi" || profile.language === "hinglish"
        ? "मैं आपके साथ हूँ। अभी कोई फैसला मत कीजिए—पहले बताइए, इस समय आपके मन में क्या चल रहा है?"
        : "I’m with you. You do not need to make any decision right now. What is going through your mind?";
    setTurns([{ role: "assistant", text }]);
    void speak(text, profile.language);
  }, [profile]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  if (!profile) return <main className="min-h-dvh bg-base" aria-busy />;

  const starters =
    profile.language === "hi" || profile.language === "hinglish"
      ? ["मुझे अभी बहुत तलब हो रही है", "मुझे यहाँ से निकलने में मदद करें", "बस मेरे साथ बात करें"]
      : ["The craving is strong", "Help me walk away", "Just stay and talk"];

  async function send() {
    if (!profile) return;
    const message = speech.transcript.trim();
    if (!message || sending) return;
    speech.stop();
    stopSpeaking();
    const nextTurns: Turn[] = [...turns, { role: "user", text: message }];
    setTurns(nextTurns);
    speech.setTranscript("");
    setSending(true);
    try {
      const result = await postJson<ScriptResponse>("/api/conversation", {
        profile,
        message,
        history: turns.slice(-8),
      });
      setTurns((current) => [...current, { role: "assistant", text: result.text }]);
      void speak(result.text, profile.language);
    } catch {
      setTurns((current) => [
        ...current,
        { role: "assistant", text: "I’m right here. Take one slow breath with me." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col px-4 py-4 sm:px-6">
      <header className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-surface/70 px-3 py-3 shadow-float">
        <button onClick={() => router.replace("/home")} aria-label="Back to home" className="rounded-full p-2 text-slate-300">
          <ArrowLeft />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Talk to {brandName(profile.language)}</h1>
          <p className="text-xs text-teal">Live supportive conversation</p>
        </div>
      </header>

      <div className="my-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-surface/35 shadow-depth">
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {turns.length === 0 && (
          <div className="mx-auto flex max-w-lg flex-col items-center py-6 text-center">
            <Orb size={118} />
            <h2 className="mt-5 text-2xl font-semibold text-slate-50">
              You don’t have to carry this minute alone.
            </h2>
            <p className={`mt-2 text-slate-300 ${fontClassFor(profile.language)}`}>
              Speak naturally. {brandName(profile.language)} will listen and respond one step at a time.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {starters.map((starter) => (
                <button
                  key={starter}
                  onClick={() => speech.setTranscript(starter)}
                  className="rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm text-teal hover:bg-teal/20"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((turn, index) => (
          <p
            key={`${turn.role}-${index}`}
            className={`max-w-[88%] rounded-2xl px-4 py-3 ${
              turn.role === "user" ? "ml-auto bg-teal text-base" : "bg-surface text-slate-100"
            } ${fontClassFor(profile.language)}`}
          >
            {turn.text}
          </p>
        ))}
        {sending && <p className="animate-pulse text-sm text-slate-400">{brandName(profile.language)} is listening…</p>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-800 bg-surface p-3 sm:p-4">
        <textarea
          value={speech.transcript}
          onChange={(event) => speech.setTranscript(event.target.value.slice(0, 600))}
          placeholder="Type or hold the microphone…"
          aria-label="Your message"
          rows={2}
          className="w-full resize-none bg-transparent text-slate-50 outline-none placeholder:text-slate-500"
        />
        <div className="flex justify-end gap-2">
          {speech.supported && (
            <button
              onPointerDown={speech.start}
              onPointerUp={speech.stop}
              aria-label={speech.listening ? "Stop listening" : "Hold to talk"}
              className={`rounded-full p-3 ${speech.listening ? "bg-danger text-white" : "bg-base text-teal"}`}
            >
              {speech.listening ? <Square size={18} /> : <Mic size={18} />}
            </button>
          )}
          <button onClick={send} disabled={!speech.transcript.trim() || sending} aria-label="Send message" className="rounded-full bg-teal p-3 text-base disabled:opacity-40">
            <Send size={18} />
          </button>
        </div>
      </div>
      </div>
    </main>
  );
}
