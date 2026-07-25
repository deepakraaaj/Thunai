// =============================================================================
// events.ts — Client-side event log. Uses Supabase (`events` table + realtime)
// when configured; otherwise a localStorage echo with a same-tab event bus so
// the caregiver timeline still populates and never renders blank.
// =============================================================================

"use client";

import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { AnchorEvent, EventType } from "./types";

const LOCAL_KEY = "thunai.events.v2";
const LEGACY_KEY = "anchor.events.v1";
const BUS = "thunai:event";

function readLocal(): AnchorEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(LOCAL_KEY) ??
      window.localStorage.getItem(LEGACY_KEY) ??
      "[]";
    return JSON.parse(raw) as AnchorEvent[];
  } catch {
    return [];
  }
}

function writeLocal(events: AnchorEvent[]): void {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(events.slice(0, 100)));
  window.localStorage.removeItem(LEGACY_KEY);
}

/** Record an event. Best-effort: never throws into the UI. */
export async function logEvent(
  type: EventType,
  userName: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const evt: AnchorEvent = {
    id: crypto.randomUUID(),
    type,
    user_name: userName,
    payload,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { error } = (await sb?.from("events").insert({
        type,
        user_name: userName,
        payload,
      })) ?? { error: new Error("supabase_unavailable") };
      if (!error) return;
    } catch {
      // fall through to local echo
    }
  }

  const events = [evt, ...readLocal()];
  writeLocal(events);
  window.dispatchEvent(new CustomEvent<AnchorEvent>(BUS, { detail: evt }));
}

/** Fetch the recent event history (newest first). */
export async function fetchEvents(userName: string): Promise<AnchorEvent[]> {
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase();
      const { data } = await sb!
        .from("events")
        .select("*")
        .eq("user_name", userName)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) return data as AnchorEvent[];
    } catch {
      // fall through
    }
  }
  return readLocal().filter((e) => e.user_name === userName);
}

/** Subscribe to new events. Returns an unsubscribe fn. */
export function subscribeEvents(
  userName: string,
  onNew: (evt: AnchorEvent) => void,
): () => void {
  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    const channel = sb!
      .channel("events-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          const evt = payload.new as AnchorEvent;
          if (evt.user_name === userName) onNew(evt);
        },
      )
      .subscribe();
    return () => {
      sb!.removeChannel(channel);
    };
  }

  const handler = (e: Event) => {
    const evt = (e as CustomEvent<AnchorEvent>).detail;
    if (evt.user_name === userName) onNew(evt);
  };
  window.addEventListener(BUS, handler);
  return () => {
    window.removeEventListener(BUS, handler);
  };
}
