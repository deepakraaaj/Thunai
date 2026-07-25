// =============================================================================
// profile-store.ts — The profile lives entirely in localStorage (no auth).
// Also exposes the day/rupee derivations and the built-in Ravi sample profile.
// =============================================================================

"use client";

import { STAGE_DAYS, type Profile } from "./types";

const KEY = "anchor.profile.v1";

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** Total days in recovery = seeded start days + days elapsed since profile made. */
export function daysInRecovery(p: Profile): number {
  const elapsed = Math.floor((Date.now() - p.createdAt) / 86_400_000);
  return Math.max(0, p.startDays + Math.max(0, elapsed));
}

/** Rupees saved = days × dailySpend. */
export function rupeesSaved(p: Profile): number {
  return daysInRecovery(p) * Math.max(0, Math.round(p.dailySpend));
}

/** The built-in sample profile (clearly labeled sample data in the UI). */
export function raviSampleProfile(): Profile {
  return {
    name: "Ravi",
    substance: "Alcohol",
    stage: "few-months",
    startDays: STAGE_DAYS["few-months"], // 90
    createdAt: Date.now(),
    trigger: "Work stress",
    doingItFor: "My child",
    lovedOneName: "Ananya",
    dailySpend: 525,
    desire: "Good food",
    language: "ta",
    isSample: true,
  };
}
