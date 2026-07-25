"use client";

import { useEffect, useState } from "react";
import { loadProfile } from "./profile-store";
import type { Profile } from "./types";

/** Loads the localStorage profile once on mount. `ready` guards SSR hydration. */
export function useProfile(): { profile: Profile | null; ready: boolean } {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedProfile = loadProfile();
    setProfile(storedProfile);
    document.documentElement.lang =
      storedProfile?.language === "hi" || storedProfile?.language === "hinglish"
        ? "hi"
        : storedProfile?.language === "ta" || storedProfile?.language === "tanglish"
          ? "ta"
          : "en";
    setReady(true);
  }, []);

  return { profile, ready };
}
