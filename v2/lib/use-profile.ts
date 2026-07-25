"use client";

import { useEffect, useState } from "react";
import { loadProfile } from "./profile-store";
import type { Profile } from "./types";

/** Loads the localStorage profile once on mount. `ready` guards SSR hydration. */
export function useProfile(): { profile: Profile | null; ready: boolean } {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
  }, []);

  return { profile, ready };
}
