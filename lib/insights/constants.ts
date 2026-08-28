/**
 * Every threshold the insight engine uses, in one place, so they can be tuned
 * without reading the engine. The bias throughout is toward silence: if a rule
 * is close to its threshold, it does not fire. She would rather be told
 * nothing than be told something that turns out not to be true.
 */
export const TUNING = {
  /** Rule 1 — intervention response */
  intervention: {
    /** days compared either side of the start date */
    windowDays: 14,
    /** logged days required on each side before we will compare at all */
    minDaysEachSide: 8,
    /** the average must move at least this far on the 0–3 scale */
    minShift: 0.75,
  },

  /** Rule 2 — lag effect: a rough day for A, then a harder day for B */
  lag: {
    /** consecutive-day pairs needed before we look for this at all */
    minPairs: 21,
    /** rough days for A, each with a logged day after it */
    minRoughDays: 5,
    /** how much heavier B must run on those following days */
    minLift: 0.7,
  },

  /** Rule 3 — cycle-phase pattern, cycling and irregular only */
  cycle: {
    /** the window before a period start, in days */
    windowDays: 4,
    /** logged days needed inside a window for it to count as observed */
    minDaysInWindow: 2,
    /** observed windows needed before we will say anything */
    minObserved: 2,
    /** and how many of them must show the lift */
    minHits: 2,
    /** how much heavier the window runs than the rest of her month */
    minLift: 0.6,
  },

  /** Rule 4 — a quiet stretch worth noticing */
  streak: {
    /** shortest stretch we will mention */
    minDays: 5,
    /** "barely there" or below counts as quiet, for burden symptoms */
    quietAtOrBelow: 1,
    /** "mostly" or above counts as good, for the positive symptom */
    goodAtOrAbove: 2,
  },

  /** Rule 5 — the honest not-yet */
  notYet: {
    /** below this many logged days, say plainly that it is too early */
    enoughDays: 21,
  },
} as const;
