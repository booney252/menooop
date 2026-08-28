/**
 * Fixtures for the design preview. Never reachable in a real deployment —
 * see app/preview/[screen]/page.tsx for the two gates.
 */
import { demoDays, demoInterventions, demoProfile } from "./demo-data";
import { candidates } from "./insights/engine";
import { describeSymptom } from "./insights/describe";
import { neutralQuestions } from "./insights/questions";
import { shiftDay } from "./day";
import type { History, Insight, Report } from "./types";

export const PREVIEW_TODAY = "2026-08-27";

export function previewHistory(): History {
  return {
    profile: demoProfile(),
    days: demoDays(PREVIEW_TODAY),
    interventions: demoInterventions(PREVIEW_TODAY),
  };
}

/** the stored insights she would have accumulated, newest first */
export function previewInsights(): Insight[] {
  const history = previewHistory();
  const list = candidates(history);
  const picked: Insight[] = [];
  let lastKind: string | null = null;

  for (const c of list) {
    if (picked.length >= 4) break;
    if (c.kind === lastKind) continue;
    picked.push({
      id: c.dedupeKey,
      kind: c.kind,
      subject: c.subject,
      sentence: c.sentence,
      detail: c.detail,
      payload: c.payload,
      for_date: shiftDay(PREVIEW_TODAY, -picked.length * 3),
      dedupe_key: c.dedupeKey,
      created_at: new Date().toISOString(),
    });
    lastKind = c.kind;
  }
  return picked;
}

export function previewReport(): Report {
  return {
    id: "preview",
    window_start: shiftDay(PREVIEW_TODAY, -59),
    window_end: PREVIEW_TODAY,
    checkin_count: demoDays(PREVIEW_TODAY).length,
    say_note:
      "I have been told my bloods are normal twice. I would like to talk about what else this could be, and about HRT.",
    created_at: new Date().toISOString(),
    outcome_logged_at: null,
    outcome_went: null,
    outcome_note: null,
    outcome_dismissed_at: null,
  };
}

export function previewReportRows() {
  const { profile, days } = previewHistory();
  return profile.symptoms.map((key) => ({
    key,
    summary: describeSymptom(days, key, 60, PREVIEW_TODAY),
  }));
}

export function previewQuestions() {
  const { profile, days, interventions } = previewHistory();
  return neutralQuestions(days, profile, interventions, 60, PREVIEW_TODAY);
}
