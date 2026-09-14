import type { Beat } from "./types";

// The default beat framework. Names are pre-filled, text is blank.
export const BEAT_NAMES = [
  "Mission",
  "The physical thing",
  "Doubt on camera",
  "Deep work",
  "Metric drop",
  "Stranger",
  "Character",
  "Handout",
  "Money / mentor",
  "Small win",
  "Setback",
  "Cliffhanger and ask",
];

export const BEAT_HINTS: Record<string, string> = {
  Mission: "stakes and the number, first 30 seconds",
  "The physical thing": "stunt, prop, location",
  "Doubt on camera": "someone questions it",
  "Deep work": "proof of work, short",
  "Metric drop": "a number said in passing",
  Stranger: "real person, real reaction",
  Character: "someone with personality shows up",
  Handout: "product in hands",
  "Money / mentor": "investor or mentor asks real questions",
  "Small win": "merch, milestone",
  Setback: "something goes wrong, stakes",
  "Cliffhanger and ask": "",
};

export function defaultBeats(): Beat[] {
  return BEAT_NAMES.map((name) => ({
    name,
    timestamp: "",
    what_happens: "",
    why_it_works: "",
  }));
}

export function blankBeat(): Beat {
  return { name: "", timestamp: "", what_happens: "", why_it_works: "" };
}

export function parseBeats(raw: unknown): Beat[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return defaultBeats();
    }
  }
  if (!Array.isArray(value)) return defaultBeats();
  return value.map((b) => {
    const o = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
    return {
      name: typeof o.name === "string" ? o.name : "",
      timestamp: typeof o.timestamp === "string" ? o.timestamp : "",
      what_happens: typeof o.what_happens === "string" ? o.what_happens : "",
      why_it_works: typeof o.why_it_works === "string" ? o.why_it_works : "",
    };
  });
}
