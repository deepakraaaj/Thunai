# Thunai / Sahara

**Zero-typing crisis support for substance-use recovery — in your own language.**

Thunai—shown as **Sahara** in Hindi modes—is a web-only, mobile-first companion for people recovering from a
substance-use habit and the people who care for them. When a craving hits, you
press one breathing circle and Thunai/Sahara generates a warm, in-the-moment coping
script — **live, at that moment**, in your own language (Tamil / English / mix) —
and speaks it aloud. No forms, no typing (except your name once), no shame.

> Every AI response is a **live API call** made at the moment of use. Nothing is
> canned. The only non-live text is a clearly badged *"Offline safety script —
> pre-written"* shown if every provider is unreachable.

---

## Problem statement → feature

| Statement phrase | How Thunai/Sahara answers it |
|---|---|
| *In-the-moment crisis support* | The breathing **orb** IS the SOS button. One press → live coping script, spoken aloud, word-by-word. |
| *In the user's own language* | Tamil / English / natural Tanglish, chosen at onboarding; scripts + voice both localized. |
| *Zero-typing* | Entire app is tap-only; the only text input is your name. |
| *Prevention, not just reaction* | Rupee counter reframes spend toward what they'd rather have; craving "swap" flow does live money-vs-goal math. |
| *Nobody recovers alone* | Caregiver view with a **realtime** timeline; on an SOS it auto-generates a live "what to say / what not to say" coaching script. |
| *Meet people where they are* | Compassionate "I slipped" flow — never resets the day count, never uses shame language. |

---

## Architecture

```
Browser (Next.js App Router, client components)
  localStorage: profile (no auth)          Supabase: events table + realtime
        │                                          ▲
        │  fetch /api/*                             │ insert / subscribe
        ▼                                          │
Next.js API routes (server-only keys)  ────────────┘
        │
        ├─ lib/prompt.ts   code-owned system prompt + <user_data> sanitization
        ├─ lib/ai.ts       Cerebras → Gemini → labeled offline  (retry + backoff)
        └─ /api/tts        Sarvam TTS proxy → (client) browser speechSynthesis
```

- **Profile** lives entirely in `localStorage` — no accounts, no auth.
- **Supabase** is used *only* for the `events` table + its realtime channel
  (caregiver timeline). If it's not configured, the app falls back to a local
  echo so nothing renders blank.
- **All provider keys are server-side.** The client never sees them.

## GenAI services

| Feature | Service (live) | File |
|---|---|---|
| SOS coping script | Cerebras (fastest served model) → Gemini Flash-Lite | `lib/prompt.ts` `buildSosPrompt` · `app/api/sos/route.ts` |
| Caregiver coaching (say / avoid) | same ladder | `buildCaregiverPrompt` · `app/api/caregiver-script/route.ts` |
| Voice check-in (mood + risk + reflection) | same ladder | `buildCheckinPrompt` · `app/api/checkin/route.ts` |
| "I slipped" compassion + WhatsApp draft | same ladder | `buildSlipPrompt` · `app/api/slip/route.ts` |
| Craving "swap" (money vs goal) | same ladder | `buildSwapPrompt` · `app/api/swap/route.ts` |
| Onboarding payoff + "I'm okay" | same ladder | `app/api/onboarding-payoff`, `app/api/okay` |
| Text-to-speech | Sarvam `bulbul` → browser speechSynthesis | `app/api/tts/route.ts` · `lib/tts.ts` |

Every generated response returns transparency metadata
(`provider · modelId · latencyMs`) shown under the script in the UI.

## Resilience & safety

- **AI ladder** (`lib/ai.ts`): Cerebras primary with model auto-discovery, up to
  2 retries on 429/5xx/network with exponential backoff + jitter and an 8s
  per-attempt timeout → Gemini Flash-Lite failover with the same policy → a
  clearly badged offline script. The UI never sees an unhandled rejection.
- **Prompt security** (`lib/prompt.ts`): the system prompt is 100% code-owned and
  never contains raw user text. All user-derived values are trimmed, length-capped,
  stripped of control chars / code fences / angle brackets, and wrapped in
  `<user_data field="…">…</user_data>`; the system prompt declares that content
  inside those tags is data, never instructions.
- **Input validation** (`lib/schema.ts`): every route validates with zod; chip
  values are allowlisted; oversized bodies are rejected; errors are never echoed.

## Environment

Copy `.env.example` → `.env.local` and fill in:

| Var | Purpose |
|---|---|
| `CEREBRAS_API_KEY` | Primary AI (server-only) |
| `CEREBRAS_MODEL` | Optional pin; otherwise auto-discovered |
| `GEMINI_API_KEY` | Failover AI (server-only) |
| `GEMINI_MODEL` | Default `gemini-flash-lite-latest` |
| `SARVAM_API_KEY` | TTS (server-only); if absent, browser TTS is used |
| `NEXT_PUBLIC_SUPABASE_URL` | Events table + realtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe to expose) |

## Run locally

```bash
cd v2
npm install
cp .env.example .env.local   # fill in keys
npm run dev                  # http://localhost:3000
```

## Deployed URL

**Live:** https://web-three-nu-14.vercel.app

Deployed on Vercel (Root Directory = `v2`, framework Next.js). All provider keys
and the Supabase pair are set as server-side environment variables in the
project; `CEREBRAS_MODEL` is left unset so the fastest served model is
auto-discovered at runtime.
