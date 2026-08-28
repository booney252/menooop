import { SYMPTOM_BY_KEY, type SymptomKey } from "@/lib/symptoms";
import { daysBetween, longDay, type Day } from "@/lib/day";
import { describeSymptom } from "@/lib/insights/describe";
import type { History, Insight } from "@/lib/types";

/**
 * The compact picture of her last sixty days that Marlow is given.
 *
 * Plain sentences rather than JSON — it reads better to the model, and it is
 * the same thing she would say out loud. Built entirely on the server; the
 * browser never gets to say what her record contains.
 */
export function buildSummary(history: History, insights: Insight[], today: Day): string {
  const { profile, days, interventions } = history;
  const lines: string[] = [];

  lines.push(
    profile.stage === "stopped"
      ? "Her periods stopped over a year ago."
      : profile.stage === "cycling"
        ? "Her periods are still fairly regular."
        : "Her periods have become unpredictable."
  );

  if (days.length === 0) {
    lines.push("She has not logged any check-ins yet.");
    return lines.join("\n");
  }

  const starts = days.filter((d) => d.periodStarted).map((d) => d.day);
  if (profile.stage !== "stopped" && starts.length) {
    const last = starts[starts.length - 1];
    lines.push(
      `Her last logged period started on ${longDay(last)}, which is day ${daysBetween(last, today) + 1} of her current cycle.`
    );
  }

  lines.push(`She has logged ${days.length} check-ins in the last sixty days:`);
  for (const key of profile.symptoms) {
    const s = describeSymptom(days, key, 60, today);
    if (!s.logged) continue;
    lines.push(`- ${SYMPTOM_BY_KEY[key as SymptomKey].label}: ${s.sentence}`);
  }

  const active = interventions.filter((i) => !i.ended_on);
  const past = interventions.filter((i) => i.ended_on);
  if (active.length) {
    lines.push(
      `Currently trying: ${active.map((i) => `${i.name} (since ${longDay(i.started_on)})`).join(", ")}.`
    );
  }
  if (past.length) {
    lines.push(`Tried and stopped: ${past.map((i) => i.name).join(", ")}.`);
  }
  if (!active.length && !past.length) {
    lines.push("She has not logged anything she is trying.");
  }

  if (insights.length) {
    lines.push("What Marlow has already told her, most recent first:");
    for (const i of insights.slice(0, 4)) lines.push(`- ${i.sentence}`);
  }

  const notes = days.filter((d) => d.note).slice(-3).reverse();
  if (notes.length) {
    lines.push(`Recent notes she wrote: ${notes.map((n) => `"${n.note}"`).join(" ")}`);
  }

  return lines.join("\n");
}

/** three openers, drawn from what her own record shows */
export function starterQuestions(history: History, today: Day): string[] {
  const { profile, days, interventions } = history;
  const out: string[] = [];

  const ranked = profile.symptoms
    .filter((k) => SYMPTOM_BY_KEY[k].kind === "burden")
    .map((key) => ({ key, s: describeSymptom(days, key, 60, today) }))
    .filter((x) => x.s.logged >= 7)
    .sort((a, b) => b.s.average - a.s.average);

  if (ranked[0]) {
    out.push(`What’s actually driving my ${SYMPTOM_BY_KEY[ranked[0].key].phrase}?`);
  }
  const active = interventions.filter((i) => !i.ended_on);
  if (active.length) {
    out.push(`Is ${active[0].name.toLowerCase()} actually doing anything?`);
  }
  if (profile.stage !== "stopped") {
    out.push("Why does everything get worse before my period?");
  }
  out.push("My bloods were normal. What does that actually tell us?");
  out.push("What would I need to know before asking about HRT?");

  return out.slice(0, 3);
}
