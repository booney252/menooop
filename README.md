# Marlow

A perimenopause companion, built mobile-first as a design and concept MVP.
Next.js + Tailwind, seeded mock data, no backend, no auth, no database.

Five screens, nothing more: onboarding, today, daily check-in, patterns, and
the doctor report. AI chat, community and a supplement store are deliberately
absent — the only nod to them is one quiet line on Today.

```bash
npm install
npm run dev        # http://localhost:3000 — build at 390px
```

The app opens at `/`, which sends you to onboarding the first time and to
`/today` after that. Answers live in `localStorage` under `marlow.v1`; clearing
site data resets the demo.

## What's seeded

`lib/seed.ts` generates sixty days of realistic history from a deterministic
PRNG, so Patterns and the report look specific rather than empty. The seed
carries three stories on purpose:

- anxiety clusters in the five days before each period,
- brain fog drops sharply twenty-four days ago, when magnesium started,
- sleep has been quiet for the past week.

`lib/insights.ts` reads those back out of the data rather than hard-coding
them, so the copy stays true if you change the symptoms during onboarding —
the history is rebuilt for whatever she picks.

## Design

`DESIGN.md` carries the palette, type and the signature device. The short
version: warm dark stoneware, one fig accent, and every quantity in the app
rendered as depth of a single pigment.

## Screens and print

`scripts/screenshots.mjs` drives the flows and writes 390px screenshots.
`scripts/print-check.mjs` renders the report under print media and reports its
height — it needs to stay under about 1030px to land on one A4 sheet.

```bash
npm run build && npx next start -p 3100
node scripts/screenshots.mjs ./screenshots
node scripts/print-check.mjs ./screenshots/report-print.png
```
