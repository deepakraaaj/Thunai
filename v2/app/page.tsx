"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/use-profile";
import Orb from "@/components/Orb";

/** Entry: send first-run users to onboarding, returning users to home. */
export default function Gate() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(profile ? "/home" : "/onboarding");
  }, [ready, profile, router]);

  return (
    <main className="grid min-h-dvh place-items-center bg-base">
      <Orb size={140} />
    </main>
  );
}
