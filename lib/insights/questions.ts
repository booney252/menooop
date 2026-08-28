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

  // Exact counts rather than a weekly average: more use to a clinician, and
  // it stops three questions in a row reading like the same sentence.
  const questions = ranked.map(({ key, summary }) => {
    const s = SYMPTOM_BY_KEY[key];
    return `My ${s.phrase} ${verb(key, "has", "have")} been noticeable or worse on ${summary.felt} of the ${summary.logged} days I logged over ${spanPhrase(span)}. What are my options?`;
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
