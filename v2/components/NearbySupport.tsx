"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, LocateFixed, MapPin, MessageCircle, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/api-client";
import { brandName, type Profile } from "@/lib/types";
import { logEvent } from "@/lib/events";

type NearbyResult = {
  nearby: boolean;
  distanceMeters?: number;
  placeName?: string;
  unavailable?: boolean;
  places?: Array<{
    latitude: number;
    longitude: number;
    name?: string;
    distanceMeters: number;
  }>;
};

const NearbyMap = dynamic(() => import("./NearbyMap"), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-2xl bg-base" />,
});

export default function NearbySupport({ profile }: { profile: Profile }) {
  const router = useRouter();
  const watchRef = useRef<number | null>(null);
  const lastCheckRef = useRef(0);
  const notifiedPlaceRef = useRef<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState<NearbyResult | null>(null);
  const [result, setResult] = useState<NearbyResult | null>(null);
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const isHindi = profile.language === "hi" || profile.language === "hinglish";

  function notifyCaregiver(nearbyResult: NearbyResult, simulated = false) {
    const placeName = nearbyResult.placeName ?? "a wine shop";
    const notificationKey = `${placeName}:${simulated}`;
    if (notifiedPlaceRef.current === notificationKey) return;
    notifiedPlaceRef.current = notificationKey;
    void logEvent("nearby-risk", profile.name, {
      placeName,
      distanceMeters: nearbyResult.distanceMeters ?? 0,
      simulated,
      supporterName: profile.supporterName ?? profile.lovedOneName ?? "Supporter",
    });
  }

  useEffect(
    () => () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    },
    [],
  );

  async function checkPosition(position: GeolocationPosition) {
    const now = Date.now();
    if (now - lastCheckRef.current < 60_000) return;
    lastCheckRef.current = now;
    setChecking(true);
    const roundedPosition = {
      latitude: Number(position.coords.latitude.toFixed(4)),
      longitude: Number(position.coords.longitude.toFixed(4)),
    };
    setPosition(roundedPosition);
    try {
      const nearbyResult = await postJson<NearbyResult>("/api/nearby-risk", roundedPosition);
      setResult(nearbyResult);
      if (nearbyResult.nearby) {
        setAlert(nearbyResult);
        notifyCaregiver(nearbyResult);
      }
      setError(nearbyResult.unavailable ? "OpenStreetMap is temporarily unavailable. We’ll retry automatically." : "");
    } catch {
      setError("Could not check nearby places.");
    } finally {
      setChecking(false);
    }
  }

  function enable() {
    if (!navigator.geolocation) {
      setError("Location is not supported on this device.");
      return;
    }
    setError("");
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setEnabled(true);
        void checkPosition(position);
      },
      () => setError("Allow location access to enable nearby support."),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  function disable() {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setEnabled(false);
    setAlert(null);
    setResult(null);
    setPosition(null);
  }

  function runJudgeDemo() {
    const demoPosition = { latitude: 13.0827, longitude: 80.2707 };
    const demoResult: NearbyResult = {
      nearby: true,
      distanceMeters: 120,
      placeName: "Demo wine shop",
      places: [
        {
          latitude: 13.0836,
          longitude: 80.2709,
          name: "Demo wine shop",
          distanceMeters: 120,
        },
      ],
    };
    setError("");
    setEnabled(true);
    setPosition(demoPosition);
    setResult(demoResult);
    setAlert(demoResult);
    notifyCaregiver(demoResult, true);
  }

  async function copyCaregiverLink() {
    const url = `${window.location.origin}/caregiver?watch=${encodeURIComponent(profile.name)}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  }

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LocateFixed className="text-teal" />
          <div>
            <h2 className="font-semibold text-slate-100">Nearby support</h2>
            <p className="text-xs text-slate-400">Checks only while Thunai is open</p>
          </div>
        </div>
        <button
          onClick={enabled ? disable : enable}
          className={`rounded-full px-4 py-2 text-sm font-medium ${enabled ? "bg-teal/15 text-teal" : "bg-base text-slate-200"}`}
        >
          {checking ? "Checking…" : enabled ? "On" : "Enable"}
        </button>
      </div>
      {error && <p role="status" className="mt-2 text-xs text-amber">{error}</p>}
      <button
        onClick={runJudgeDemo}
        className="mt-3 w-full rounded-xl border border-dashed border-lavender/50 px-3 py-2 text-sm font-medium text-lavender"
      >
        Judge demo — simulate shop 120m away
      </button>
      <button
        onClick={() => void copyCaregiverLink()}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-base px-3 py-2 text-sm text-slate-300"
      >
        <Copy size={15} /> {linkCopied ? "Caregiver link copied" : "Copy spouse/caregiver link"}
      </button>
      {enabled && result && !result.unavailable && (
        <p role="status" className="mt-2 text-xs text-slate-400">
          {result.places?.length
            ? `${result.places.length} mapped wine shop${result.places.length === 1 ? "" : "s"} found within 1km.`
            : "No mapped wine shops found within 1km."}
        </p>
      )}
      {enabled && position && result && !result.unavailable && (
        <div className="mt-3 overflow-hidden rounded-2xl">
          <NearbyMap
            latitude={position.latitude}
            longitude={position.longitude}
            places={result.places ?? []}
          />
        </div>
      )}

      {alert?.nearby && (
        <div role="alert" className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-depth">
            <button onClick={() => setAlert(null)} aria-label="Dismiss" className="float-right rounded-full p-2 text-slate-400"><X /></button>
            <MapPin size={32} className="text-amber" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-50">
              {brandName(profile.language)} is with you
            </h2>
            <p className="mt-3 text-slate-300">
              {isHindi
                ? "यह जगह शायद थोड़ी मुश्किल लगे। अभी कोई फैसला मत कीजिए—बस मेरे साथ दस सेकंड रुकिए।"
                : `You may be near ${alert.placeName ?? "a wine shop"}. No decision is needed right now—pause here with me for ten seconds.`}
            </p>
            <button
              onClick={() => {
                window.sessionStorage.setItem("thunai.conversation.context", "nearby");
                router.push("/conversation");
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal to-lavender py-4 font-semibold text-base"
            >
              <MessageCircle /> Talk to {brandName(profile.language)}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
