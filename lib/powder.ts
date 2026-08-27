/* ─────────────────────────────────────────────────────────────
   Marlow Evening Powder — the formula, and the argument for it.

   Onset is stored in days and plotted on a square-root scale, so
   the first fortnight gets the room it deserves instead of being
   crushed against the left edge by twelve weeks of creatine.
   ───────────────────────────────────────────────────────────── */

const HORIZON = 84; // twelve weeks — the far end of the axis
const pos = (days: number) => Math.sqrt(days) / Math.sqrt(HORIZON);

export type Ingredient = {
  name: string;
  dose: string;
  does: string;
  onset: string;
  days: number;
};

/* Ordered by onset, not by size. The dots then descend the page as a
   staircase, which is the whole point of the section. */
export const INGREDIENTS: Ingredient[] = [
  {
    name: "L-theanine",
    dose: "200mg",
    does: "Calm within the hour.",
    onset: "Felt the first night",
    days: 0.04,
  },
  {
    name: "Magnesium bisglycinate",
    dose: "200mg",
    does: "Eases the wind-down.",
    onset: "Felt within days",
    days: 3,
  },
  {
    name: "Glycine",
    dose: "3g",
    does: "Deeper sleep, clearer mornings.",
    onset: "Felt within days",
    days: 3,
  },
  {
    name: "KSM-66 ashwagandha",
    dose: "600mg",
    does: "Turns down the stress volume.",
    onset: "Felt in 1–2 weeks",
    days: 10.5,
  },
  {
    name: "Saffron (affron)",
    dose: "28mg",
    does: "Steadier mood.",
    onset: "Felt by week 4",
    days: 28,
  },
  {
    name: "Creatine monohydrate",
    dose: "5g",
    does: "Strength, body, brain.",
    onset: "Builds over 8–12 weeks",
    days: 70,
  },
];

/* The magnesium dose is elemental, and saying so is the kind of detail
   the whole brand rests on. Kept out of the table so the column stays
   scannable; printed underneath it instead. */
export const DOSE_NOTE = "Magnesium is 200mg elemental, not 200mg of the salt.";

export const AXIS = [
  { label: "Tonight", days: 0 },
  { label: "Week 1", days: 7 },
  { label: "Week 4", days: 28 },
  { label: "Week 12", days: 84 },
];

export const at = (days: number) => pos(days);

export type Omission = { name: string; why: string };

export const OMISSIONS: Omission[] = [
  {
    name: "Black cohosh",
    why: "The evidence is a coin flip. Half the trials show something, half show nothing, and we are not going to charge you for a coin flip.",
  },
  {
    name: "Soy isoflavones and other estrogen-mimicking botanicals",
    why: "They act like estrogen in the body. Whether that is right for you is a decision for you and your doctor, not something to make by buying a powder.",
  },
  {
    name: "GABA",
    why: "Taken by mouth it barely reaches the brain. It sounds like the answer and mostly never gets past the door.",
  },
  {
    name: "Apigenin",
    why: "No human trials at the doses supplements use. A promising idea is not the same as a tested one.",
  },
  {
    name: "Tart cherry",
    why: "The studied dose is about two glasses of juice. That does not fit in a scoop, and a dusting of it does nothing.",
  },
  {
    name: "Melatonin",
    why: "It is a circadian drug, not a nightly ritual. It shifts your body clock, which is right for jet lag and wrong for most nights.",
  },
];

export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: "When will I feel something?",
    a: "The first night, if you are going to feel the theanine — it works within the hour. Magnesium and glycine settle in over a few days. Ashwagandha takes a week or two, saffron about four weeks, and creatine builds over two to three months. Nothing here is instant, and the honest answer is that the ingredients you notice fastest are not the ones doing the most work.",
  },
  {
    q: "Can I take it with HRT?",
    a: "Nothing in the formula is a hormone, and nothing in it is intended to replace hormone therapy. Plenty of women take both. But that is a conversation for you and your prescriber, not for a website — bring them the label and let them tell you.",
  },
  {
    q: "What does it taste like?",
    a: "Faintly berry, barely sweet. Glycine is naturally sweet on its own, so there is very little added. It dissolves clean in cold water without grit at the bottom of the glass.",
  },
  {
    q: "Is there melatonin in it?",
    a: "No, and that is deliberate. Melatonin shifts your body clock rather than helping you wind down — genuinely useful for jet lag or shift work, and the wrong tool for a nightly ritual. We would rather help you settle than move your clock every night for months.",
  },
  {
    q: "Why a powder instead of capsules?",
    a: "The doses. Glycine at 3g and creatine at 5g would be eight or nine capsules a night on their own, before the rest of the formula. Most brands solve that by cutting the dose to fit the capsule. We would rather you had a glass.",
  },
  {
    q: "Who shouldn’t take it?",
    a: "Consult your healthcare provider if pregnant or trying to conceive, if you have liver, kidney or thyroid conditions, or take antidepressants, thyroid medication, sedatives, or hormone therapy.",
  },
];

export const EXPECT = [
  {
    when: "The first nights",
    what: "A softer wind-down. The edges come off the hour before bed. Theanine is working within the hour; magnesium and glycine settle in over a few days.",
  },
  {
    when: "By week 4",
    what: "Mood tends to steady. Saffron and ashwagandha both need about this long — there is no version of them that works faster.",
  },
  {
    when: "By week 12",
    what: "Strength and body composition, if you are training at all. Creatine builds slowly and only alongside the work you are already doing.",
  },
];
