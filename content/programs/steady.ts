import { FOR_REPLACEMENT, placeholderWeek, type ProgramContent } from "./types";

/**
 * Steady — four weeks of menopause-adapted skills for mood, anxiety and a
 * short fuse. Text-first micro-lessons with short optional audio.
 *
 * Days 1 and 8 are written. Everything else is placeholder structure.
 */
export const steady: ProgramContent = {
  id: "steady",
  name: "Steady",
  tagline: "For mood, anxiety and a short fuse",
  weeks: 4,
  minutesPerSession: 7,
  targetSymptoms: ["low_mood", "anxiety", "irritability"],
  sort: 30,

  what: [
    "Five to eight minutes a day, mostly reading, with a short practice at the end. You can do it on the train.",
    "It works on the loop between what a symptom does and what you then think about yourself — the flash that arrives in a meeting and the thought that you are losing your grip. The thought makes the next one worse.",
    "None of it says the symptoms are in your head. They are not. It works on the part that is reachable.",
  ],
  commitment: "Five to eight minutes a day, for four weeks.",

  evidence: [
    FOR_REPLACEMENT,
    "Skills-based courses adapted for menopause have been studied for mood, anxiety and how much symptoms bother women day to day, and they generally show improvement in bother and mood.",
    "The effect on how often symptoms happen is smaller than the effect on how much they get to you — which is a real result, not a disappointing one, and worth knowing before you start.",
    "This is a self-guided course. If your mood has been low for weeks, or you have stopped enjoying things you used to, that is worth a conversation with your doctor rather than a course in an app.",
  ],

  arc: [
    "The loop — how a symptom becomes a thought about yourself",
    "Catching it — noticing the thought before it lands",
    "Turning it — what else could be true",
    "Practising — making it automatic",
  ],

  sessions: [
    {
      day: 1,
      kind: "text",
      minutes: 7,
      title: "The loop, day 1",
      ref: "w1d1",
      status: "final",
      intro: "Five minutes of reading. One thing to notice today.",
      cards: [
        "A hot flash starts in a meeting. That is the symptom. What happens next is a second thing: everyone can see, I look a mess, I am losing my grip.",
        "The second thing is the part that ruins the afternoon. It also makes the next flash more likely, because a body braced for something is a body running hot.",
        "This is not a claim that your symptoms are imagined. They are not. It is that there are two things happening and only one of them is reachable.",
        "Today, nothing to change. Just notice, once, the gap between the thing and the thought about the thing.",
        "Most women find there is a stock sentence that shows up every time. Yours will be familiar by the end of the week.",
      ],
    },
    ...placeholderWeek(2, 1, "text", 7, "The loop").slice(0, 6).map((s, i) => ({
      ...s,
      day: i + 2,
      title: `The loop, day ${i + 2}`,
      ref: `w1d${i + 2}`,
    })),
    {
      day: 8,
      kind: "text",
      minutes: 7,
      title: "Catching it, day 1",
      ref: "w2d1",
      status: "final",
      intro: "You have a week of noticing behind you. Now we do something with it.",
      cards: [
        "Write down the sentence. The actual one, in your words, not a tidied-up version. “I am losing my grip” beats “I felt a bit anxious.”",
        "Now the question that does the work, and it is not “is that true”. It is: what else could also be true?",
        "Not positive thinking. You are not telling yourself it is fine. You are looking for the other true things that got crowded out.",
        "I am losing my grip — and I ran that meeting, and nobody said anything, and I have had four bad nights, and this passes in ninety seconds.",
        "Do it once today, in writing. It works far less well in your head, which is where the original sentence lives.",
      ],
    },
    ...placeholderWeek(9, 2, "text", 7, "Catching it").slice(0, 6).map((s, i) => ({
      ...s,
      day: i + 9,
      title: `Catching it, day ${i + 2}`,
      ref: `w2d${i + 2}`,
    })),
    ...placeholderWeek(15, 3, "text", 7, "Turning it"),
    ...placeholderWeek(22, 4, "text", 7, "Practising"),
  ],
};
