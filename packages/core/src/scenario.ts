// =============================================================================
// scenario.ts — INPUT-ONLY test scenario seed (no AI outputs, ever)
// -----------------------------------------------------------------------------
// DECISION: A pure builder that returns profiles, 3 weeks of check-in history
// (with a deliberate Friday-night risk pattern), derived timeline events, and a
// consent link. Everything here is INPUT data a user could have entered — it
// contains NO generated scripts or fabricated model responses.
// RATIONALE: AGENTS.md requires "Load test scenario" to seed inputs only so live
// AI is exercised at demo time; deriving check-ins programmatically keeps the
// Friday-night pattern honest and reproducible for the risk-window algorithm.
// =============================================================================

import type {
  CaregiverProfile,
  CheckinRecord,
  MoodLabel,
  RiskLevel,
  TimelineEvent,
  UserProfile,
} from "@anchor/contracts";
import { classifyCheckin } from "./classify.js";

export interface ScenarioSeed {
  users: UserProfile[];
  caregivers: CaregiverProfile[];
  checkins: CheckinRecord[];
  timeline: Record<string, TimelineEvent[]>; // keyed by userId
  links: { linkId: string; caregiverId: string; userId: string; consent: true; linkedAt: string }[];
}

const RAVI_ID = "user-ravi";
const MEERA_ID = "user-meera";
const CAREGIVER_ID = "caregiver-lakshmi";

/** Anchor date the 3-week history is built backwards from (IST-ish). */
function anchorNow(): Date {
  // Fixed reference keeps seeds deterministic across loads/tests.
  return new Date("2026-07-25T09:00:00.000Z");
}

interface CheckinTemplate {
  daysAgo: number;
  /** IST hour of day the check-in happened. */
  istHour: number;
  transcript: string;
}

// --- Ravi's 3 weeks: calm most days, hard on FRIDAY NIGHTS (work stress) ---
// Friday = the risky window. Weekdays are steady; Fridays 20:00 IST spike.
// NOTE: relative to the anchor (Sat 2026-07-25 IST), daysAgo 15/8/1 at 20:00
// IST all land on FRIDAYS — that is where the risky evening check-ins sit.
const RAVI_HISTORY: CheckinTemplate[] = [
  // Week 3 (oldest)
  { daysAgo: 18, istHour: 8, transcript: "Woke up okay, feeling steady. Had a good walk." },
  { daysAgo: 16, istHour: 9, transcript: "Fine today, work was calm. Thought about Ananya." },
  { daysAgo: 15, istHour: 20, transcript: "Friday again. Work was brutal, so stressed, the urge to drink is strong tonight." },
  { daysAgo: 14, istHour: 10, transcript: "Rough night but I got through it. A bit tired." },
  // Week 2
  { daysAgo: 12, istHour: 8, transcript: "Good morning, feeling hopeful and rested." },
  { daysAgo: 10, istHour: 9, transcript: "Okay day. Steady. Kept busy." },
  { daysAgo: 8, istHour: 20, transcript: "It's Friday night and the work stress is crushing me, I really want a drink." },
  { daysAgo: 7, istHour: 11, transcript: "Made it through Friday. Proud of that. Tired though." },
  // Week 1 (most recent)
  { daysAgo: 5, istHour: 8, transcript: "Feeling calm and grateful today." },
  { daysAgo: 3, istHour: 9, transcript: "Fine. A little anxious about work but okay." },
  { daysAgo: 1, istHour: 21, transcript: "Friday evening, overwhelmed by work pressure, craving is bad and I feel alone." },
  { daysAgo: 0, istHour: 10, transcript: "Survived another Friday. Steady this morning." },
];

// --- Meera's shorter history: loneliness, more variable ---
const MEERA_HISTORY: CheckinTemplate[] = [
  { daysAgo: 12, istHour: 22, transcript: "So lonely tonight. The nights are the hardest." },
  { daysAgo: 10, istHour: 14, transcript: "Okay during the day when I'm around people." },
  { daysAgo: 7, istHour: 23, transcript: "Alone again, feeling empty and tempted." },
  { daysAgo: 5, istHour: 15, transcript: "Better today, a friend called." },
  { daysAgo: 3, istHour: 22, transcript: "The loneliness is heavy tonight, craving hits when it's quiet." },
  { daysAgo: 1, istHour: 9, transcript: "Steady this morning. Trying." },
];

const IST_OFFSET_MIN = 5 * 60 + 30;

/** Build an ISO instant for `daysAgo` at `istHour` local IST. */
function istInstant(base: Date, daysAgo: number, istHour: number): string {
  const day = new Date(base.getTime() - daysAgo * 86_400_000);
  // Set to the desired IST hour: compute the UTC that corresponds to it.
  const utcMs = Date.UTC(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate(),
    istHour,
    0,
    0,
  ) - IST_OFFSET_MIN * 60_000;
  return new Date(utcMs).toISOString();
}

function buildCheckins(userId: string, base: Date, templates: CheckinTemplate[]): CheckinRecord[] {
  return templates.map((t, i) => {
    const createdAt = istInstant(base, t.daysAgo, t.istHour);
    const { mood, riskLevel, crisisFlag } = classifyCheckin(t.transcript);
    return {
      id: `${userId}-checkin-${i}`,
      userId,
      createdAt,
      transcript: t.transcript,
      mood: mood as MoodLabel,
      riskLevel: riskLevel as RiskLevel,
      crisisFlag,
    };
  });
}

function checkinsToTimeline(checkins: CheckinRecord[]): TimelineEvent[] {
  return checkins.map((c) => ({
    id: `evt-${c.id}`,
    type: "checkin" as const,
    at: c.createdAt,
    title: "Daily check-in",
    detail: c.transcript,
    riskLevel: c.riskLevel,
    mood: c.mood,
  }));
}

/** Build the full input-only scenario seed. */
export function buildScenario(): ScenarioSeed {
  const base = anchorNow();

  const ravi: UserProfile = {
    userId: RAVI_ID,
    name: "Ravi",
    persona: "individual",
    substance: "alcohol",
    daysSober: 90,
    stage: "established",
    trigger: "work stress",
    motivation: "his daughter Ananya",
    language: "ta",
    dailyCostInr: 525,
    createdAt: istInstant(base, 90, 9),
  };

  const meera: UserProfile = {
    userId: MEERA_ID,
    name: "Meera",
    persona: "individual",
    substance: "opioids",
    daysSober: 14,
    stage: "early",
    trigger: "loneliness",
    motivation: "getting her life back",
    language: "en",
    createdAt: istInstant(base, 14, 9),
  };

  const caregiver: CaregiverProfile = {
    caregiverId: CAREGIVER_ID,
    name: "Lakshmi",
    persona: "caregiver",
    language: "ta",
    createdAt: istInstant(base, 90, 9),
  };

  const raviCheckins = buildCheckins(RAVI_ID, base, RAVI_HISTORY);
  const meeraCheckins = buildCheckins(MEERA_ID, base, MEERA_HISTORY);

  // Milestone events (input facts, not AI output).
  const raviMilestone: TimelineEvent = {
    id: "evt-ravi-milestone-90",
    type: "milestone",
    at: istInstant(base, 0, 9),
    title: "90 days strong 🎉",
    detail: "Ravi reached 90 days.",
  };

  return {
    users: [ravi, meera],
    caregivers: [caregiver],
    checkins: [...raviCheckins, ...meeraCheckins],
    timeline: {
      [RAVI_ID]: [raviMilestone, ...checkinsToTimeline(raviCheckins)].sort(byNewest),
      [MEERA_ID]: checkinsToTimeline(meeraCheckins).sort(byNewest),
    },
    links: [
      {
        linkId: "link-lakshmi-ravi",
        caregiverId: CAREGIVER_ID,
        userId: RAVI_ID,
        consent: true,
        linkedAt: istInstant(base, 85, 9),
      },
    ],
  };
}

function byNewest(a: TimelineEvent, b: TimelineEvent): number {
  return new Date(b.at).getTime() - new Date(a.at).getTime();
}

export const SCENARIO_IDS = {
  RAVI_ID,
  MEERA_ID,
  CAREGIVER_ID,
} as const;
