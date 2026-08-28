import { SYMPTOM_BY_KEY, verb, type SymptomKey } from "@/lib/symptoms";
import type { DayRecord, Intervention, Profile } from "@/lib/types";
import type { Day } from "@/lib/day";
import { describeSymptom } from "./describe";

const spanPhrase = (span: number) =>
  span >= 90 ? "the last three months" : span >= 60 ? "the last two months" : "the last month";

/**
 * Her own logs, turned into questions she can read off a page in the room.
 *
 * Neutral by design: they describe frequency and ask what the options are.
 * They never suggest a diagnosis, name a drug, or tell her what to request.
 */
export function neutralQuestions(
  days: DayRecord[],
  profile: Profile,
  interventions: Intervention[],
  span: number,
  endDay: Day
): string[] {
  const ranked = profile.symptoms
    .filter((key) => SYMPTOM_BY_KEY[key].kind === "burden")
    .map((key) => ({ key, summary: describeSymptom(days, key, span, endDay) }))
    .filter((x) => x.summary.logged >= 7)
    .sort((a, b) => b.summary.average - a.summary.average)
    .slice(0, 3);

  // Exact counts rather than a weekly average — more use to a clinician. And
  // where two symptoms ran at the same frequency, they share a question:
  // asking the same thing three times with a different noun wastes the few
  // minutes she gets, and reads like a form rather than like her.
  const grouped = new Map<string, { keys: SymptomKey[]; felt: number; logged: number }>();
  for (const { key, summary } of ranked) {
    const bucket = `${summary.felt}/${summary.logged}`;
    const entry = grouped.get(bucket) ?? { keys: [], felt: summary.felt, logged: summary.logged };
    entry.keys.push(key);
    grouped.set(bucket, entry);
  }

  const questions = [...grouped.values()].map(({ keys, felt, logged }) => {
    const phrases = keys.map((k) => SYMPTOM_BY_KEY[k].phrase);
    if (keys.length === 1) {
      return `My ${phrases[0]} ${verb(keys[0], "has", "have")} been noticeable or worse on ${felt} of the ${logged} days I logged. What are my options?`;
    }
    const list = `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
    return `My ${list} have each been noticeable or worse on ${felt} of the ${logged} days I logged. What are my options?`;
  });

  const active = interventions.filter((i) => !i.ended_on);
  if (active.length) {
    questions.push(
      `I have been trying ${active[0].name.toLowerCase()} since ${monthOf(active[0].started_on)}. Is that worth continuing?`
    );
  }

  questions.push(
    "What would you expect tests to show at this stage, and what else is worth checking?"
  );
  questions.push("What should have changed before I come back, and when should that be?");

  return questions.slice(0, 5);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const monthOf = (day: Day) => MONTHS[Number(day.slice(5, 7)) - 1];
