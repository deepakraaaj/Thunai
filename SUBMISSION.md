# Anchor — Submission

> Living document — updated as features land across lanes. Owned by Claude
> (Core/Integration lane) per AGENTS.md.

## What it is

**Anchor** is a web-only, mobile-first recovery and prevention companion for
people with substance use disorders and the people who care for them. It turns
every hard moment — a craving, a slip, a lonely Friday night — into a warm,
in-the-moment coping script generated live in the user's own language, and it
learns each person's risk patterns to reach out *before* a crisis hits. Every AI
response is produced live at the moment of use (Cerebras primary, automatic
Gemini failover) and carries full transparency metadata.

## Feature → GenAI service → code location

| Feature | GenAI service (live) | Code location |
|---|---|---|
| SOS in-the-moment coping script | Cerebras `gpt-oss-120b` → Gemini `gemini-flash-lite-latest` | `packages/core/src/prompts.ts` (`buildSosPrompt`), `services.ts` (`sosScript`) · `POST /api/scripts/sos` |
| Caregiver coaching script | same router | `prompts.ts` (`buildCaregiverPrompt`), `services.ts` (`caregiverScript`) · `POST /api/scripts/caregiver` |
| Daily check-in reflection | same router | `prompts.ts` (`buildCheckinReflectionPrompt`), `services.ts` (`checkin`) · `POST /api/checkins` |
| Mood + risk classification | deterministic (no LLM) | `packages/core/src/classify.ts` (`classifyCheckin`) |
| Crisis-language safety → Tele-MANAS 14416 | deterministic (no LLM) | `packages/core/src/safety.ts` (`detectCrisisLanguage`) |
| Slip / relapse compassion + WhatsApp draft | same router | `prompts.ts` (`buildSlipPrompt`, `parseSlipOutput`), `services.ts` (`slipScript`) · `POST /api/scripts/slip` |
| Weekly insights summary | same router | `prompts.ts` (`buildInsightsPrompt`), `services.ts` (`insights`) · `GET /api/insights/:userId` |
| Risk-window derivation | deterministic (no LLM) | `packages/core/src/risk-windows.ts` (`deriveRiskWindows`) |
| Pre-crisis prediction nudge | same router | `prompts.ts` (`buildPredictionNudgePrompt`), `risk-windows.ts` (`getActivePrediction`), `services.ts` (`prediction`) · `GET /api/predictions/:userId` |
| Provider router + failover + transparency metadata | Cerebras → Gemini | `packages/core/src/provider-router.ts` |
| Test scenario (input-only seed) | none (input only) | `packages/core/src/scenario.ts` (`buildScenario`) · `POST /api/scenario/load` |

Contracts every lane codes against: `packages/contracts/api.md` + `types.ts` (frozen).

## AI transparency

Every generated response returns `AiMeta`: `provider`, `modelId`, `latencyMs`,
`contextFields[]`. The only non-live output permitted is a labeled offline
safety script (`isOfflineFallback: true` → UI shows exactly
`Offline safety script (pre-written)`). Provider keys are backend-only and never
returned to the client.

Verified live: Cerebras `gpt-oss-120b` (~0.8s SOS generation, in Tamil for
Ravi); failover `gemini-flash-lite-latest` (the brief's `gemini-2.5-flash-lite`
404s for new users — see `PROPOSALS.md`).

## Test credentials / scenario

Load input data via **Load test scenario** (`POST /api/scenario/load`) — seeds
inputs only, no AI output:

| Role | Who | Details |
|---|---|---|
| Individual | **Ravi** (`user-ravi`) | alcohol, 90 days, trigger: work stress, motivation: daughter Ananya, language: Tamil, ₹525/day. 3 weeks of check-ins with a **Friday-night** risk pattern. |
| Individual | **Meera** (`user-meera`) | opioids, 14 days, trigger: loneliness, language: English. |
| Caregiver | **Lakshmi** (`caregiver-lakshmi`) | consent-linked to Ravi (`link-lakshmi-ravi`). |

<!-- TODO(frontend/backend): add login credentials + deep links once auth lands. -->

## Deployed URLs

<!-- TODO: fill at checkpoint 3 (public deploy + phone smoke test). -->
- Frontend: _pending_
- Backend: _pending_

## Run locally

<!-- TODO(backend/frontend): confirm exact workspace commands once root config lands. -->

```bash
# Provider keys (backend-only) — see .env:
#   LLM_BASE_URL=https://api.cerebras.ai/v1
#   LLM_MODEL=gpt-oss-120b
#   LLM_API_KEY=...            (Cerebras)
#   GEMINI_API_KEY=...         (failover)
#   GEMINI_MODEL=gemini-flash-lite-latest

# Core package (domain logic + live router):
cd packages/core
npm test        # 35 unit tests: prompts, failover, risk windows, crisis detection
```

## Status of lanes

- **Core/Integration (Claude):** contracts frozen; `packages/core` complete
  (router, prompts, safety, classifier, risk windows, scenario, services); 35
  unit tests + strict typecheck passing; live SOS/crisis verified end-to-end.
- **Frontend (Antigravity):** Anchor web platform shipped in `apps/web/` (6
  screens, living garden, Tamil speech synthesis, Tele-MANAS escalation,
  caregiver dashboard, scenario seeder). See `STATUS.md`.
- **Backend (Codex):** implementing `apps/api/` against frozen contracts. See
  `STATUS.md`.
