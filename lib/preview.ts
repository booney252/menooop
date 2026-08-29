/**
 * Fixtures for the design preview. Never reachable in a real deployment —
 * see app/preview/[screen]/page.tsx for the two gates.
 */
import { demoDays, demoInterventions, demoProfile } from "./demo-data";
import { candidates } from "./insights/engine";
import { describeSymptom } from "./insights/describe";
import { neutralQuestions } from "./insights/questions";
import { shiftDay } from "./day";
import type { Enrollment, History, Insight, Report } from "./types";
import { computeOutcome, weeklyNote } from "./programs/outcome";
import { matchProgram } from "./programs/match";
import { demoDays as makeDays } from "./demo-data";

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


// ── the Relief Loop ─────────────────────────────────────────────────────────

export function previewEnrollment(over: Partial<Enrollment> = {}): Enrollment {
  return {
    id: "preview-enrollment",
    program_id: "cool",
    started_on: shiftDay(PREVIEW_TODAY, -42),
    status: "active",
    paused_at: null,
    completed_at: null,
    intervention_id: null,
    created_at: new Date().toISOString(),
    ...over,
  };
}

export const previewSuggestion = () => {
  const { profile, days } = previewHistory();
  return matchProgram(days, profile.symptoms);
};

export const previewWeeklyNote = () => {
  const { profile, days } = previewHistory();
  return weeklyNote(days, previewEnrollment(), profile.symptoms, PREVIEW_TODAY);
};

/**
 * A history where the flashes genuinely came down after the program started,
 * so the Outcome screen has a real curve to draw rather than noise.
 */
export function previewOutcomeHistory(improved: boolean) {
  const { profile } = previewHistory();
  const base = makeDays(PREVIEW_TODAY, ["hot_flashes", "sleep"], 70);
  const start = shiftDay(PREVIEW_TODAY, -42);
  // real records are noisy; a perfectly flat before-and-after looks invented,
  // and this is the screen the founder will be filming
  const wobble = (day: string, spread: number) =>
    ((day.charCodeAt(8) * 7 + day.charCodeAt(9) * 13) % 100) / 100 < spread ? 1 : 0;

  const days = base.map((d) => {
    const after = d.day >= start;
    const centre = after ? (improved ? 1 : 2) : 2.4;
    const up = wobble(d.day, after ? 0.3 : 0.55);
    const down = wobble(d.day.split("").reverse().join(""), 0.25) ? 1 : 0;
    const value = Math.max(0, Math.min(3, Math.round(centre + up - down)));
    return { ...d, severities: { ...d.severities, hot_flashes: value as 0 | 1 | 2 | 3 } };
  });
  return { profile, days };
}

export function previewOutcome(improved: boolean) {
  const { profile, days } = previewOutcomeHistory(improved);
  return computeOutcome(days, previewEnrollment({ status: "completed", completed_at: `${PREVIEW_TODAY}T09:00:00Z` }), profile.symptoms, PREVIEW_TODAY);
}
