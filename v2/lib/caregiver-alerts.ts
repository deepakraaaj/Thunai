"use client";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return null;
  audioContext ??= new AudioContextCtor();
  return audioContext;
}

export async function enableCaregiverAlerts(): Promise<NotificationPermission | "unsupported"> {
  const context = getAudioContext();
  if (context?.state === "suspended") await context.resume();
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "default") return Notification.requestPermission();
  return Notification.permission;
}

export function playCaregiverAlert(): void {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const now = context.currentTime;

  [0, 0.28, 0.56].forEach((delay, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = index === 1 ? 660 : 880;
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.18, now + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.2);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + 0.22);
  });
}

export function notifyCaregiver({
  personName,
  type,
  placeName,
  distanceMeters,
}: {
  personName: string;
  type: "sos" | "nearby-risk";
  placeName?: string;
  distanceMeters?: number;
}): void {
  playCaregiverAlert();
  navigator.vibrate?.(type === "sos" ? [250, 120, 250, 120, 400] : [180, 100, 180]);

  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const title =
    type === "sos"
      ? `${personName} needs support now`
      : `${personName} is near a risky location`;
  const body =
    type === "sos"
      ? "Open Thunai for immediate caregiver guidance."
      : `Near ${placeName ?? "a wine shop"}${distanceMeters ? ` · ${distanceMeters}m away` : ""}. Reach out gently.`;
  const notification = new Notification(title, {
    body,
    tag: `thunai-${personName}-${type}`,
    requireInteraction: type === "sos",
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
