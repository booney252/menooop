import { SYMPTOM_BY_KEY, verb, type SymptomKey } from "@/lib/symptoms";
import { daysEnding, type Day } from "@/lib/day";
import type { DayRecord } from "@/lib/types";

export type SymptomSummary = {
  logged: number;
  felt: number;
  rough: number;
  average: number;
  /** the plain-language line that must always accompany the marks */
  sentence: string;
  points: { day: Day; value: number | null }[];
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * Describes one symptom over a window, in words she can read.
 *
 * This never claims a pattern — it counts what is there. Pattern claims only
 * come from the insight engine, which has thresholds. When there is too little
 * to say, it says that instead of padding.
 */
export function describeSymptom(
  days: DayRecord[],
  key: SymptomKey,
  span: number,
  endDay: Day
): SymptomSummary {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const window = daysEnding(endDay, span);
  const points = window.map((day) => ({
    day,
    value: byDay.get(day)?.severities[key] ?? null,
  }));

  const values: number[] = [];
  for (const p of points) if (p.value !== null) values.push(p.value);
  const symptom = SYMPTOM_BY_KEY[key];
  const positive = symptom.kind === "positive";

  // "felt" means the symptom was present enough to notice; for the positive
  // one that is the same test read the other way round — she felt like herself.
  const felt = values.filter((v) => v >= 2).length;
  const rough = positive
    ? values.filter((v) => v === 0).length
    : values.filter((v) => v === 3).length;

  let sentence: string;
  if (values.length === 0) {
    sentence = "Nothing logged for this one yet.";
  } else if (values.length < 7) {
    sentence = `Only ${values.length} ${values.length === 1 ? "day" : "days"} logged so far — too few to read anything into.`;
  } else if (positive) {
    sentence = `You felt mostly or completely like yourself on ${felt} of the ${values.length} days you logged.`;
  } else {
    sentence = `Noticeable or worse on ${felt} of the ${values.length} days you logged, rough on ${rough}.`;
  }

  // a trend clause only when there is enough on both sides to compare
  if (values.length >= 20) {
    const logged = (slice: typeof points) =>
      slice.reduce<number[]>((acc, p) => (p.value === null ? acc : [...acc, p.value]), []);
    const recent = logged(points.slice(-14));
    const before = logged(points.slice(-28, -14));
    if (recent.length >= 7 && before.length >= 7) {
      const delta = mean(recent) - mean(before);
      const better = positive ? delta >= 0.35 : delta <= -0.35;
      const worse = positive ? delta <= -0.35 : delta >= 0.35;
      if (better) sentence += ` A little easier these past two weeks.`;
      else if (worse) sentence += ` A little heavier these past two weeks.`;
    }
  }

  return { logged: values.length, felt, rough, average: mean(values), sentence, points };
}

/** the one-word trend shown beside a symptom name */
export function trendWord(summary: SymptomSummary): string {
  if (summary.logged < 7) return "";
  if (/easier these past/.test(summary.sentence)) return "easing";
  if (/heavier these past/.test(summary.sentence)) return "building";
  return "steady";
}

export function symptomHeading(key: SymptomKey): string {
  return SYMPTOM_BY_KEY[key].label;
}

export { verb };
