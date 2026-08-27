# Marlow

A perimenopause companion, built mobile-first as a design and concept MVP.
Next.js + Tailwind, seeded mock data, no backend, no auth, no database.

Six screens: onboarding, today, daily check-in, Ask (chat with Marlow),
patterns, and the doctor report. Community and a supplement store are still
deliberately absent.

```bash
npm install
cp .env.example .env.local   # optional — add ANTHROPIC_API_KEY for live chat
npm run dev                  # http://localhost:3000 — build at 390px
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

## Ask — the chat

Marlow is the app and Marlow is the assistant; on the Ask tab she is who you
are talking to. It runs on the Claude API (`claude-opus-5`) through
`app/api/chat/route.ts`, streaming the reply back as plain text.

Two things make it more than a generic chat window:

- **Her record is in the prompt.** `buildContext()` in `lib/chat.ts` turns the
  sixty days into plain sentences — how often each symptom was felt, what is
  easing, the pre-period clustering, what she is taking — and sends it as a
  second system block after the stable brief. So Marlow answers about *her*
  numbers, not about perimenopause in general.
- **The brief is the product.** `lib/marlow-prompt.ts` holds what "menopause
  trained" actually means here: a domain brief (why bloods are unreliable in
  perimenopause, the real symptom range, transdermal oestradiol and micronised
  progesterone, vaginal oestrogen, non-hormonal options, what the evidence says
  about supplements), the voice rules, and hard boundaries — no diagnosing, no
  dosing, and an explicit red-flag list that sends her to urgent care and stops.

Request shape: adaptive thinking at `low` effort, so answers stay careful but
the first token arrives at chat speed; server-side refusal fallbacks are
enabled, so a safety decline is retried on a fallback model inside the same
call rather than dead-ending; the stable brief carries a cache breakpoint.

**Without an API key** the route streams from a small set of scripted answers
in `lib/marlow-prompt.ts` and the Ask screen says so in plain words. The demo
never pretends a canned reply is a live one.

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
