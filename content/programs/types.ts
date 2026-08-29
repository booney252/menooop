import type { SymptomKey } from "@/lib/symptoms";

export type SessionKind = "audio" | "text";

export type SessionContent = {
  /** 1-based day within the program */
  day: number;
  kind: SessionKind;
  minutes: number;
  title: string;
  /** content key, and the audio filename: /audio/{program}/{ref}.mp3 */
  ref: string;
  /** placeholder sessions are structure only, awaiting approved copy */
  status: "final" | "placeholder";
  /** the line or two on screen above the player */
  intro?: string;
  /** paced cards — the body of a text session, or notes after an audio one */
  cards?: string[];
};

export type ProgramContent = {
  id: "cool" | "rest" | "steady";
  name: string;
  tagline: string;
  weeks: number;
  minutesPerSession: number;
  targetSymptoms: SymptomKey[];
  sort: number;

  /** what this is, in her language */
  what: string[];
  /** what is expected of her */
  commitment: string;
  /**
   * FOR REPLACEMENT — claims-reviewed copy.
   * What the research actually shows, including its limits. Written honestly
   * here as a working draft; every word is the founder's to approve.
   */
  evidence: string[];
  /** the weekly arc, one line per week, shown on the enrollment screen */
  arc: string[];
  sessions: SessionContent[];
};

/** Shown on every enrollment screen. Honesty is the brand. */
export const VOICE_DISCLOSURE =
  "Sessions are voiced with AI, written from clinically studied protocols.";

export const NOT_A_DOCTOR = "Marlow isn’t a doctor and doesn’t replace one.";

/**
 * Marks copy that has not been through claims review. The engine serves it, so
 * the whole experience is testable, and the UI says plainly what it is.
 */
export const FOR_REPLACEMENT = "FOR REPLACEMENT — awaiting approved script.";

/** builds the days a week's worth of placeholder sessions occupies */
export function placeholderWeek(
  startDay: number,
  week: number,
  kind: SessionKind,
  minutes: number,
  theme: string
): SessionContent[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day: startDay + i,
    kind,
    minutes,
    title: `${theme}, day ${i + 1}`,
    ref: `w${week}d${i + 1}`,
    status: "placeholder" as const,
    intro: FOR_REPLACEMENT,
    cards: [FOR_REPLACEMENT],
  }));
}
