/** The catalog, mirroring public.symptoms. Keys must match the migration. */

export type SymptomKey =
  | "hot_flashes"
  | "night_sweats"
  | "sleep"
  | "anxiety"
  | "irritability"
  | "brain_fog"
  | "fatigue"
  | "joint_aches"
  | "cravings"
  | "low_mood"
  | "like_myself";

export type Symptom = {
  key: SymptomKey;
  label: string;
  /** the quiet line under the label during check-in */
  aside: string;
  /** the form that reads like English mid-sentence: "your sleep has been…" */
  phrase: string;
  /** whether that phrase takes a plural verb — "hot flashes are", "sleep is" */
  plural: boolean;
  /** 'positive' is the one she wants more of, and it reads in reverse */
  kind: "burden" | "positive";
};

export const SYMPTOMS: Symptom[] = [
  { key: "hot_flashes",  label: "Hot flashes",           aside: "The heat that starts in your chest.",        phrase: "hot flashes",   plural: true,  kind: "burden" },
  { key: "night_sweats", label: "Night sweats",          aside: "Waking up damp, changing the sheets.",       phrase: "night sweats",  plural: true,  kind: "burden" },
  { key: "sleep",        label: "Waking at 3am",         aside: "Falling asleep is fine, staying asleep isn’t.", phrase: "sleep",      plural: false, kind: "burden" },
  { key: "anxiety",      label: "Anxiety",               aside: "The hum that arrives before the thought.",   phrase: "anxiety",       plural: false, kind: "burden" },
  { key: "irritability", label: "Short fuse",            aside: "The turn you can feel coming.",              phrase: "short fuse",    plural: false, kind: "burden" },
  { key: "brain_fog",    label: "Brain fog",             aside: "Words, names, why you walked in here.",      phrase: "brain fog",     plural: false, kind: "burden" },
  { key: "fatigue",      label: "Flat energy",           aside: "Tired in a way that sleep doesn’t fix.",     phrase: "energy",        plural: false, kind: "burden" },
  { key: "joint_aches",  label: "Aching joints",         aside: "Hands, hips and knees in the morning.",      phrase: "joint pain",    plural: false, kind: "burden" },
  { key: "cravings",     label: "Cravings and snacking", aside: "Standing at the fridge at four o’clock.",    phrase: "cravings",      plural: true,  kind: "burden" },
  { key: "low_mood",     label: "Low mood",              aside: "Flat, or closer to tears than usual.",       phrase: "mood",          plural: false, kind: "burden" },
  { key: "like_myself",  label: "Feeling like myself",   aside: "The days that feel like you again.",         phrase: "sense of yourself", plural: false, kind: "positive" },
];

export const SYMPTOM_BY_KEY = Object.fromEntries(
  SYMPTOMS.map((s) => [s.key, s])
) as Record<SymptomKey, Symptom>;

export const isSymptomKey = (v: string): v is SymptomKey => v in SYMPTOM_BY_KEY;

/** picks the verb a symptom's phrase needs: verb(key, "is", "are") */
export const verb = (key: SymptomKey, singular: string, plural: string) =>
  SYMPTOM_BY_KEY[key]?.plural ? plural : singular;

/**
 * Four steps. Human words, no numbers, no faces, no colour coding.
 * The positive symptom uses its own words for the same 0–3 scale.
 */
export const SCALE = [
  { value: 0, label: "Not today",     short: "not today" },
  { value: 1, label: "Barely there",  short: "barely there" },
  { value: 2, label: "Noticeable",    short: "noticeable" },
  { value: 3, label: "Rough",         short: "rough" },
] as const;

export const POSITIVE_SCALE = [
  { value: 0, label: "Not at all",    short: "not at all" },
  { value: 1, label: "A flicker",     short: "a flicker" },
  { value: 2, label: "Mostly",        short: "mostly" },
  { value: 3, label: "Completely",    short: "completely" },
] as const;

export const scaleFor = (key: SymptomKey) =>
  SYMPTOM_BY_KEY[key].kind === "positive" ? POSITIVE_SCALE : SCALE;

export type Stage = "cycling" | "irregular" | "stopped";

export const STAGES: { key: Stage; label: string; aside: string }[] = [
  { key: "cycling",   label: "Still fairly regular", aside: "They turn up when you expect them." },
  { key: "irregular", label: "Unpredictable",        aside: "Closer together, further apart, or skipping." },
  { key: "stopped",   label: "They’ve stopped",      aside: "A year or more since the last one." },
];

/** the up-note at the end of every check-in */
export const GOOD_THINGS = [
  { key: "slept_through",  label: "Slept through" },
  { key: "felt_like_me",   label: "Felt like myself" },
  { key: "good_energy",    label: "Good energy" },
  { key: "calm_day",       label: "A calm day" },
] as const;

export const GOOD_THING_LABEL = Object.fromEntries(
  GOOD_THINGS.map((g) => [g.key, g.label])
) as Record<string, string>;

/** offered during onboarding and in settings; she can type anything else */
export const INTERVENTION_SUGGESTIONS = [
  "Magnesium",
  "HRT",
  "Exercise",
  "Vitamin D",
  "Cutting alcohol",
  "Therapy",
  "New supplement",
];
