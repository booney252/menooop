import { PROGRAMS, type ProgramContent, type ProgramId } from "@/content/programs";
import { TUNING } from "@/lib/insights/constants";
import { SYMPTOM_BY_KEY, type SymptomKey } from "@/lib/symptoms";
import { daysBetween, type Day } from "@/lib/day";
import type { DayRecord, Enrollment, ProgramRecommendation } from "@/lib/types";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];
const word = (n: number) => WORDS[n] ?? String(n);

export type Recommendation = {
  program: ProgramContent;
  /** the symptom that pointed here */
  because: SymptomKey;
  share: number;
  lines: [string, string, string];
};

/** the share of her logged days a symptom was noticeable or worse */
export function moderatePlusShare(days: DayRecord[], key: SymptomKey): number {
  let logged = 0;
  let felt = 0;
  for (const d of days) {
    const v = d.severities[key];
    if (typeof v !== "number") continue;
    logged++;
    // the positive symptom reads the other way round: its absence is the burden
    const heavy = SYMPTOM_BY_KEY[key].kind === "positive" ? v <= 1 : v >= 2;
    if (heavy) felt++;
  }
  return logged ? felt / logged : 0;
}

/**
 * Which track her own record points at.
 *
 * A recommendation, never a gate — she can browse and enroll in any of them.
 * Returns null when there is too little to go on, which is most of the time
 * in the first fortnight, and that is the correct answer.
 */
export function matchProgram(
  days: DayRecord[],
  tracked: SymptomKey[]
): Recommendation | null {
  if (days.length < TUNING.program.minDaysToRecommend) return null;

  const scored = PROGRAMS.map((program) => {
    const mine = program.targetSymptoms.filter((k) => tracked.includes(k));
    let best: { key: SymptomKey; share: number } | null = null;
    for (const key of mine) {
      const share = moderatePlusShare(days, key);
      if (!best || share > best.share) best = { key, share };
    }
    return { program, best };
  }).filter((x): x is { program: ProgramContent; best: { key: SymptomKey; share: number } } =>
    x.best !== null
  );

  if (!scored.length) return null;
  scored.sort((a, b) => b.best.share - a.best.share);

  const top = scored[0];
  if (top.best.share < TUNING.program.minShareModeratePlus) return null;

  // Several symptoms running level is exactly what Steady is for, so a tie at
  // the top goes there rather than to whichever sorted first.
  const runnerUp = scored[1];
  const tied = runnerUp && top.best.share - runnerUp.best.share <= TUNING.program.tieWithin;
  const steady = scored.find((s) => s.program.id === "steady");
  const chosen = tied && steady ? steady : top;

  const phrase = SYMPTOM_BY_KEY[chosen.best.key].phrase;
  return {
    program: chosen.program,
    because: chosen.best.key,
    share: chosen.best.share,
    lines: [
      `Your last month points at your ${phrase}.`,
      `There’s a ${word(chosen.program.weeks)}-week program built for exactly this pattern.`,
      `About ${chosen.program.minutesPerSession} minutes a day.`,
    ],
  };
}

/**
 * Whether a match is worth putting in front of her today: not while a program
 * is running, not one she has already finished, and not one she waved away
 * inside the quiet window.
 */
export function shouldOffer(
  recommendation: Recommendation | null,
  enrollments: Enrollment[],
  recommendations: ProgramRecommendation[],
  today: Day
): Recommendation | null {
  if (!recommendation) return null;
  if (enrollments.some((e) => e.status === "active" || e.status === "paused")) return null;

  const id = recommendation.program.id as ProgramId;
  if (enrollments.some((e) => e.program_id === id && e.status === "completed")) return null;

  const dismissed = recommendations
    .filter((r) => r.program_id === id && r.dismissed_at)
    .sort((a, b) => (a.shown_on < b.shown_on ? 1 : -1))[0];

  if (dismissed && daysBetween(dismissed.shown_on, today) < TUNING.program.quietDaysAfterDismiss) {
    return null;
  }
  return recommendation;
}
