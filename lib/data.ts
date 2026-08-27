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
};

export const SYMPTOMS: Symptom[] = [
  { id: "sleep", label: "Waking at 3am", aside: "Falling asleep is fine, staying asleep isn’t.", phrase: "sleep" },
  { id: "anxiety", label: "Anxiety", aside: "The hum that arrives before the thought.", phrase: "anxiety" },
  { id: "fog", label: "Brain fog", aside: "Words, names, why you walked in here.", phrase: "brain fog" },
  { id: "flushes", label: "Hot flushes", aside: "The heat that starts in your chest.", phrase: "hot flushes" },
  { id: "fatigue", label: "Flat energy", aside: "Tired in a way that sleep doesn’t fix.", phrase: "energy" },
  { id: "mood", label: "Mood swings", aside: "The turn you can feel coming.", phrase: "mood" },
  { id: "sweats", label: "Night sweats", aside: "Waking up damp, changing the sheets.", phrase: "night sweats" },
  { id: "joints", label: "Aching joints", aside: "Hands, hips and knees in the morning.", phrase: "joint pain" },
  { id: "headache", label: "Headaches", aside: "The dull band, or the real ones.", phrase: "headaches" },
  { id: "weight", label: "Weight changes", aside: "Nothing else changed, but this did.", phrase: "weight" },
  { id: "heart", label: "Heart flutters", aside: "A skip or a race, out of nowhere.", phrase: "heart flutters" },
  { id: "libido", label: "Low libido", aside: "The wanting, not the doing.", phrase: "libido" },
  { id: "dryness", label: "Dryness", aside: "Skin, eyes, and everywhere else.", phrase: "dryness" },
  { id: "periods", label: "Unpredictable periods", aside: "Early, late, heavy, gone.", phrase: "cycle" },
  { id: "skin", label: "Itchy skin", aside: "Crawling or prickling, under the surface.", phrase: "itchy skin" },
];

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
