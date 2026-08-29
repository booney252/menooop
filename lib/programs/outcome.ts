import { PROGRAM_BY_ID, type ProgramId } from "@/content/programs";
import { TUNING } from "@/lib/insights/constants";
import { SYMPTOM_BY_KEY, verb, type SymptomKey } from "@/lib/symptoms";
import { daysBetween, shiftDay, type Day } from "@/lib/day";
import type { DayRecord, Enrollment, OutcomeVerdict } from "@/lib/types";

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];
const word = (n: number) => WORDS[n] ?? String(n);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

export type OutcomeResult = {
  symptom: SymptomKey;
  baseline: number | null;
  endpoint: number | null;
  delta: number | null;
  baselineDays: number;
  endpointDays: number;
  verdict: OutcomeVerdict;
  sentence: string;
  /** the two curves, for the chart, oldest first */
  before: { day: Day; value: number | null }[];
  after: { day: Day; value: number | null }[];
};

function series(days: DayRecord[], key: SymptomKey, from: Day, to: Day) {
  const out: { day: Day; value: number | null }[] = [];
  for (let d = from; d <= to; d = shiftDay(d, 1)) {
    const rec = days.find((x) => x.day === d);
    const v = rec?.severities[key];
    out.push({ day: d, value: typeof v === "number" ? v : null });
  }
  return out;
}

/** the last day the outcome measures — completion, or today */
export function outcomeEndDay(enrollment: Enrollment, today: Day): Day {
  return enrollment.completed_at ? enrollment.completed_at.slice(0, 10) : today;
}

export function outcomeReady(enrollment: Enrollment, today: Day): boolean {
  if (enrollment.status === "completed") return true;
  return daysBetween(enrollment.started_on, today) >= TUNING.program.outcomeAfterDays;
}

/**
 * What her own check-ins say happened.
 *
 * The rules are the same ones the insight engine uses for any intervention,
 * and they cut both ways: a null result is a first-class verdict with its own
 * sentence, and nothing is inflated to make the feature look good.
 */
export function computeOutcome(
  days: DayRecord[],
  enrollment: Enrollment,
  tracked: SymptomKey[],
  today: Day
): OutcomeResult[] {
  const program = PROGRAM_BY_ID[enrollment.program_id as ProgramId];
  if (!program) return [];

  const { windowDays, minDaysEachSide, minShift } = TUNING.program;
  const end = outcomeEndDay(enrollment, today);

  const beforeFrom = shiftDay(enrollment.started_on, -windowDays);
  const beforeTo = shiftDay(enrollment.started_on, -1);
  const afterFrom = shiftDay(end, -(windowDays - 1));

  return program.targetSymptoms
    .filter((key) => tracked.includes(key))
    .map((key) => {
      const before = series(days, key, beforeFrom, beforeTo);
      const after = series(days, key, afterFrom, end);
      const b = before.map((p) => p.value).filter((v): v is number => v !== null);
      const a = after.map((p) => p.value).filter((v): v is number => v !== null);

      const s = SYMPTOM_BY_KEY[key];
      const weeks = word(program.weeks);

      if (b.length < minDaysEachSide || a.length < minDaysEachSide) {
        return {
          symptom: key,
          baseline: b.length ? round1(mean(b)) : null,
          endpoint: a.length ? round1(mean(a)) : null,
          delta: null,
          baselineDays: b.length,
          endpointDays: a.length,
          verdict: "not_enough_data" as const,
          sentence:
            "There aren’t enough check-ins on either side of this to say what changed. Marlow would rather say nothing than guess.",
          before,
          after,
        };
      }

      const baseline = mean(b);
      const endpoint = mean(a);
      const delta = endpoint - baseline;
      // the positive symptom improves by going up; everything else by going down
      const positive = s.kind === "positive";
      const improved = positive ? delta >= minShift : delta <= -minShift;
      const worse = positive ? delta <= -minShift : delta >= minShift;
      const verdict: OutcomeVerdict = improved ? "improved" : worse ? "worse" : "no_change";

      const from = round1(baseline);
      const to = round1(endpoint);

      const sentence = improved
        ? `Over ${weeks} weeks of ${program.name}, your ${s.phrase} ${verb(key, "went", "went")} from averaging ${from} to ${to}. That change is yours.`
        : worse
          ? `Your ${s.phrase} ${verb(key, "has", "have")} run a little higher than before you started ${program.name} — ${from} then, ${to} now. Worth saying out loud at your next appointment; it does not mean you did anything wrong.`
          : `Your ${s.phrase} ratings didn’t move much across ${program.name} — ${from} before, ${to} after. That’s real information too, and worth showing your doctor. Other approaches exist.`;

      return {
        symptom: key,
        baseline: from,
        endpoint: to,
        delta: round1(delta),
        baselineDays: b.length,
        endpointDays: a.length,
        verdict,
        sentence,
        before,
        after,
      };
    });
}

/**
 * The weekly note while a program is running. Deliberately hedged: it is a
 * direction of travel, not a result, and it says so.
 */
export function weeklyNote(
  days: DayRecord[],
  enrollment: Enrollment,
  tracked: SymptomKey[],
  today: Day
): string | null {
  const program = PROGRAM_BY_ID[enrollment.program_id as ProgramId];
  if (!program) return null;

  const elapsed = daysBetween(enrollment.started_on, today);
  const weeksIn = Math.floor(elapsed / 7);
  if (weeksIn < 1) return null;

  const key = program.targetSymptoms.find((k) => tracked.includes(k));
  if (!key) return null;

  const { windowDays, minDaysEachSide } = TUNING.program;
  const before = series(days, key, shiftDay(enrollment.started_on, -windowDays), shiftDay(enrollment.started_on, -1))
    .map((p) => p.value)
    .filter((v): v is number => v !== null);
  const since = series(days, key, enrollment.started_on, today)
    .map((p) => p.value)
    .filter((v): v is number => v !== null);

  if (before.length < minDaysEachSide || since.length < minDaysEachSide) {
    return `${word(weeksIn)} ${weeksIn === 1 ? "week" : "weeks"} in. Not enough check-ins yet to see which way this is going.`;
  }

  const s = SYMPTOM_BY_KEY[key];
  const delta = mean(since) - mean(before);
  const positive = s.kind === "positive";
  const direction =
    (positive ? delta >= 0.25 : delta <= -0.25)
      ? "trending down"
      : (positive ? delta <= -0.25 : delta >= 0.25)
        ? "trending up"
        : "holding about level";

  return `${word(weeksIn)} ${weeksIn === 1 ? "week" : "weeks"} in: your ${s.phrase} ratings are ${direction}. Too early to call.`;
}
