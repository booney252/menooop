import type { Day } from "./day";
import type { Stage, SymptomKey } from "./symptoms";

export type Severity = 0 | 1 | 2 | 3;

export type Profile = {
  id: string;
  first_name: string | null;
  stage: Stage | null;
  symptoms: SymptomKey[];
  timezone: string;
  nudge_enabled: boolean;
  nudge_hour: number | null;
  last_nudged_on: Day | null;
  onboarded_at: string | null;
  created_at: string;
};

export type Intervention = {
  id: string;
  name: string;
  started_on: Day;
  ended_on: Day | null;
};

export type InsightKind =
  | "intervention_response"
  | "lag_effect"
  | "cycle_phase"
  | "positive_streak"
  | "not_yet";

export type Insight = {
  id: string;
  kind: InsightKind;
  subject: string | null;
  sentence: string;
  detail: string | null;
  payload: Record<string, unknown>;
  for_date: Day;
  dedupe_key: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Report = {
  id: string;
  window_start: Day;
  window_end: Day;
  checkin_count: number;
  say_note: string | null;
  created_at: string;
  outcome_logged_at: string | null;
  outcome_went: "heard" | "mixed" | "dismissed" | "not_yet" | null;
  outcome_note: string | null;
  outcome_dismissed_at: string | null;
};

/** One day of her record, flattened for the engine and the screens. */
export type DayRecord = {
  day: Day;
  severities: Partial<Record<SymptomKey, Severity>>;
  note: string | null;
  goodThings: string[];
  periodStarted: boolean;
};

/** Everything the insight engine and the screens read from. */
export type History = {
  profile: Profile;
  days: DayRecord[];
  interventions: Intervention[];
};


// ── The Relief Loop ─────────────────────────────────────────────────────────

export type EnrollmentStatus = "active" | "paused" | "completed" | "stopped";

export type Enrollment = {
  id: string;
  program_id: string;
  started_on: Day;
  status: EnrollmentStatus;
  paused_at: string | null;
  completed_at: string | null;
  intervention_id: string | null;
  created_at: string;
};

export type SessionRating = "helped" | "neutral" | "not_for_me";

export type SessionCompletion = {
  id: string;
  enrollment_id: string;
  day_index: number;
  completed_on: Day;
  rating: SessionRating | null;
};

export type OutcomeVerdict = "improved" | "no_change" | "worse" | "not_enough_data";

export type Outcome = {
  id: string;
  enrollment_id: string;
  symptom_key: SymptomKey;
  baseline: number | null;
  endpoint: number | null;
  delta: number | null;
  baseline_days: number;
  endpoint_days: number;
  verdict: OutcomeVerdict;
  sentence: string;
  created_at: string;
};

export type ProgramRecommendation = {
  id: string;
  program_id: string;
  shown_on: Day;
  dismissed_at: string | null;
};
