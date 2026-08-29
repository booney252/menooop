import { FOR_REPLACEMENT, placeholderWeek, type ProgramContent } from "./types";

/**
 * Rest — four weeks for broken sleep and 3am waking. Short evening wind-downs
 * plus the behavioural pieces from the sleep-retraining approach studied in
 * clinical research: a fixed wake time, getting out of bed when awake, and a
 * plan for three in the morning.
 *
 * Days 1 and 15 are written. Everything else is placeholder structure.
 */
export const rest: ProgramContent = {
  id: "rest",
  name: "Rest",
  tagline: "For broken sleep and 3am waking",
  weeks: 4,
  minutesPerSession: 8,
  targetSymptoms: ["sleep"],
  sort: 20,

  what: [
    "Five to ten minutes each evening. A short wind-down to listen to, and one small thing to change about how you do the night.",
    "The changes are the part that works, and they are not what most people expect. A fixed time to get up, whatever kind of night it was. Getting out of bed when you have been awake a while. A plan for three in the morning that isn’t lying there.",
    "The first fortnight can feel worse before it feels better. That is normal and the sessions say so as they go.",
  ],
  commitment: "Five to ten minutes an evening, for four weeks.",

  evidence: [
    FOR_REPLACEMENT,
    "The behavioural sleep approach these sessions are built from is the one most consistently supported in research for long-running insomnia, including in women going through menopause, and it holds up better over time than sleeping tablets.",
    "It is usually studied with a practitioner rather than as a self-guided course, so a course like this one asks more of you and may do less. It also asks for changes that are genuinely hard in the first fortnight.",
    "If your sleep is broken mainly by night sweats, Cool may be the better place to start, and there is nothing stopping you doing this one afterwards.",
  ],

  arc: [
    "A wake anchor — one fixed point in the day",
    "The bed is for sleeping — and nothing else",
    "Three in the morning — what to do instead of lying there",
    "Keeping it — when to hold the changes, when to let them go",
  ],

  sessions: [
    {
      day: 1,
      kind: "audio",
      minutes: 8,
      title: "A wake anchor, day 1",
      ref: "w1d1",
      status: "final",
      intro:
        "Tonight is mostly listening. There is one thing to decide at the end, and it is the single most useful thing in the whole four weeks.",
      cards: [
        "Choose the time you will get up tomorrow, and keep it whatever kind of night you have.",
        "Not a bedtime. A get-up time. Bedtimes move on their own once the mornings hold still.",
        "It will feel like the wrong way round for about a week.",
      ],
    },
    ...placeholderWeek(2, 1, "audio", 8, "A wake anchor").slice(0, 6).map((s, i) => ({
      ...s,
      day: i + 2,
      title: `A wake anchor, day ${i + 2}`,
      ref: `w1d${i + 2}`,
    })),
    ...placeholderWeek(8, 2, "audio", 8, "The bed is for sleeping"),
    {
      day: 15,
      kind: "text",
      minutes: 6,
      title: "Three in the morning",
      ref: "w3d1",
      status: "final",
      intro: "Read this one now, while it is still light and you are still reasonable.",
      cards: [
        "You will wake. That is not the problem. The problem is the twenty minutes after, when you lie there doing sums about how tired you will be.",
        "The rule is: if you are properly awake and it has been a while, get up. Go somewhere dim. Do something undemanding and boring until you are heavy again. Then go back.",
        "It feels absurd at three in the morning. Do it anyway, and do it every time. You are teaching your body that the bed is not where you lie awake.",
        "Have the dim room and the boring thing decided in advance. Nobody makes a good plan at 3am.",
        "One more thing: no clock. Turn it away from you, or leave the phone in the other room. Knowing the time only ever makes it worse.",
      ],
    },
    ...placeholderWeek(16, 3, "text", 6, "Three in the morning").slice(0, 6).map((s, i) => ({
      ...s,
      day: i + 16,
      title: `Three in the morning, day ${i + 2}`,
      ref: `w3d${i + 2}`,
    })),
    ...placeholderWeek(22, 4, "audio", 8, "Keeping it"),
  ],
};
