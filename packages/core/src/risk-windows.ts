// =============================================================================
// risk-windows.ts — Derive recurring risk windows from check-in history
// -----------------------------------------------------------------------------
// DECISION: Aggregate historical check-ins into (dayOfWeek × 3-hour bucket)
// cells, score each by risk density, and emit RiskWindows above a threshold.
// `getActivePrediction` then tests whether `now` falls inside a derived window
// to drive the pre-crisis nudge.
// RATIONALE: The scenario plants a Friday-night pattern; a density-over-buckets
// approach surfaces that recurring window explanatorily (not a black box) and is
// deterministic/unit-testable. Uses IST (UTC+5:30) for day/hour bucketing since
// users are in India.
// =============================================================================

import type { CheckinRecord, RiskLevel, RiskWindow } from "@anchor/contracts";

/** Weight per risk level → higher weight means the bucket trends riskier. */
const RISK_WEIGHT: Record<RiskLevel, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  critical: 3,
};

const DAY_NAMES = [
  "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
] as const;

/** India Standard Time offset in minutes (UTC+5:30). */
const IST_OFFSET_MIN = 5 * 60 + 30;
/** Bucket width in hours. */
const BUCKET_HOURS = 3;

interface LocalParts {
  dayOfWeek: number; // 0=Sun
  hour: number; // 0..23
}

/** Convert an ISO instant to IST day-of-week + hour. */
function toIst(iso: string): LocalParts {
  const t = new Date(iso).getTime() + IST_OFFSET_MIN * 60_000;
  const d = new Date(t);
  return { dayOfWeek: d.getUTCDay(), hour: d.getUTCHours() };
}

function bucketStart(hour: number): number {
  return Math.floor(hour / BUCKET_HOURS) * BUCKET_HOURS;
}

function labelFor(dayOfWeek: number, startHour: number): string {
  const day = DAY_NAMES[dayOfWeek] ?? "Day";
  const part =
    startHour >= 18 ? "evening" : startHour >= 12 ? "afternoon" : startHour >= 5 ? "morning" : "night";
  return `${day} ${part}`;
}

interface Cell {
  weight: number;
  count: number;
  worst: RiskLevel;
}

/**
 * Derive recurring risk windows from history. A window is emitted when a
 * (day × 3h) bucket has average risk weight >= `minAvgWeight` across at least
 * `minObservations` check-ins.
 */
export function deriveRiskWindows(
  checkins: CheckinRecord[],
  opts: { minObservations?: number; minAvgWeight?: number } = {},
): RiskWindow[] {
  const minObservations = opts.minObservations ?? 2;
  const minAvgWeight = opts.minAvgWeight ?? 1.5;

  const cells = new Map<string, Cell>();
  for (const c of checkins) {
    const { dayOfWeek, hour } = toIst(c.createdAt);
    const start = bucketStart(hour);
    const key = `${dayOfWeek}:${start}`;
    const w = RISK_WEIGHT[c.riskLevel];
    const prev = cells.get(key) ?? { weight: 0, count: 0, worst: "low" as RiskLevel };
    cells.set(key, {
      weight: prev.weight + w,
      count: prev.count + 1,
      worst: RISK_WEIGHT[c.riskLevel] > RISK_WEIGHT[prev.worst] ? c.riskLevel : prev.worst,
    });
  }

  const windows: RiskWindow[] = [];
  for (const [key, cell] of cells) {
    if (cell.count < minObservations) continue;
    const avg = cell.weight / cell.count;
    if (avg < minAvgWeight) continue;

    const [dayStr, startStr] = key.split(":");
    const dayOfWeek = Number(dayStr);
    const startHour = Number(startStr);
    windows.push({
      dayOfWeek,
      startHour,
      endHour: startHour + BUCKET_HOURS,
      riskLevel: avgToLevel(avg),
      label: labelFor(dayOfWeek, startHour),
      // Confidence grows with observations and average severity (capped at 1).
      confidence: Math.min(1, (avg / 3) * 0.6 + Math.min(cell.count, 5) / 5 * 0.4),
    });
  }

  // Riskiest first, then most confident.
  windows.sort(
    (a, b) => RISK_WEIGHT[b.riskLevel] - RISK_WEIGHT[a.riskLevel] || b.confidence - a.confidence,
  );
  return windows;
}

function avgToLevel(avg: number): RiskLevel {
  if (avg >= 2.5) return "critical";
  if (avg >= 2) return "high";
  if (avg >= 1) return "moderate";
  return "low";
}

/** Whether `now` (any instant) falls inside a given window, in IST. */
export function isNowInWindow(window: RiskWindow, now: Date): boolean {
  const { dayOfWeek, hour } = toIst(now.toISOString());
  return (
    dayOfWeek === window.dayOfWeek && hour >= window.startHour && hour < window.endHour
  );
}

export interface ActivePrediction {
  active: boolean;
  window?: RiskWindow;
}

/**
 * Returns the currently-active risk window (if `now` is inside one). The caller
 * (service layer) generates the live nudge text when active.
 */
export function getActivePrediction(
  checkins: CheckinRecord[],
  now: Date = new Date(),
): ActivePrediction {
  const windows = deriveRiskWindows(checkins);
  const window = windows.find((w) => isNowInWindow(w, now));
  return window ? { active: true, window } : { active: false };
}
