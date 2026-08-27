import { SYMPTOM_BY_ID, type SymptomId } from "./data";
import { addDays, key, today } from "./dates";
import { HISTORY_DAYS, SUPPLEMENT_START, periodStarts, type Entry, type Profile } from "./seed";

export type Point = { date: string; daysAgo: number; value: number | null };

/**
 * The window ends on the most recent day she has actually logged, so a run of
 * days always counts to a whole number — sixty days means sixty entries, with
 * or without today's.
 */
export function series(
  entries: Record<string, Entry>,
  id: SymptomId,
  days = HISTORY_DAYS
): Point[] {
  const anchor = today();
  const end = entries[key(anchor)] ? 0 : 1;
  const out: Point[] = [];
  for (let daysAgo = days - 1 + end; daysAgo >= end; daysAgo--) {
    const k = key(addDays(anchor, -daysAgo));
    const v = entries[k]?.severities?.[id];
    out.push({ date: k, daysAgo, value: typeof v === "number" ? v : null });
  }
  return out;
}

/** the oldest day the window covers, for labelling the scale */
export function windowStart(entries: Record<string, Entry>, days: number): Date {
  const anchor = today();
  const end = entries[key(anchor)] ? 0 : 1;
  return addDays(anchor, -(days - 1 + end));
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const logged = (pts: Point[]) => pts.filter((p) => p.value !== null).map((p) => p.value as number);

/** overall pigment load for a single day — drives the month arc */
export function dayLoad(entries: Record<string, Entry>, k: string, symptoms: SymptomId[]) {
  const e = entries[k];
  if (!e) return null;
  const vals = symptoms
    .map((s) => e.severities[s])
    .filter((v): v is number => typeof v === "number");
  return vals.length ? mean(vals) : null;
}

/** consecutive days ending yesterday where this has stayed at barely-there or below */
export function calmStreak(entries: Record<string, Entry>, id: SymptomId) {
  const anchor = today();
  let n = 0;
  for (let daysAgo = 1; daysAgo <= HISTORY_DAYS; daysAgo++) {
    const v = entries[key(addDays(anchor, -daysAgo))]?.severities?.[id];
    if (typeof v === "number" && v <= 1) n++;
    else break;
  }
  return n;
}

export function recentTrend(entries: Record<string, Entry>, id: SymptomId) {
  const pts = series(entries, id, 28);
  const recent = mean(logged(pts.slice(14)));
  const before = mean(logged(pts.slice(0, 14)));
  const delta = recent - before;
  if (delta <= -0.35) return { word: "easing", delta } as const;
  if (delta >= 0.35) return { word: "building", delta } as const;
  return { word: "steady", delta } as const;
}

/** how much heavier this runs in the five days before a period */
export function lutealLift(
  entries: Record<string, Entry>,
  id: SymptomId,
  profile: Profile
) {
  const starts = periodStarts(profile);
  if (!starts.length) return null;
  const anchor = today();
  const inWindow: number[] = [];
  const rest: number[] = [];
  for (let daysAgo = 1; daysAgo <= HISTORY_DAYS; daysAgo++) {
    const v = entries[key(addDays(anchor, -daysAgo))]?.severities?.[id];
    if (typeof v !== "number") continue;
    const near = starts.some((s) => daysAgo - s >= 1 && daysAgo - s <= 5);
    (near ? inWindow : rest).push(v);
  }
  if (inWindow.length < 4 || rest.length < 10) return null;
  const a = mean(inWindow);
  const b = mean(rest);
  if (b <= 0.15) return null;
  return { lift: Math.round(((a - b) / b) * 100), inWindow: a, rest: b };
}

/** before/after the day she started her supplements */
export function supplementShift(entries: Record<string, Entry>, id: SymptomId) {
  const anchor = today();
  const before: number[] = [];
  const after: number[] = [];
  for (let daysAgo = 1; daysAgo <= HISTORY_DAYS; daysAgo++) {
    const v = entries[key(addDays(anchor, -daysAgo))]?.severities?.[id];
    if (typeof v !== "number") continue;
    (daysAgo < SUPPLEMENT_START ? after : before).push(v);
  }
  if (before.length < 8 || after.length < 8 || mean(before) <= 0.2) return null;
  return {
    pct: Math.round(((mean(before) - mean(after)) / mean(before)) * 100),
    before: mean(before),
    after: mean(after),
  };
}

export function summary(entries: Record<string, Entry>, id: SymptomId) {
  const pts = series(entries, id);
  const vals = logged(pts);
  const rough = vals.filter((v) => v === 3).length;
  const felt = vals.filter((v) => v >= 2).length;
  const quiet = vals.filter((v) => v <= 1).length;
  return {
    days: vals.length,
    rough,
    felt,
    quiet,
    avg: mean(vals),
    trend: recentTrend(entries, id),
  };
}

const pct = (n: number) => `${Math.abs(n)}%`;

const WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty",
];
export const word = (n: number) => (n <= 20 ? WORDS[n] : String(n));
export const Word = (n: number) => {
  const w = word(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

/** the symptom the supplements seem to have helped most */
export function bestSupplementShift(
  entries: Record<string, Entry>,
  profile: Profile
) {
  if (!profile.supplements.length) return null;
  const ranked = profile.symptoms
    .map((id) => ({ id, shift: supplementShift(entries, id) }))
    .filter((x) => x.shift && x.shift.pct >= 25)
    .sort((a, b) => (b.shift?.pct ?? 0) - (a.shift?.pct ?? 0));
  return ranked[0] ?? null;
}

/** the symptom with the clearest pre-period clustering */
export function bestLutealLift(entries: Record<string, Entry>, profile: Profile) {
  const ranked = profile.symptoms
    .map((id) => ({ id, lift: lutealLift(entries, id, profile) }))
    .filter((x) => x.lift && x.lift.lift >= 30)
    .sort((a, b) => (b.lift?.lift ?? 0) - (a.lift?.lift ?? 0));
  return ranked[0] ?? null;
}

/** one sentence for Today. Warm, specific, never a scold. */
export function todayInsight(
  entries: Record<string, Entry>,
  profile: Profile
): { line: string; foot: string } {
  const [first] = profile.symptoms;

  for (const id of profile.symptoms) {
    const streak = calmStreak(entries, id);
    if (streak >= 5) {
      return {
        line: `Your ${SYMPTOM_BY_ID[id].phrase} has been steadier ${word(streak)} days running.`,
        foot: "That’s the longest quiet stretch in the two months you’ve logged.",
      };
    }
  }

  const eased = bestSupplementShift(entries, profile);
  if (eased?.shift) {
    return {
      line: `${SYMPTOM_BY_ID[eased.id].label} is down ${pct(eased.shift.pct)} since you added ${profile.supplements[0].toLowerCase()}.`,
      foot: "Measured against the three weeks before you started.",
    };
  }

  const cyc = bestLutealLift(entries, profile);
  if (cyc?.lift) {
    return {
      line: `Your ${SYMPTOM_BY_ID[cyc.id].phrase} gathers in the five days before a period.`,
      foot: `About ${pct(cyc.lift.lift)} heavier in that window than the rest of the month.`,
    };
  }

  if (first) {
    const t = recentTrend(entries, first);
    return {
      line: `Your ${SYMPTOM_BY_ID[first].phrase} has been ${t.word} these past two weeks.`,
      foot: "Keep going and the shape of it gets clearer.",
    };
  }

  return {
    line: "Today is the first mark on the page.",
    foot: "A week from now this will start telling you something.",
  };
}

export type PatternCard = { title: string; body: string };

/** the plain-language cards on Patterns */
export function patternCards(
  entries: Record<string, Entry>,
  profile: Profile
): PatternCard[] {
  const cards: PatternCard[] = [];

  const cyc = bestLutealLift(entries, profile);
  if (cyc?.lift) {
    cards.push({
      title: `${SYMPTOM_BY_ID[cyc.id].label} clusters before your period`,
      body: `In the five days before each period it runs about ${pct(cyc.lift.lift)} heavier than through the rest of the month. It’s the clearest rhythm in your two months of entries.`,
    });
  }

  const eased = bestSupplementShift(entries, profile);
  if (eased?.shift) {
    cards.push({
      title: `${SYMPTOM_BY_ID[eased.id].label} eased after ${profile.supplements[0].toLowerCase()}`,
      body: `Down ${pct(eased.shift.pct)} across the ${word(SUPPLEMENT_START)} days since you started, compared with the ${word(SUPPLEMENT_START)} before. Worth saying out loud at your next appointment — it’s one of the few things you changed.`,
    });
  }

  for (const id of profile.symptoms) {
    if (eased?.id === id) continue;
    const streak = calmStreak(entries, id);
    if (streak >= 5) {
      cards.push({
        title: `${Word(streak)} steadier days in a row`,
        body: `${SYMPTOM_BY_ID[id].label} has stayed at barely there or below for ${word(streak)} days now. Two months ago that was rare enough to be worth marking.`,
      });
      break;
    }
  }

  const building = profile.symptoms
    .map((id) => ({ id, t: recentTrend(entries, id) }))
    .find((x) => x.t.word === "building");
  if (building && cards.length < 4) {
    cards.push({
      title: `${SYMPTOM_BY_ID[building.id].label} has been building`,
      body: `A little heavier over the past fortnight than the fortnight before. Nothing to act on — it’s here so you notice it before your appointment does.`,
    });
  }

  return cards.slice(0, 4);
}

/** questions she can take into the room */
export function doctorQuestions(
  entries: Record<string, Entry>,
  profile: Profile
): string[] {
  const qs: string[] = [];
  const heaviest = [...profile.symptoms]
    .map((id) => ({ id, avg: summary(entries, id).avg }))
    .sort((a, b) => b.avg - a.avg)[0];

  if (heaviest) {
    qs.push(
      `The symptom costing me the most is ${SYMPTOM_BY_ID[heaviest.id].label.toLowerCase()}. What are my options for treating that specifically?`
    );
  }
  const cyc = bestLutealLift(entries, profile);
  if (cyc?.lift) {
    qs.push(
      `My ${SYMPTOM_BY_ID[cyc.id].phrase} clusters in the five days before a period. Does that pattern change what you’d suggest?`
    );
  }
  if (profile.hrt !== "yes") {
    qs.push(
      "Given this record, am I a candidate for hormone therapy — and if not, what rules me out?"
    );
  } else {
    qs.push("Is my current dose doing what we hoped, or is it worth adjusting?");
  }
  qs.push(
    "My bloods came back normal. What would you expect them to show at this stage, and what else is worth testing?"
  );
  qs.push("What should change before I come back, and when should that be?");
  return qs.slice(0, 5);
}
