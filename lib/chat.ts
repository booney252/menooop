import { SYMPTOM_BY_ID, verb } from "./data";
import { longDate, today } from "./dates";
import {
  bestLutealLift,
  bestSupplementShift,
  calmStreak,
  summary,
  windowStart,
} from "./insights";
import { SUPPLEMENT_START, type Entry, type Profile } from "./seed";

export type ChatRole = "user" | "assistant";
export type ChatMessage = { id: string; role: ChatRole; text: string };

/**
 * What Marlow is allowed to know about her. Plain sentences rather than JSON —
 * it reads better to the model and it is the same thing she would say out loud.
 */
export function buildContext(profile: Profile, entries: Record<string, Entry>): string {
  const to = today();
  const from = windowStart(entries, 60);
  const lines: string[] = [];

  lines.push(
    profile.stage === "stopped"
      ? "Her periods stopped over a year ago."
      : profile.stage === "irregular"
        ? "Her periods have become unpredictable."
        : "Her periods are still fairly regular."
  );
  if (profile.cycleDay != null) {
    lines.push(`She is on day ${profile.cycleDay} of her current cycle.`);
  }

  lines.push(
    `She has logged ${profile.symptoms.length} symptoms daily from ${longDate(from)} to ${longDate(to)}:`
  );
  for (const id of profile.symptoms) {
    const s = summary(entries, id);
    const streak = calmStreak(entries, id);
    let line = `- ${SYMPTOM_BY_ID[id].label}: noticeable or worse on ${s.felt} of ${s.days} days, rough on ${s.rough}, currently ${s.trend.word}`;
    if (streak >= 4) line += `, quiet for the last ${streak} days`;
    lines.push(`${line}.`);
  }

  const cyc = bestLutealLift(entries, profile);
  if (cyc?.lift) {
    lines.push(
      `${SYMPTOM_BY_ID[cyc.id].label} runs about ${cyc.lift.lift}% heavier in the five days before a period than through the rest of her month.`
    );
  }

  const eased = bestSupplementShift(entries, profile);
  if (eased?.shift) {
    lines.push(
      `${SYMPTOM_BY_ID[eased.id].label} is down ${eased.shift.pct}% in the ${SUPPLEMENT_START} days since she started ${profile.supplements[0].toLowerCase()}.`
    );
  }

  lines.push(
    profile.hrt === "yes"
      ? "She is currently taking hormone therapy."
      : profile.hrt === "considering"
        ? "She is not on hormone therapy and would like to discuss it."
        : "She is not taking hormone therapy."
  );
  lines.push(
    profile.supplements.length
      ? `Supplements: ${profile.supplements.join(", ")}.`
      : "She is not taking any supplements."
  );

  const notes = Object.values(entries)
    .filter((e) => e.note)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);
  if (notes.length) {
    lines.push(`Recent notes she wrote: ${notes.map((n) => `"${n.note}"`).join(" ")}`);
  }

  return lines.join("\n");
}

/** three openers, drawn from what her own record shows */
export function suggestions(profile: Profile, entries: Record<string, Entry>): string[] {
  const out: string[] = [];
  const cyc = bestLutealLift(entries, profile);
  const eased = bestSupplementShift(entries, profile);
  const heaviest = [...profile.symptoms]
    .map((id) => ({ id, avg: summary(entries, id).avg }))
    .sort((a, b) => b.avg - a.avg)[0];

  if (heaviest) {
    out.push(`What’s actually driving my ${SYMPTOM_BY_ID[heaviest.id].phrase}?`);
  }
  if (cyc?.lift) {
    out.push(
      `Why ${verb(cyc.id, "does", "do")} my ${SYMPTOM_BY_ID[cyc.id].phrase} spike before my period?`
    );
  }
  if (eased?.shift) {
    out.push(`Is ${profile.supplements[0].toLowerCase()} actually doing anything?`);
  }
  if (profile.hrt !== "yes") {
    out.push("What would I need to know before asking about HRT?");
  }
  out.push("My bloods were normal. What does that actually tell us?");
  return out.slice(0, 3);
}

export const DISCLAIMER = "Marlow isn’t a doctor and doesn’t replace one.";
