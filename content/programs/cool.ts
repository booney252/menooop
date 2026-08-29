import { FOR_REPLACEMENT, placeholderWeek, type ProgramContent } from "./types";

/**
 * Cool — six weeks of guided deep relaxation for hot flashes and night sweats.
 * Modelled on the self-administered daily-audio protocols studied in clinical
 * research: one session a day, cooling imagery, deepening relaxation.
 *
 * Days 1 and 8 are written. Everything else is placeholder structure.
 */
export const cool: ProgramContent = {
  id: "cool",
  name: "Cool",
  tagline: "For hot flashes and night sweats",
  weeks: 6,
  minutesPerSession: 15,
  targetSymptoms: ["hot_flashes", "night_sweats"],
  sort: 10,

  what: [
    "Fifteen minutes a day, lying down or sitting somewhere you won’t be interrupted. You listen; that is the whole of it.",
    "Each session guides you into deep relaxation and then works with imagery of coolness — a cold stream, snow, air moving over your skin. Over six weeks the practice gets shorter to reach and easier to hold.",
    "Many women find the flashes bother them less before they notice them happening less often. Both are worth having.",
  ],
  commitment: "About fifteen minutes a day, for six weeks.",

  evidence: [
    FOR_REPLACEMENT,
    "In clinical studies, women who listened to a daily guided relaxation recording of this kind reported large reductions in how much hot flashes disrupted their lives, compared with women who did not.",
    "Most of that research is small, runs for a few weeks, and relies on women reporting their own symptoms — which is also how Marlow measures. It has been studied as a non-hormonal option for women who cannot or would rather not take hormones.",
    "It does not work for everyone, and it is not a substitute for talking to a doctor about your options. Marlow will show you honestly whether your own ratings moved.",
  ],

  arc: [
    "Settling — learning to let go on purpose",
    "Cooling — the imagery that does the work",
    "Deepening — getting there faster",
    "In the moment — using it when a flash starts",
    "Carrying it — into the day, into the night",
    "Yours — making the practice your own",
  ],

  sessions: [
    {
      day: 1,
      kind: "audio",
      minutes: 15,
      title: "Settling, day 1",
      ref: "w1d1",
      status: "final",
      intro:
        "Lie down somewhere you won’t be interrupted. Nothing to learn today — you only have to listen.",
      cards: [
        "That’s day one done. Nothing is supposed to have happened yet.",
        "The first week is only teaching your body that it can let go on purpose. The cooling work starts next week.",
      ],
    },
    ...placeholderWeek(2, 1, "audio", 15, "Settling").slice(0, 6).map((s, i) => ({
      ...s,
      day: i + 2,
      title: `Settling, day ${i + 2}`,
      ref: `w1d${i + 2}`,
    })),
    {
      day: 8,
      kind: "audio",
      minutes: 15,
      title: "Cooling, day 1",
      ref: "w2d1",
      status: "final",
      intro:
        "Same as last week to begin with. Then something new: somewhere cold, described in enough detail that your body half believes it.",
      cards: [
        "Some women feel a physical shift the first time. Some feel nothing for a fortnight. Neither means it’s working or not working.",
        "The cold place is yours to keep. You’ll come back to it all week.",
      ],
    },
    ...placeholderWeek(9, 2, "audio", 15, "Cooling").slice(0, 6).map((s, i) => ({
      ...s,
      day: i + 9,
      title: `Cooling, day ${i + 2}`,
      ref: `w2d${i + 2}`,
    })),
    ...placeholderWeek(15, 3, "audio", 15, "Deepening"),
    ...placeholderWeek(22, 4, "audio", 15, "In the moment"),
    ...placeholderWeek(29, 5, "audio", 15, "Carrying it"),
    ...placeholderWeek(36, 6, "audio", 15, "Yours"),
  ],
};
