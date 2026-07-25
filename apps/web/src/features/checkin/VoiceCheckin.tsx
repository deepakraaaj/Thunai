"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserProfile, CheckinResponse } from "@contracts/types";
import { postCheckin } from "../../services/api";
import { AiTransparencyDrawer } from "../../components/AiTransparencyDrawer";
import { Mic, MicOff, Send, PhoneCall, X, AlertOctagon, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface ISpeechRecognitionResult {
  [index: number]: { transcript: string };
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: ISpeechRecognitionResult;
  };
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: ISpeechRecognitionEvent) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface Props {
  user: UserProfile;
  onClose: () => void;
  onCheckinComplete?: () => void;
}

export const VoiceCheckin: React.FC<Props> = ({ user, onClose, onCheckinComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CheckinResponse | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass =
        (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = user.language === "ta" ? "ta-IN" : "en-US";

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          let currentText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [user]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setTranscript("");
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        console.warn("Recognition start failed");
      }
    } else {
      setIsRecording(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    const textToSubmit = transcript.trim() || "Felt steady today after morning walk.";
    setLoading(true);
    try {
      const res = await postCheckin({
        userId: user.userId,
        transcript: textToSubmit,
      });
      setResponse(res);
      setLoading(false);
      if (onCheckinComplete) onCheckinComplete();
    } catch (err) {
      console.error("Checkin submit failed", err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-teal-500/20 p-2 text-teal-400">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Zero-Typing Voice Check-In</h3>
              <p className="text-xs text-slate-400">Speak naturally in {user.language === "ta" ? "Tamil" : "English"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!response ? (
          <div className="space-y-4">
            {/* Hold-to-Talk Button & Controls */}
            <div className="flex flex-col items-center justify-center py-6 space-y-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all shadow-xl ${
                  isRecording
                    ? "bg-rose-600 ring-8 ring-rose-500/30 animate-pulse"
                    : "bg-gradient-to-tr from-teal-500 to-cyan-600 hover:scale-105"
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-10 w-10 text-white" />
                ) : (
                  <Mic className="h-10 w-10 text-white" />
                )}
              </motion.button>
              <p className="text-xs font-semibold text-slate-300">
                {isRecording ? "Listening... Release to stop" : "Press & Hold to speak"}
              </p>
            </div>

            {/* Transcript Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Your Transcript:</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Or type how you feel today (e.g. 'Felt steady today after morning walk...')"
                className="w-full h-24 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-bold text-slate-950 hover:bg-teal-400 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Reflecting with AI...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Check-In
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reflection Card */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-teal-300 font-semibold text-sm">
                <Heart className="h-4 w-4 text-teal-400 fill-teal-400/20" />
                Warm Companion Reflection
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {response.aiReflection}
              </p>
            </div>

            {/* TELE-MANAS EXCLUSIVE HELPLINE CARD (Red reserved exclusively for this) */}
            {response.escalation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="helpline-card rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertOctagon className="h-5 w-5 text-red-400 animate-pulse" />
                  {response.escalation.helplineName} Crisis Support Flag
                </div>
                <p className="text-xs text-red-100 font-medium">
                  {response.escalation.message}
                </p>
                <a
                  href={`tel:${response.escalation.helplineNumber}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 px-4 text-sm font-black text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-950"
                >
                  <PhoneCall className="h-4 w-4" /> Call {response.escalation.helplineName} ({response.escalation.helplineNumber})
                </a>
              </motion.div>
            )}

            {/* AI Transparency Drawer */}
            <AiTransparencyDrawer meta={response.meta} />

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
