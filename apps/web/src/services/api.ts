import {
  SosRequest,
  SosResponse,
  CaregiverScriptRequest,
  CaregiverScriptResponse,
  CheckinRequest,
  CheckinResponse,
  SlipRequest,
  SlipResponse,
  TimelineResponse,
  InsightsResponse,
  PredictionResponse,
  LinkRequest,
  LinkResponse,
  CaregiverDashboardResponse,
  ScenarioLoadRequest,
  ScenarioLoadResponse,
  UserProfile,
  CaregiverProfile,
} from "@contracts/types";

import {
  SEED_RAVI_PROFILE,
  SEED_MEERA_PROFILE,
  SEED_CAREGIVER_PROFILE,
  MOCK_TIMELINE_RAVI,
  MOCK_RISK_WINDOWS_RAVI,
  MOCK_LINKED_USERS,
  MOCK_CEREBRAS_META,
  MOCK_OFFLINE_META,
  TAMIL_SOS_SCRIPT,
  ENGLISH_SOS_SCRIPT,
  CAREGIVER_COACHING_SCRIPT,
  TAMIL_SLIP_SCRIPT,
  ENGLISH_SLIP_SCRIPT,
} from "../mocks/mockData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === "true";

// Local state for interactive mock session
let activeUser: UserProfile = { ...SEED_RAVI_PROFILE };
let activeCaregiver: CaregiverProfile = { ...SEED_CAREGIVER_PROFILE };
let activeTimeline = [...MOCK_TIMELINE_RAVI];
let activeLinkedUsers = [...MOCK_LINKED_USERS];

export const getActiveUser = (): UserProfile => activeUser;

export const setActiveUserPersona = (persona: "ravi" | "meera") => {
  if (persona === "meera") {
    activeUser = { ...SEED_MEERA_PROFILE };
  } else {
    activeUser = { ...SEED_RAVI_PROFILE };
  }
};

/** POST /api/scripts/sos */
export async function postSosScript(req: SosRequest): Promise<SosResponse> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/scripts/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("Live API failed, using contract offline fallback", err);
      return {
        script: activeUser.language === "ta" ? TAMIL_SOS_SCRIPT : ENGLISH_SOS_SCRIPT,
        language: activeUser.language,
        meta: MOCK_OFFLINE_META,
        sosEventId: `sos-evt-${Date.now()}`,
      };
    }
  }

  // Contract-compliant mock
  await new Promise((r) => setTimeout(r, 120));
  const newEventId = `sos-evt-${Date.now()}`;

  // Add to local timeline
  activeTimeline.unshift({
    id: newEventId,
    type: "sos",
    at: new Date().toISOString(),
    title: "SOS Panic Mode Activated",
    detail: "Emergency voice script delivered to user.",
    riskLevel: "high",
  });

  // Flag caregiver alert
  activeLinkedUsers = activeLinkedUsers.map((u) =>
    u.userId === activeUser.userId
      ? { ...u, latestRiskLevel: "critical", inRiskWindowNow: true }
      : u
  );

  return {
    script: activeUser.language === "ta" ? TAMIL_SOS_SCRIPT : ENGLISH_SOS_SCRIPT,
    language: activeUser.language,
    meta: {
      ...MOCK_CEREBRAS_META,
      latencyMs: Math.floor(80 + Math.random() * 40),
    },
    sosEventId: newEventId,
  };
}

/** POST /api/scripts/caregiver */
export async function postCaregiverScript(
  req: CaregiverScriptRequest
): Promise<CaregiverScriptResponse> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/scripts/caregiver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("Live API failed, returning contract fallback", err);
      return {
        script: CAREGIVER_COACHING_SCRIPT,
        language: activeCaregiver.language,
        meta: MOCK_OFFLINE_META,
      };
    }
  }

  await new Promise((r) => setTimeout(r, 100));
  return {
    script: CAREGIVER_COACHING_SCRIPT,
    language: activeCaregiver.language,
    meta: {
      ...MOCK_CEREBRAS_META,
      latencyMs: 92,
    },
  };
}

/** POST /api/checkins */
export async function postCheckin(req: CheckinRequest): Promise<CheckinResponse> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("Live checkin API failed, using offline fallback", err);
      return {
        id: `chk-evt-${Date.now()}`,
        mood: "distressed",
        riskLevel: "high",
        aiReflection:
          "Offline safety script (pre-written): Thank you for checking in. Take a deep breath right now.",
        escalation: {
          flagged: true,
          severity: "acute",
          helplineName: "Tele-MANAS",
          helplineNumber: "14416",
          matchedCategory: "crisis-support",
          message: "Tele-MANAS is available 24/7 free toll-free support.",
        },
        meta: MOCK_OFFLINE_META,
      };
    }
  }

  await new Promise((r) => setTimeout(r, 150));
  const text = req.transcript.toLowerCase();
  const isCrisis =
    text.includes("help") ||
    text.includes("relapse") ||
    text.includes("hurt") ||
    text.includes("die") ||
    text.includes("give up") ||
    text.includes("urgent");

  const newId = `chk-evt-${Date.now()}`;
  const mood = isCrisis ? "distressed" : text.includes("good") || text.includes("great") ? "positive" : "calm";
  const riskLevel = isCrisis ? "critical" : "low";

  let aiReflection = `Thank you for sharing your heart, ${activeUser.name}. Showing up today is a huge victory for ${activeUser.motivation}. Take one slow breath and drink a warm glass of water.`;
  if (activeUser.language === "ta") {
    aiReflection = `பகிர்ந்தமைக்கு நன்றி ${activeUser.name}. இன்றைக்கு நீங்கள் வந்து குரல் கொடுத்ததே பெரிய வெற்றி. ${activeUser.motivation} நினைவில் வைத்துக்கொண்டு ஒரு மெதுவான மூச்சை உள்ளிழுக்கவும்.`;
  }

  // Update local timeline & state
  activeTimeline.unshift({
    id: newId,
    type: "checkin",
    at: new Date().toISOString(),
    title: "Voice Check-in Recorded",
    detail: `"${req.transcript}"`,
    mood,
    riskLevel,
  });

  return {
    id: newId,
    mood,
    riskLevel,
    aiReflection,
    escalation: isCrisis
      ? {
          flagged: true,
          severity: "acute",
          helplineName: "Tele-MANAS",
          helplineNumber: "14416",
          matchedCategory: "crisis-support",
          message:
            "Tele-MANAS 24/7 National Mental Health Helpline (14416) is available instantly for confidential human care.",
        }
      : undefined,
    meta: {
      ...MOCK_CEREBRAS_META,
      latencyMs: 110,
    },
  };
}

/** POST /api/scripts/slip */
export async function postSlipScript(req: SlipRequest): Promise<SlipResponse> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/scripts/slip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn("Live slip API failed, returning contract fallback", err);
      return {
        script: activeUser.language === "ta" ? TAMIL_SLIP_SCRIPT : ENGLISH_SLIP_SCRIPT,
        whatsappDraft: `Hi Priya, I had a tough moment today. I am reaching out to stay safe. Can we talk for a minute?`,
        language: activeUser.language,
        meta: MOCK_OFFLINE_META,
        slipEventId: `slip-evt-${Date.now()}`,
      };
    }
  }

  await new Promise((r) => setTimeout(r, 110));
  const newSlipId = `slip-evt-${Date.now()}`;

  activeTimeline.unshift({
    id: newSlipId,
    type: "slip",
    at: new Date().toISOString(),
    title: "Slip Logged — Re-anchored",
    detail: "User reached out for support. Living garden preserved.",
    riskLevel: "moderate",
  });

  const draft =
    activeUser.language === "ta"
      ? `பிரியா, இன்று எனக்கு ஒரு சவாலான தருணம் ஏற்பட்டது. நான் உங்களுடன் பேச விரும்புகிறேன்.`
      : `Hi Priya, I had a tough moment today. I am reaching out because I want to stay safe for Ananya. Can we talk for 5 minutes?`;

  return {
    script: activeUser.language === "ta" ? TAMIL_SLIP_SCRIPT : ENGLISH_SLIP_SCRIPT,
    whatsappDraft: draft,
    language: activeUser.language,
    meta: {
      ...MOCK_CEREBRAS_META,
      latencyMs: 98,
    },
    slipEventId: newSlipId,
  };
}

/** GET /api/timeline/:userId */
export async function getTimeline(userId: string): Promise<TimelineResponse> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/timeline/${userId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Timeline live fetch failed", e);
    }
  }
  return { userId, events: activeTimeline };
}

/** GET /api/insights/:userId */
export async function getInsights(userId: string): Promise<InsightsResponse> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/insights/${userId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Insights live fetch failed", e);
    }
  }

  return {
    userId,
    weeklySummary:
      activeUser.language === "ta"
        ? "கடந்த 3 வாரங்களில் வெள்ளி மாலை நேரங்களில் உங்களுக்கு சவால்கள் அதிகம் தோன்றுவது கண்டறியப்பட்டுள்ளது. இந்த நேரங்களில் முன் தயாரிப்புடன் இருப்பது உங்களை பாதுகாக்கும்."
        : "Your patterns show a primary vulnerability during Friday post-work hours (6 PM - 11 PM). Planning relaxing activities with family during this window significantly lowers craving density.",
    riskWindows: MOCK_RISK_WINDOWS_RAVI,
    meta: { ...MOCK_CEREBRAS_META, latencyMs: 104 },
  };
}

/** GET /api/predictions/:userId */
export async function getPredictions(userId: string): Promise<PredictionResponse> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/predictions/${userId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Predictions live fetch failed", e);
    }
  }

  // Simulated prediction check: Active during high-risk window simulation
  const nowHour = new Date().getHours();
  const isFriday = new Date().getDay() === 5;
  const isHighRiskWindow = isFriday || nowHour >= 18;

  if (isHighRiskWindow) {
    return {
      userId,
      active: true,
      window: MOCK_RISK_WINDOWS_RAVI[0],
      nudge:
        activeUser.language === "ta"
          ? "வெள்ளி மாலை வேளை துவங்கியுள்ளது. அனன்யாவுடன் 10 நிமிடங்கள் விளையாட திட்டமிடுங்கள்!"
          : "You are entering a high-risk Friday evening window. Take 5 minutes to play with Ananya or call Priya.",
      meta: { ...MOCK_CEREBRAS_META, latencyMs: 82 },
    };
  }

  return { userId, active: false };
}

/** POST /api/link */
export async function postConsentLink(req: LinkRequest): Promise<LinkResponse> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Consent link live fetch failed", e);
    }
  }

  return {
    linkId: `link-${Date.now()}`,
    caregiverId: req.caregiverId,
    userId: req.userId,
    consent: true,
    linkedAt: new Date().toISOString(),
  };
}

/** GET /api/caregiver/dashboard/:caregiverId */
export async function getCaregiverDashboard(
  caregiverId: string
): Promise<CaregiverDashboardResponse> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/caregiver/dashboard/${caregiverId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Caregiver dashboard live fetch failed", e);
    }
  }

  return {
    caregiverId,
    linkedUsers: activeLinkedUsers,
  };
}

/** POST /api/scenario/load (INPUT-ONLY Seeding) */
export async function postScenarioLoad(
  req: ScenarioLoadRequest = {}
): Promise<ScenarioLoadResponse> {
  if (req.reset !== false) {
    activeUser = { ...SEED_RAVI_PROFILE };
    activeCaregiver = { ...SEED_CAREGIVER_PROFILE };
    activeTimeline = [...MOCK_TIMELINE_RAVI];
    activeLinkedUsers = [...MOCK_LINKED_USERS];
  }

  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/scenario/load`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Scenario load live fetch failed", e);
    }
  }

  return {
    seeded: {
      users: ["user-ravi-001", "user-meera-002"],
      caregivers: ["cg-priya-101"],
      checkins: 14,
      timelineEvents: activeTimeline.length,
      links: 1,
    },
  };
}
