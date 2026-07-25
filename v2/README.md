# Thunai / Sahara

> A multilingual, location-aware recovery companion that responds during the few minutes when support matters most.

**Live application:** https://web-three-nu-14.vercel.app

Thunai means **partner**. In Hindi and Hinglish modes the companion becomes
**Sahara**—support that stays with the user through a craving instead of making
them fill out a form or search for help.

## The problem

People recovering from alcohol, tobacco, or substance use often know *why* they
want to stop. The hardest part is the short, high-pressure moment when:

- a craving becomes intense;
- they pass a familiar wine shop or triggering location;
- typing a long explanation feels impossible;
- a supporter does not know what to say;
- a slip creates shame and makes progress feel erased; or
- the financial and health value of recovery is difficult to see.

The missing product is not another information library. It is a compassionate
partner that intervenes immediately, speaks the user's language, and brings a
trusted person into the moment.

## How Thunai solves it

```text
Craving, check-in, slip, or risky location
                    │
                    ▼
        One tap / voice / location signal
                    │
                    ▼
      Personalized multilingual AI support
        Cerebras ─────┬───── Gemini
                     ▼
             labeled offline fallback
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 spoken user guidance     Supabase realtime alert
                              to caregiver
```

Thunai combines immediate AI support, voice, savings motivation, open-source
location intelligence, and a two-person caregiver loop in one mobile-first web
experience.

## Core features

### One-tap SOS

The breathing orb is the SOS control. One press creates a live, personalized
coping response, speaks it aloud, offers one small next action, and provides a
direct call to the user's configured supporter.

### Natural conversation

The user can continue talking instead of receiving a single static answer:

- typed or hold-to-talk input;
- spoken AI replies;
- recent-turn conversational context;
- quick-start prompts for difficult moments;
- short, interruption-friendly responses; and
- English, Tamil, Tanglish, Hindi, and Hinglish support.

### Proactive location support

With explicit permission, Thunai checks nearby OpenStreetMap data while the app
is open. When a mapped wine/alcohol shop is within the safety radius it:

- displays a Leaflet map with user and shop markers;
- draws a 200-metre intervention radius;
- opens a compassionate Thunai/Sahara message;
- offers an immediate conversation; and
- sends a privacy-safe realtime event to the caregiver.

The location stack is fully open source: **Leaflet + OpenStreetMap tiles +
multiple Overpass API mirrors**. Results are cached for five minutes. Raw
coordinates are never sent to the caregiver or stored in the event timeline.

### Two-user caregiver loop

The recovering user shares a caregiver link such as:

```text
/caregiver?watch=Ravi
```

The spouse/caregiver opens it on a second browser or phone and receives
Supabase Realtime events independently. SOS and nearby-risk events produce:

- a high-priority visual alert;
- an audible three-tone alarm;
- mobile vibration where supported;
- a browser/OS notification;
- shop name and approximate distance without coordinates; and
- compassionate guidance about what to say and avoid.

### Judge-ready location simulation

The **Judge demo — simulate shop 120m away** control exercises the same map,
intervention, conversation, Supabase event, caregiver timeline, sound,
vibration, and notification path without depending on venue location or GPS.
It is clearly labeled as simulated.

### Savings and health momentum

A dynamic SVG dashboard converts recovery into visible progress:

- rupees kept;
- percentage toward a personally selected goal;
- recovery days; and
- careful health-momentum language without unsupported medical claims.

### Compassionate slip support

The “I slipped” flow never resets the user's progress or uses shame. It creates
a supportive response and a ready-to-send WhatsApp message to their trusted
person.

### Voice check-in and caregiver coaching

Voice check-ins produce a mood, risk level, warm reflection, and spoken reply.
SOS events also generate live caregiver coaching with short **SAY** and
**AVOID** lists.

## Languages and identity

| Mode | Brand | Script / speech |
|---|---|---|
| English | Thunai | English / `en-IN` |
| Tamil | Thunai | Tamil / `ta-IN` |
| Tanglish | Thunai | Romanized Tamil / `ta-IN` |
| Hindi | Sahara | Devanagari / `hi-IN` |
| Hinglish | Sahara | Romanized Hindi / `hi-IN` |

## Architecture

```text
Next.js 16 App Router
├── Mobile-first React UI
│   ├── localStorage profile and migration
│   ├── Web Speech recognition
│   ├── Sarvam / browser speech synthesis
│   ├── Leaflet + OpenStreetMap
│   └── browser notifications, sound and vibration
├── Next.js route handlers
│   ├── Zod input validation
│   ├── bounded request bodies and rate limiting
│   ├── prompt sanitization and injection boundaries
│   ├── Cerebras + staggered Gemini failover
│   └── Overpass mirror racing and caching
└── Supabase
    ├── events table
    └── realtime caregiver subscription
```

## AI reliability and transparency

- Cerebras and Gemini begin with a short stagger rather than waiting through a
  long sequential failure chain.
- Each provider receives one quick retry with a 4.5-second attempt timeout.
- If both providers fail, the UI displays a clearly labeled pre-written offline
  safety response.
- Every live response shows provider, model, and latency metadata.
- User-derived values are sanitized, length-capped, stripped of delimiter
  characters, and placed inside `<user_data>` boundaries that the system prompt
  treats as data—not instructions.

## Security and privacy

- Provider keys remain server-side.
- Every API route uses strict Zod schemas.
- Request bodies are byte-limited.
- API calls are rate-limited per client and route.
- Sensitive JSON responses use `Cache-Control: no-store`.
- Supporter phone numbers are validated and stored locally.
- Location monitoring is opt-in and foreground-only.
- Location requests use rounded coordinates.
- Caregiver events contain context, never raw coordinates.
- Old Anchor local data migrates safely to Thunai storage keys.

## Technology

- Next.js 16.2.11 and React 19
- TypeScript and Tailwind CSS
- Cerebras inference API
- Gemini generative AI fallback
- Sarvam text-to-speech with browser TTS fallback
- Supabase database and Realtime
- Leaflet, React-Leaflet, OpenStreetMap and Overpass
- Framer Motion, Lucide icons and Zod

## Run locally

```bash
cd v2
npm install
cp .env.example .env.local
npm run dev
```

Open:

- User experience: http://localhost:3000/home
- Caregiver demo: http://localhost:3000/caregiver?watch=Ravi

## Environment variables

| Variable | Purpose |
|---|---|
| `CEREBRAS_API_KEY` | Primary AI provider |
| `CEREBRAS_BASE_URL` | Optional Cerebras endpoint override |
| `CEREBRAS_MODEL` | Optional model pin; otherwise discovered |
| `GEMINI_API_KEY` | AI failover provider |
| `GEMINI_MODEL` | Gemini model selection |
| `SARVAM_API_KEY` | Server-side text-to-speech |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anonymous key |

No Google Maps key is required.

## Supabase event model

The existing `events` table needs these fields:

```text
id          uuid / primary key
type        text
user_name   text
payload     jsonb
created_at  timestamptz
```

Enable Realtime replication for the `events` table. The production version
should use authenticated pairing and user-scoped RLS policies; the hackathon
demo uses the shared profile name in the caregiver link.

## Validation

```bash
npm run typecheck
npm test
npm run build
```

The repository includes 15 focused tests for prompt-injection isolation,
Thunai/Sahara identity selection, language locales, supporter-phone validation,
location boundaries, conversation limits, multilingual safety fallbacks, and
TTS constraints.

## Demo flow

1. Complete onboarding as Ravi.
2. Copy the spouse/caregiver link and open it in a second browser.
3. On the caregiver page, click **Enable caregiver alerts** and allow browser
   notifications.
4. On the user page, run **Judge demo — simulate shop 120m away**.
5. Show the Leaflet map and user intervention.
6. Show the second browser receiving sound, vibration, notification, and the
   Supabase realtime event.
7. Open **Talk to Thunai/Sahara** and continue the multilingual conversation.
8. Return home and show the savings and health-momentum visualization.

## Why it stands out

Thunai does not wait for a person in crisis to search for help. It combines
prevention, immediate intervention, multilingual conversation, visible
motivation, and human support—while keeping fallbacks honest and location data
private.
