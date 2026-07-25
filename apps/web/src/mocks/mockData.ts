import {
  UserProfile,
  CaregiverProfile,
  TimelineEvent,
  RiskWindow,
  LinkedUserStatus,
  AiMeta,
} from "@contracts/types";

export const SEED_RAVI_PROFILE: UserProfile = {
  userId: "user-ravi-001",
  name: "Ravi",
  persona: "individual",
  substance: "alcohol",
  daysSober: 90,
  stage: "established",
  trigger: "Work stress & late Friday evenings",
  motivation: "Ananya's school fees & family happiness",
  language: "ta",
  dailyCostInr: 525,
  createdAt: "2026-04-26T10:00:00.000Z",
};

export const SEED_MEERA_PROFILE: UserProfile = {
  userId: "user-meera-002",
  name: "Meera",
  persona: "individual",
  substance: "opioids",
  daysSober: 14,
  stage: "early",
  trigger: "Loneliness and late night silence",
  motivation: "Rebuilding career and independence",
  language: "en",
  dailyCostInr: 800,
  createdAt: "2026-07-11T10:00:00.000Z",
};

export const SEED_CAREGIVER_PROFILE: CaregiverProfile = {
  caregiverId: "cg-priya-101",
  name: "Priya (Sponsor / Caregiver)",
  persona: "caregiver",
  language: "ta",
  createdAt: "2026-04-20T10:00:00.000Z",
};

export const MOCK_RISK_WINDOWS_RAVI: RiskWindow[] = [
  {
    dayOfWeek: 5, // Friday
    startHour: 18,
    endHour: 23,
    riskLevel: "high",
    label: "Friday evening (Post-work stress window)",
    confidence: 0.88,
  },
  {
    dayOfWeek: 6, // Saturday
    startHour: 20,
    endHour: 24,
    riskLevel: "moderate",
    label: "Saturday late night social hours",
    confidence: 0.72,
  },
];

export const MOCK_TIMELINE_RAVI: TimelineEvent[] = [
  {
    id: "evt-005",
    type: "checkin",
    at: "2026-07-25T09:00:00.000Z",
    title: "Morning Voice Check-in",
    detail: "Felt steady after morning walk. Ananya smiled before leaving for school.",
    mood: "calm",
    riskLevel: "low",
  },
  {
    id: "evt-004",
    type: "milestone",
    at: "2026-07-24T18:00:00.000Z",
    title: "90 Days Sober Milestone",
    detail: "Reached 90 days continuous recovery! ₹47,250 saved toward school fees.",
    riskLevel: "low",
  },
  {
    id: "evt-003",
    type: "prediction",
    at: "2026-07-24T17:30:00.000Z",
    title: "Predictive Friday Evening Nudge",
    detail: "Pre-crisis reminder sent before high-risk window.",
    riskLevel: "moderate",
  },
  {
    id: "evt-002",
    type: "checkin",
    at: "2026-07-23T20:15:00.000Z",
    title: "Evening Reflection",
    detail: "Felt a slight urge after office meeting, practiced 4-7-8 breathing.",
    mood: "neutral",
    riskLevel: "low",
  },
  {
    id: "evt-001",
    type: "sos",
    at: "2026-07-18T21:10:00.000Z",
    title: "SOS Panic Mode Activated",
    detail: "Tamil emergency speech script delivered. Caregiver Priya alerted.",
    riskLevel: "high",
  },
];

export const MOCK_LINKED_USERS: LinkedUserStatus[] = [
  {
    userId: "user-ravi-001",
    name: "Ravi",
    daysSober: 90,
    latestRiskLevel: "low",
    inRiskWindowNow: false,
    latestEvents: MOCK_TIMELINE_RAVI.slice(0, 3),
  },
];

export const MOCK_CEREBRAS_META: AiMeta = {
  provider: "cerebras",
  modelId: "gpt-oss-120b",
  latencyMs: 94,
  contextFields: ["name", "substance", "daysSober", "trigger", "motivation", "language"],
  isOfflineFallback: false,
};

export const MOCK_OFFLINE_META: AiMeta = {
  provider: "offline",
  modelId: "safety-fallback-script-v1",
  latencyMs: 4,
  contextFields: ["language", "emergency_type"],
  isOfflineFallback: true,
};

export const TAMIL_SOS_SCRIPT =
  "ரவி, சற்று மெதுவாக மூச்சை உள்ளிழுங்கள். இந்த ஆவல் தற்காலிகமானது. அனன்யாவின் சிரிப்பையும் அவளுடைய எதிர்காலத்தையும் நினைவில் வையுங்கள். நீங்கள் 90 நாட்கள் உறுதியாக நடந்துவந்துள்ளீர்கள். இப்போது 10 முறை ஆழமாக மூச்சை உள்ளிழுத்து மெதுவாக வெளிவிடுங்கள்.";

export const ENGLISH_SOS_SCRIPT =
  "Ravi, take a deep slow breath right now. This wave of craving will pass in a few minutes. Think of your daughter Ananya and the 90 strong days you have lived. You are in control. Take 5 deep breaths with me right now.";

export const CAREGIVER_COACHING_SCRIPT =
  "Ravi is experiencing a high-craving moment. SAY THIS: 'Ravi, I am right here with you. Take a slow breath. We are so proud of your 90 days for Ananya.' DO NOT SAY: 'Why are you feeling like this again?' or 'Did you take something?' Offer a glass of cold water and sit quietly beside him.";

export const TAMIL_SLIP_SCRIPT =
  "ரவி, பரவாயில்லை. இது உங்களின் தோல்வி அல்ல. நீங்கள் வாழ்ந்த 90 நாட்கள் மீட்பு பயணம் இன்னும் உங்களுடனே உள்ளது. இன்று புதிய தொடக்கம். உங்கள் குடும்பத்தின் அன்பு என்றும் மாறாது. இப்போது உங்கள் ஆதரவாளர் பிரியாவுக்கு ஒரு செய்தி அனுப்புங்கள்.";

export const ENGLISH_SLIP_SCRIPT =
  "Ravi, please pause and be gentle with yourself. A slip does not erase the 90 brave days you have built for Ananya. Growth is continuous, not a perfection test. Today counts. Reach out to your support circle now—we are walking with you.";
