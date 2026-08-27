export type Stage = "regular" | "irregular" | "stopped";
export type Hrt = "yes" | "considering" | "no";

export type SymptomId =
  | "sleep"
  | "anxiety"
  | "fog"
  | "flushes"
  | "fatigue"
  | "mood"
  | "sweats"
  | "joints"
  | "headache"
  | "weight"
  | "heart"
  | "libido"
  | "dryness"
  | "periods"
  | "skin";

export type Symptom = {
  id: SymptomId;
  label: string;
  /** shown under the label during check-in — never clinical */
  aside: string;
  /** the form that reads like English mid-sentence: "your sleep has been..." */
  phrase: string;
  /** whether that phrase takes a plural verb — "hot flushes are", "sleep is" */
  plural: boolean;
};

export const SYMPTOMS: Symptom[] = [
  { id: "sleep", label: "Waking at 3am", aside: "Falling asleep is fine, staying asleep isn’t.", phrase: "sleep", plural: false },
  { id: "anxiety", label: "Anxiety", aside: "The hum that arrives before the thought.", phrase: "anxiety", plural: false },
  { id: "fog", label: "Brain fog", aside: "Words, names, why you walked in here.", phrase: "brain fog", plural: false },
  { id: "flushes", label: "Hot flushes", aside: "The heat that starts in your chest.", phrase: "hot flushes", plural: true },
  { id: "fatigue", label: "Flat energy", aside: "Tired in a way that sleep doesn’t fix.", phrase: "energy", plural: false },
  { id: "mood", label: "Mood swings", aside: "The turn you can feel coming.", phrase: "mood", plural: false },
  { id: "sweats", label: "Night sweats", aside: "Waking up damp, changing the sheets.", phrase: "night sweats", plural: true },
  { id: "joints", label: "Aching joints", aside: "Hands, hips and knees in the morning.", phrase: "joint pain", plural: false },
  { id: "headache", label: "Headaches", aside: "The dull band, or the real ones.", phrase: "headaches", plural: true },
  { id: "weight", label: "Weight changes", aside: "Nothing else changed, but this did.", phrase: "weight", plural: false },
  { id: "heart", label: "Heart flutters", aside: "A skip or a race, out of nowhere.", phrase: "heart flutters", plural: true },
  { id: "libido", label: "Low libido", aside: "The wanting, not the doing.", phrase: "libido", plural: false },
  { id: "dryness", label: "Dryness", aside: "Skin, eyes, and everywhere else.", phrase: "dryness", plural: false },
  { id: "periods", label: "Unpredictable periods", aside: "Early, late, heavy, gone.", phrase: "cycle", plural: false },
  { id: "skin", label: "Itchy skin", aside: "Crawling or prickling, under the surface.", phrase: "itchy skin", plural: false },
];

/** picks the verb form a symptom's phrase needs: verb(s, "is", "are") */
export function verb(id: SymptomId, singular: string, plural: string): string {
  return SYMPTOM_BY_ID[id]?.plural ? plural : singular;
}

export const SYMPTOM_BY_ID = Object.fromEntries(
  SYMPTOMS.map((s) => [s.id, s])
) as Record<SymptomId, Symptom>;

/** Four steps. Human words, no numbers, no faces, no colour coding. */
export const SCALE = [
  { value: 0, label: "Not today", short: "not today" },
  { value: 1, label: "Barely there", short: "barely there" },
  { value: 2, label: "Noticeable", short: "noticeable" },
  { value: 3, label: "Rough", short: "rough" },
] as const;

export const STAGES: { id: Stage; label: string; aside: string }[] = [
  { id: "regular", label: "Still fairly regular", aside: "They turn up when you expect them." },
  { id: "irregular", label: "Unpredictable", aside: "Closer together, further apart, or skipping." },
  { id: "stopped", label: "They’ve stopped", aside: "A year or more since the last one." },
];

export const SUPPLEMENTS = [
  "Magnesium glycinate",
  "Vitamin D",
  "Omega-3",
  "Creatine",
  "Ashwagandha",
  "B complex",
  "Iron",
  "Protein",
];
