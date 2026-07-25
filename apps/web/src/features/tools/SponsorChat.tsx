"use client";

import React, { useState } from "react";
import { UserProfile } from "@contracts/types";
import { Send, PhoneCall } from "lucide-react";

interface Props {
  user: UserProfile;
}

interface Message {
  id: number;
  sender: "priya" | "user";
  text: string;
  time: string;
}

export const SponsorChat: React.FC<Props> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "priya",
      text: `Hi ${user.name}! Just checking in on you today. How is your heart feeling? Remember I am always in your corner.`,
      time: "09:30 AM",
    },
  ]);
  const [inputText, setInputText] = useState("");

  const quickReplies = [
    "I'm feeling a mild craving right now.",
    "Completed my morning walk & pledge!",
    "Can we talk for 5 minutes?",
    "Feeling grateful for Ananya today.",
  ];

  const sendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const nextId = messages.length + 1;
    const userMsg: Message = {
      id: nextId,
      sender: "user",
      text: textToSend,
      time: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Simulate instant sponsor response
    setTimeout(() => {
      let replyText = `Thank you for sharing, ${user.name}. Take a slow breath right now. We have walked 90 days together, and today is another victory. I am right here with you.`;
      if (textToSend.toLowerCase().includes("craving") || textToSend.toLowerCase().includes("talk")) {
        replyText = `${user.name}, pause right there. Drink a cold glass of water and open the Urge Surfer tool or call me. You are stronger than this craving wave!`;
      }

      const priyaMsg: Message = {
        id: nextId + 1,
        sender: "priya",
        text: replyText,
        time: "Just now",
      };
      setMessages((prev) => [...prev, priyaMsg]);
    }, 1000);
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender-500/20 font-bold text-lavender-300 border border-lavender-500/40">
              P
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              Priya <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-normal">Sponsor / Caregiver</span>
            </h3>
            <p className="text-[11px] text-slate-400">Active • Consent Linked</p>
          </div>
        </div>

        <a
          href="tel:9876543210"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md"
        >
          <PhoneCall className="h-3.5 w-3.5" /> Call Priya
        </a>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-sm ${
                m.sender === "user"
                  ? "bg-teal-500 text-slate-950 rounded-br-none font-semibold"
                  : "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
          </div>
        ))}
      </div>

      {/* Quick Reply Chips */}
      <div className="border-t border-slate-800 bg-slate-950/80 p-2 overflow-x-auto flex gap-2">
        {quickReplies.map((qr, i) => (
          <button
            key={i}
            onClick={() => sendMessage(qr)}
            className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-teal-500/20 hover:text-teal-300 border border-slate-700 transition-all"
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="border-t border-slate-800 bg-slate-950 p-3 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(inputText)}
          placeholder="Type a message to Priya..."
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
        />
        <button
          onClick={() => sendMessage(inputText)}
          className="rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 active:scale-95 transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
