/**
 * A deterministic sixty days of plausible history.
 *
 * One generator, three uses: the engine tests run against it, the design
 * preview renders from it, and `npm run seed:demo` writes it into a real demo
 * account so the founder can film Patterns and Report without touching
 * anyone's actual data.
 */

import { shiftDay, type Day } from "./day";
import type { DayRecord, Intervention, Profile, Severity } from "./types";
import type { SymptomKey } from "./symptoms";

export const DEMO_SYMPTOMS: SymptomKey[] = [
  "sleep",
  "anxiety",
  "brain_fog",
  "hot_flashes",
  "like_myself",
];

/** she started magnesium this many days before the end of the window */
export const DEMO_INTERVENTION_DAYS_AGO = 24;
export const DEMO_HISTORY_DAYS = 60;

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

type Shape = { base: number; luteal: number; relief: number; noise: number };

const SHAPES: Record<string, Shape> = {
  sleep:        { base: 2.05, luteal: 0.5,  relief: 0.95, noise: 0.6 },
  anxiety:      { base: 1.15, luteal: 1.5,  relief: 0.3,  noise: 0.5 },
  brain_fog:    { base: 2.1,  luteal: 0.35, relief: 0.85, noise: 0.5 },
  hot_flashes:  { base: 1.8,  luteal: 0.45, relief: 0.1,  noise: 0.6 },
  night_sweats: { base: 1.5,  luteal: 0.4,  relief: 0.2,  noise: 0.7 },
  fatigue:      { base: 1.7,  luteal: 0.5,  relief: 0.45, noise: 0.55 },
  irritability: { base: 1.2,  luteal: 1.2,  relief: 0.25, noise: 0.6 },
  joint_aches:  { base: 1.5,  luteal: 0.25, relief: 0.3,  noise: 0.5 },
  cravings:     { base: 1.3,  luteal: 1.0,  relief: 0.15, noise: 0.6 },
  low_mood:     { base: 1.2,  luteal: 1.1,  relief: 0.3,  noise: 0.6 },
  // positive: read in reverse — higher is better
  like_myself:  { base: 1.3,  luteal: -0.9, relief: -0.7, noise: 0.55 },
};

/** days-ago values on which a period started, inside the window */
export const DEMO_PERIOD_STARTS = [19, 52];

const NOTES: [number, string][] = [
  [2, "Slept through. First time in weeks."],
  [7, "Walked at lunch instead of eating at my desk."],
  [12, "Rough meeting. Held it together, barely."],
  [17, "Cut the second coffee."],
  [24, "Started magnesium tonight."],
  [33, "Woke at 3.40, read until five."],
  [46, "Better week than I expected."],
];

const GOOD: [number, string[]][] = [
  [1, ["slept_through", "calm_day"]],
  [2, ["slept_through"]],
  [4, ["good_energy"]],
  [5, ["felt_like_me", "calm_day"]],
  [8, ["good_energy"]],
  [11, ["felt_like_me"]],
  [15, ["calm_day"]],
  [21, ["good_energy"]],
];

function lutealPull(daysAgo: number): number {
  for (const start of DEMO_PERIOD_STARTS) {
    const gap = daysAgo - start;
    if (gap >= 1 && gap <= 4) return 1 - (gap - 1) / 6;
  }
  return 0;
}

export function demoDays(
  endDay: Day,
  symptoms: SymptomKey[] = DEMO_SYMPTOMS,
  historyDays = DEMO_HISTORY_DAYS
): DayRecord[] {
  const notes = new Map(NOTES);
  const goods = new Map(GOOD);
  const out: DayRecord[] = [];

  for (let daysAgo = historyDays; daysAgo >= 1; daysAgo--) {
    const day = shiftDay(endDay, -daysAgo);
    const severities: Partial<Record<SymptomKey, Severity>> = {};

    for (const key of symptoms) {
      const shape = SHAPES[key] ?? SHAPES.fatigue;
      const r = rng(hash(`${key}:${day}`));
      const relief = daysAgo < DEMO_INTERVENTION_DAYS_AGO ? shape.relief : 0;
      const drift = ((historyDays - daysAgo) / historyDays) * 0.2;
      let v =
        shape.base +
        shape.luteal * lutealPull(daysAgo) -
        relief -
        drift +
        (r() - 0.5) * 2 * shape.noise;

      // her sleep has genuinely settled this past week
      if (key === "sleep" && daysAgo <= 6) v = Math.min(v, 1.2);
      if (key === "like_myself" && daysAgo <= 6) v = Math.max(v, 2.1);

      severities[key] = Math.max(0, Math.min(3, Math.round(v))) as Severity;
    }

    out.push({
      day,
      severities,
      note: notes.get(daysAgo) ?? null,
      goodThings: goods.get(daysAgo) ?? [],
      periodStarted: DEMO_PERIOD_STARTS.includes(daysAgo),
    });
  }

  return out;
}

export function demoInterventions(endDay: Day): Intervention[] {
  return [
    {
      id: "demo-magnesium",
      name: "Magnesium",
      started_on: shiftDay(endDay, -DEMO_INTERVENTION_DAYS_AGO),
      ended_on: null,
    },
    {
      id: "demo-walking",
      name: "Walking at lunch",
      started_on: shiftDay(endDay, -41),
      ended_on: null,
    },
  ];
}

export function demoProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "demo-user",
    first_name: "Ada",
    stage: "irregular",
    symptoms: DEMO_SYMPTOMS,
    timezone: "Europe/London",
    nudge_enabled: false,
    nudge_hour: null,
    last_nudged_on: null,
    onboarded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
