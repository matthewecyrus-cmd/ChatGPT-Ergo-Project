export const FLAGS = [
  {
    id: "neck",
    label: "Neck flexion / looking down",
    region: "Neck",
    risk: "moderate",
    detail: "Sustained looking down or forward-head posture may be present during the task.",
    recommendation: "Review part height, visual target position, lighting, and whether the work can be brought closer to neutral eye level."
  },
  {
    id: "shoulder",
    label: "Extended reach / shoulder loading",
    region: "Shoulder",
    risk: "moderate",
    detail: "The task may require reaching away from the body or holding the arms away from neutral.",
    recommendation: "Move high-use items into the normal reach zone, reduce reach distance, or review fixture/tool placement."
  },
  {
    id: "back",
    label: "Trunk bending or twisting",
    region: "Back",
    risk: "moderate",
    detail: "The task may involve bending, rotation, or an unsupported trunk posture.",
    recommendation: "Review work height, lift path, staging location, turn-step positioning, or mechanical assist options."
  },
  {
    id: "hand",
    label: "Grip force / hand strain potential",
    region: "Wrist / Hand",
    risk: "moderate",
    detail: "The task may involve gripping, pinching, trigger use, vibration, or force through the hand/wrist.",
    recommendation: "Review handle size, glove fit, tool condition, wrist angle, contact stress, and whether force can be reduced."
  },
  {
    id: "knee",
    label: "Lower-body awkward posture",
    region: "Knee",
    risk: "moderate",
    detail: "The task may involve kneeling, deep squatting, uneven stance, or repeated low access.",
    recommendation: "Review access height, platform/step use, kneeling alternatives, and whether the part can be staged differently."
  }
];

export const BODY_REGIONS = [
  { id: "neck", label: "Neck", cue: "Forward head, sustained looking down, rotation" },
  { id: "shoulder", label: "Shoulders", cue: "Elevated arms, reaching, overhead posture" },
  { id: "back", label: "Back", cue: "Bending, twisting, unsupported trunk angle" },
  { id: "hand", label: "Wrist / Hand", cue: "Grip force, deviation, pinch, repetition" },
  { id: "knee", label: "Knees", cue: "Squatting, kneeling, awkward lower-body posture" }
];

export const QUESTIONS = [
  {
    id: "force",
    title: "Force or effort",
    prompt: "Did the task appear to require noticeable force, hard gripping, pulling, pushing, lifting, or tool pressure?",
    options: ["No obvious force", "Some force", "High force", "I don't know / not observed"]
  },
  {
    id: "repetition",
    title: "Repetition",
    prompt: "Did the person repeat the same motion or posture several times during the task?",
    options: ["Not repetitive", "Some repetition", "Highly repetitive", "I don't know / not observed"]
  },
  {
    id: "duration",
    title: "Duration",
    prompt: "How long does this task usually happen during a normal shift?",
    options: ["Less than 30 minutes total", "30 minutes to 2 hours", "More than 2 hours", "I don't know / not observed"]
  }
];

export const initialContext = QUESTIONS.reduce((acc, question) => {
  acc[question.id] = "";
  return acc;
}, {});

export function riskFromContext(flags, context) {
  let score = flags.length;
  if (context.force === "High force") score += 2;
  if (context.force === "Some force") score += 1;
  if (context.repetition === "Highly repetitive") score += 2;
  if (context.repetition === "Some repetition") score += 1;
  if (context.duration === "More than 2 hours") score += 2;
  if (context.duration === "30 minutes to 2 hours") score += 1;
  if (score >= 5) return "High";
  if (score >= 2) return "Moderate";
  return "Low";
}

export function buildReport({ setup, videoState, risk, selectedFlags, context }) {
  const findings = selectedFlags.length
    ? selectedFlags
    : [{ label: "No posture flags selected", detail: "No specific risk flags have been selected yet.", recommendation: "Review the video and mark any visible awkward posture, force, repetition, or reach concern." }];

  return [
    `Assessment: ${setup.title}`,
    `Area: ${setup.area}`,
    `Observer: ${setup.observer}`,
    `Video: ${videoState.fileName || "No video selected"}`,
    `Video source: ${videoState.source || "none"}`,
    `Overall Risk: ${risk}`,
    "",
    "Findings:",
    ...findings.map((flag, index) => `${index + 1}. ${flag.label} — ${flag.detail} Recommended next step: ${flag.recommendation}`),
    "",
    "Guided Context:",
    ...QUESTIONS.map((question) => `- ${question.title}: ${context[question.id] || "Not answered"}`),
    "",
    "Limitations: This is a screening-level assessment workflow. Findings should be confirmed by a qualified reviewer before formal corrective action."
  ].join("\n");
}
