// =============================================================================
// supabase.ts — Optional events store + realtime.
// Supabase is used ONLY for the `events` table and its realtime channel. If the
// env pair is absent, isSupabaseConfigured() is false and callers fall back to
// a local in-memory echo so nothing in the UI ever visibly breaks.
// =============================================================================

"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon);
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) client = createClient(url!, anon!);
  return client;
}
