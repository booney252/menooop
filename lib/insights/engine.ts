import { daysBetween, shiftDay, type Day } from "@/lib/day";
import { SYMPTOM_BY_KEY, verb, type SymptomKey } from "@/lib/symptoms";
import type { DayRecord, History, InsightKind, Intervention, Severity } from "@/lib/types";
import { TUNING } from "./constants";

export type Candidate = {
  kind: InsightKind;
  subject: string | null;
  sentence: string;
  detail: string | null;
  payload: Record<string, unknown>;
  dedupeKey: string;
};

// ── small helpers ───────────────────────────────────────────────────────────

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

const WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty",
];
const word = (n: number) => (n >= 0 && n <= 20 ? WORDS[n] : String(n));
const Word = (n: number) => {
  const w = word(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

const byDay = (days: DayRecord[]) => new Map(days.map((d) => [d.day, d]));

const seriesFor = (days: DayRecord[], key: SymptomKey) =>
  days
    .map((d) => ({ day: d.day, value: d.severities[key] }))
    .filter((p): p is { day: Day; value: Severity } => typeof p.value === "number");

const burdenKeys = (keys: SymptomKey[]) =>
  keys.filter((k) => SYMPTOM_BY_KEY[k]?.kind === "burden");

/**
 * Whether a shift is in the direction she would want. Burden symptoms are
 * better when the number falls; the positive symptom is better when it rises.
 */
const isImprovement = (key: SymptomKey, shift: number) =>
  SYMPTOM_BY_KEY[key].kind === "positive" ? shift > 0 : shift < 0;

// ── Rule 1: intervention response ───────────────────────────────────────────

function interventionResponse(history: History): Candidate[] {
  const { days, interventions, profile } = history;
  const out: Candidate[] = [];

  for (const iv of interventions) {
    const start = iv.started_on;
    const beforeFrom = shiftDay(start, -TUNING.intervention.windowDays);
    const afterTo = shiftDay(start, TUNING.intervention.windowDays - 1);

    for (const key of profile.symptoms) {
      const points = seriesFor(days, key);
      const before = points.filter((p) => p.day >= beforeFrom && p.day < start).map((p) => p.value);
      const after = points.filter((p) => p.day >= start && p.day <= afterTo).map((p) => p.value);

      if (
        before.length < TUNING.intervention.minDaysEachSide ||
        after.length < TUNING.intervention.minDaysEachSide
      ) {
        continue;
      }

      const shift = mean(after) - mean(before);
      if (Math.abs(shift) < TUNING.intervention.minShift) continue;

      const s = SYMPTOM_BY_KEY[key];
      const better = isImprovement(key, shift);
      const direction = better ? "better" : "heavier";

      // Observational, always: a description of what her logs show over two
      // windows. The detail says plainly that it is not a claim about cause.
      const sentence = better
        ? `Your ${s.phrase} ${verb(key, "has", "have")} been easier since you started ${iv.name.toLowerCase()}.`
        : `Your ${s.phrase} ${verb(key, "has", "have")} run heavier since you started ${iv.name.toLowerCase()}.`;

      out.push({
        kind: "intervention_response",
        subject: key,
        sentence,
        detail: `That is the ${word(TUNING.intervention.windowDays)} days since, next to the ${word(TUNING.intervention.windowDays)} before — a comparison, not a cause. Worth mentioning at your next appointment.`,
        payload: {
          symptom: key,
          intervention: iv.name,
          before: round1(mean(before)),
          after: round1(mean(after)),
          beforeDays: before.length,
          afterDays: after.length,
        },
        dedupeKey: `ir:${iv.id}:${key}:${direction}`,
      });
    }
  }

  // strongest shift first
  return out.sort(
    (a, b) =>
      Math.abs((b.payload.after as number) - (b.payload.before as number)) -
      Math.abs((a.payload.after as number) - (a.payload.before as number))
  );
}

// ── Rule 2: lag effect ──────────────────────────────────────────────────────

function lagEffect(history: History): Candidate[] {
  const { days, profile } = history;
  const keys = burdenKeys(profile.symptoms);
  const map = byDay(days);
  const out: Candidate[] = [];

  // consecutive-day pairs available at all
  const pairs = days.filter((d) => map.has(shiftDay(d.day, 1))).length;
  if (pairs < TUNING.lag.minPairs) return out;

  for (const a of keys) {
    for (const b of keys) {
      if (a === b) continue;

      const afterRough: number[] = [];
      const afterCalm: number[] = [];

      for (const d of days) {
        const va = d.severities[a];
        if (typeof va !== "number") continue;
        const next = map.get(shiftDay(d.day, 1));
        const vb = next?.severities[b];
        if (typeof vb !== "number") continue;
        (va === 3 ? afterRough : afterCalm).push(vb);
      }

      if (afterRough.length < TUNING.lag.minRoughDays || afterCalm.length < TUNING.lag.minRoughDays) {
        continue;
      }

      const lift = mean(afterRough) - mean(afterCalm);
      if (lift < TUNING.lag.minLift) continue;

      const A = SYMPTOM_BY_KEY[a];
      const B = SYMPTOM_BY_KEY[b];

      out.push({
        kind: "lag_effect",
        subject: b,
        sentence: `Your hardest days for ${B.phrase} have tended to follow your roughest ones for ${A.phrase}.`,
        detail: `Across ${word(afterRough.length)} rough days for ${A.phrase}, the day after ran heavier for ${B.phrase} than usual. It is a pattern in your logs, not a cause.`,
        payload: {
          a,
          b,
          afterRough: round1(mean(afterRough)),
          afterCalm: round1(mean(afterCalm)),
          roughDays: afterRough.length,
        },
        dedupeKey: `lag:${a}:${b}`,
      });
    }
  }

  return out.sort(
    (x, y) =>
      ((y.payload.afterRough as number) - (y.payload.afterCalm as number)) -
      ((x.payload.afterRough as number) - (x.payload.afterCalm as number))
  );
}

// ── Rule 3: cycle-phase pattern ─────────────────────────────────────────────

export function periodStarts(days: DayRecord[]): Day[] {
  return days.filter((d) => d.periodStarted).map((d) => d.day);
}

function cyclePhase(history: History): Candidate[] {
  const { days, profile } = history;
  if (profile.stage === "stopped" || profile.stage == null) return [];

  const starts = periodStarts(days);
  if (starts.length < TUNING.cycle.minObserved) return [];

  const out: Candidate[] = [];
  const inWindow = (day: Day) =>
    starts.some((s) => {
      const gap = daysBetween(day, s);
      return gap >= 1 && gap <= TUNING.cycle.windowDays;
    });

  for (const key of burdenKeys(profile.symptoms)) {
    const points = seriesFor(days, key);
    if (!points.length) continue;

    const baseline = mean(points.filter((p) => !inWindow(p.day)).map((p) => p.value));

    let observed = 0;
    let hits = 0;
    let windowAvgTotal = 0;

    for (const start of starts) {
      const window = points.filter((p) => {
        const gap = daysBetween(p.day, start);
        return gap >= 1 && gap <= TUNING.cycle.windowDays;
      });
      if (window.length < TUNING.cycle.minDaysInWindow) continue;
      observed++;
      const avg = mean(window.map((p) => p.value));
      windowAvgTotal += avg;
      if (avg - baseline >= TUNING.cycle.minLift) hits++;
    }

    if (observed < TUNING.cycle.minObserved || hits < TUNING.cycle.minHits) continue;

    const s = SYMPTOM_BY_KEY[key];
    // "in two of your last two cycles" is technically right and reads badly
    const howMany =
      hits === observed
        ? observed === 2
          ? "in both of the last two cycles you logged"
          : `in all ${word(observed)} of the cycles you logged`
        : `in ${word(hits)} of your last ${word(observed)} cycles`;
    out.push({
      kind: "cycle_phase",
      subject: key,
      sentence: `${s.label} ${verb(key, "has", "have")} run heavier in the ${word(TUNING.cycle.windowDays)} days before your period ${howMany}.`,
      detail: "A rhythm worth naming out loud at an appointment — a cyclical pattern points somewhere more specific than a list of symptoms.",
      payload: {
        symptom: key,
        hits,
        observed,
        windowAvg: round1(windowAvgTotal / Math.max(observed, 1)),
        baseline: round1(baseline),
      },
      dedupeKey: `cyc:${key}:${observed}`,
    });
  }

  return out.sort((a, b) => (b.payload.hits as number) - (a.payload.hits as number));
}

// ── Rule 4: a quiet stretch ─────────────────────────────────────────────────

function positiveStreak(history: History): Candidate[] {
  const { days, profile } = history;
  const out: Candidate[] = [];

  for (const key of profile.symptoms) {
    const s = SYMPTOM_BY_KEY[key];
    const points = seriesFor(days, key);
    if (points.length < TUNING.streak.minDays) continue;

    const good = (v: Severity) =>
      s.kind === "positive"
        ? v >= TUNING.streak.goodAtOrAbove
        : v <= TUNING.streak.quietAtOrBelow;

    // the current run, counting back from her most recent logged day
    let run = 0;
    let startedOn: Day | null = null;
    for (let i = points.length - 1; i >= 0; i--) {
      if (!good(points[i].value)) break;
      run++;
      startedOn = points[i].day;
    }
    if (run < TUNING.streak.minDays || !startedOn) continue;

    // is this the longest she has logged?
    let best = 0;
    let cur = 0;
    for (const p of points) {
      cur = good(p.value) ? cur + 1 : 0;
      best = Math.max(best, cur);
    }
    const isRecord = run >= best;

    out.push({
      kind: "positive_streak",
      subject: key,
      sentence:
        s.kind === "positive"
          ? `${Word(run)} days running where you have felt like yourself.`
          : `${Word(run)} days running without a rough one for ${s.phrase}.`,
      detail: isRecord ? "The longest stretch you have logged." : null,
      payload: { symptom: key, days: run, isRecord },
      // one celebration per stretch, keyed on when the stretch began
      dedupeKey: `streak:${key}:${startedOn}`,
    });
  }

  return out.sort((a, b) => (b.payload.days as number) - (a.payload.days as number));
}

// ── Rule 5: the honest not-yet ──────────────────────────────────────────────

function notYet(history: History): Candidate[] {
  const logged = history.days.length;
  if (logged >= TUNING.notYet.enoughDays) return [];

  const remaining = TUNING.notYet.enoughDays - logged;
  const howLong =
    remaining >= 10 ? "About two more weeks" : remaining >= 4 ? "About another week" : "A few more days";

  const shape =
    history.profile.stage === "stopped"
      ? "to see how your weeks tend to go"
      : "to see the shape of your cycle";

  return [
    {
      kind: "not_yet",
      subject: null,
      sentence: `Nothing conclusive yet. ${howLong} of check-ins should be enough ${shape}.`,
      detail: `You have logged ${word(logged)} ${logged === 1 ? "day" : "days"} so far. Marlow would rather say nothing than guess.`,
      payload: { logged, needed: TUNING.notYet.enoughDays },
      dedupeKey: `notyet:${Math.floor(logged / 7)}`,
    },
  ];
}

// ── the engine ──────────────────────────────────────────────────────────────

/** Every candidate the rules produce, in priority order. */
export function candidates(history: History): Candidate[] {
  return [
    ...interventionResponse(history),
    ...lagEffect(history),
    ...cyclePhase(history),
    ...positiveStreak(history),
    ...notYet(history),
  ];
}

/**
 * The one new insight for today, or null to stay quiet.
 *
 * Priority order, first candidate she has not already been shown — except
 * that we skip past the kind she saw last if something else is available.
 * Four intervention comparisons on four consecutive mornings is technically
 * correct and reads like a spreadsheet; varying the kind keeps it feeling
 * like someone is paying attention rather than running a report.
 */
export function nextInsight(
  history: History,
  alreadySeen: Set<string>,
  lastKind?: InsightKind | null
): Candidate | null {
  const fresh = candidates(history).filter((c) => !alreadySeen.has(c.dedupeKey));
  if (!fresh.length) return null;
  return fresh.find((c) => c.kind !== lastKind) ?? fresh[0];
}

export { word, Word };
