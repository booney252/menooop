import { addDays, key, today } from "./dates";
import type { Hrt, Stage, SymptomId } from "./data";

export type Entry = {
  date: string;
  severities: Partial<Record<SymptomId, number>>;
  note?: string;
};

export type Profile = {
  onboarded: boolean;
  stage: Stage;
  symptoms: SymptomId[];
  hrt: Hrt;
  supplements: string[];
  /** days since the most recent period started; null when stage is "stopped" */
  cycleDay: number | null;
};

export const HISTORY_DAYS = 60;
/** she started magnesium this many days ago — drives the brain fog story */
export const SUPPLEMENT_START = 24;

export const DEFAULT_PROFILE: Profile = {
  onboarded: false,
  stage: "irregular",
  symptoms: ["sleep", "anxiety", "fog", "flushes", "fatigue"],
  hrt: "considering",
  supplements: ["Magnesium glycinate", "Vitamin D"],
  cycleDay: 20,
};

/** deterministic — the demo must look identical on every render and every device */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Shape = {
  base: number;
  luteal: number;
  /** how much magnesium/time helps: subtracted after SUPPLEMENT_START */
  relief: number;
  noise: number;
};

const SHAPES: Record<SymptomId, Shape> = {
  sleep: { base: 1.95, luteal: 0.5, relief: 0.75, noise: 0.75 },
  anxiety: { base: 1.15, luteal: 1.35, relief: 0.3, noise: 0.6 },
  fog: { base: 2.15, luteal: 0.35, relief: 1.0, noise: 0.5 },
  flushes: { base: 1.75, luteal: 0.45, relief: 0.1, noise: 0.7 },
  fatigue: { base: 1.7, luteal: 0.5, relief: 0.45, noise: 0.6 },
  mood: { base: 1.2, luteal: 1.2, relief: 0.25, noise: 0.65 },
  sweats: { base: 1.5, luteal: 0.4, relief: 0.2, noise: 0.8 },
  joints: { base: 1.5, luteal: 0.25, relief: 0.3, noise: 0.5 },
  headache: { base: 0.95, luteal: 0.9, relief: 0.25, noise: 0.7 },
  weight: { base: 1.6, luteal: 0.2, relief: 0.1, noise: 0.35 },
  heart: { base: 0.7, luteal: 0.6, relief: 0.2, noise: 0.7 },
  libido: { base: 1.6, luteal: 0.3, relief: 0.15, noise: 0.4 },
  dryness: { base: 1.4, luteal: 0.15, relief: 0.15, noise: 0.45 },
  periods: { base: 1.1, luteal: 0.8, relief: 0.05, noise: 0.6 },
  skin: { base: 1.1, luteal: 0.35, relief: 0.3, noise: 0.6 },
};

/**
 * Period starts inside the window, counted in days-ago. Irregular by design:
 * 33 then 29 days apart, so the luteal clustering is real but not metronomic.
 */
export function periodStarts(profile: Profile): number[] {
  if (profile.stage === "stopped" || profile.cycleDay == null) return [];
  const first = profile.cycleDay - 1;
  return [first, first + 33, first + 29 + 33].filter((d) => d < HISTORY_DAYS);
}

function lutealPull(daysAgo: number, starts: number[]): number {
  // the five days before a period start
  for (const s of starts) {
    const gap = daysAgo - s;
    if (gap >= 1 && gap <= 5) return 1 - (gap - 1) / 7;
  }
  return 0;
}

const NOTES: [number, string][] = [
  [2, "Slept through. First time in weeks."],
  [6, "Walked at lunch instead of eating at my desk."],
  [11, "Rough meeting. Held it together, barely."],
  [16, "Cut the second coffee."],
  [23, "Started magnesium tonight."],
  [31, "Woke at 3.40, read until five."],
  [44, "Better week than I expected."],
];

export function buildHistory(profile: Profile): Record<string, Entry> {
  const anchor = today();
  const starts = periodStarts(profile);
  const out: Record<string, Entry> = {};
  const noteBy = new Map(NOTES);

  for (let daysAgo = HISTORY_DAYS; daysAgo >= 1; daysAgo--) {
    const date = addDays(anchor, -daysAgo);
    const k = key(date);
    const severities: Partial<Record<SymptomId, number>> = {};

    for (const id of profile.symptoms) {
      const shape = SHAPES[id] ?? SHAPES.fatigue;
      const r = rng(hash(`${id}:${k}`));
      const relief = daysAgo < SUPPLEMENT_START ? shape.relief : 0;
      // a slow, gentle drift downward across the whole window
      const drift = ((HISTORY_DAYS - daysAgo) / HISTORY_DAYS) * 0.25;
      let v =
        shape.base +
        shape.luteal * lutealPull(daysAgo, starts) -
        relief -
        drift +
        (r() - 0.5) * 2 * shape.noise;

      // her sleep has genuinely settled this past week — the app should notice
      if (id === "sleep" && daysAgo <= 6) v = Math.min(v, 1.3);

      severities[id] = Math.max(0, Math.min(3, Math.round(v)));
    }

    out[k] = { date: k, severities, note: noteBy.get(daysAgo) };
  }

  return out;
}
