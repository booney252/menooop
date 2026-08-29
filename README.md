# Marlow

A perimenopause companion. Mobile-first web app, installable as a PWA.
Next.js (App Router) + Tailwind + Supabase (auth and Postgres with row-level
security) + the Claude API for Ask Marlow. Deploys on Vercel.

The architecture is deliberately boring, because one person maintains it.

```bash
npm install
cp .env.example .env.local        # fill in Supabase, at minimum
npm run dev                       # http://localhost:3000 — build at 390px
```

**Putting it on a real site: see `DEPLOY.md`.**

## Getting a database

1. Create a Supabase project.
2. Apply `supabase/migrations/*.sql` in order (SQL editor, or `supabase db push`).
3. Put the project URL and anon key in `.env.local`, and the service role key
   too — deletion, the admin page and the demo seed need it.
4. Add `<your-site>/auth/callback` to Supabase's redirect allow-list, under
   Authentication → URL Configuration. Magic links silently fail without it.

## Verifying it before you trust it

```bash
npm test         # the insight engine: 19 assertions, mostly about staying quiet
npm run db:verify   # applies the migrations to a local Postgres, then attacks the RLS
npm run build
```

`db:verify` is the one worth knowing about. It applies the real migrations to a
throwaway database, then signs in as one user and tries to read, write, update
and delete another user's rows. Every attempt has to fail. It also checks that
deleting the auth user leaves nothing behind. See `supabase/local/README.md`,
including how to break a policy on purpose and confirm the suite still catches
it.

## How it fits together

| Path | What it is |
| --- | --- |
| `supabase/migrations` | The schema. RLS on every table holding user rows. |
| `lib/insights/` | The engine. `constants.ts` holds every threshold. |
| `lib/data/` | Server-only reads. Everything goes through RLS as her. |
| `app/actions/` | Server actions — all writes. |
| `app/*/​*View.tsx` | Presentational components, fed by the route above them. |
| `lib/marlow-prompt.ts` | What "menopause trained" actually means here. |
| `lib/preview.ts`, `app/preview/` | Design harness. Off unless `MARLOW_PREVIEW=1`. |

Views take data as props and never fetch. That is what lets the preview harness
render every screen from fixtures, which is how the screenshots get taken
without a database.

## The insight engine

Rule-based, no ML. It emits **at most one new insight a day**, chosen by
priority, and stores a `dedupe_key` so nothing repeats. Five rules:

1. **Intervention response** — a symptom's average in the 14 days after an
   intervention started, against the 14 before. Needs 8 logged days each side
   and a shift of 0.75 on the 0–3 scale.
2. **Lag effect** — a rough day for one symptom, then a heavier day for another.
   Needs 21 consecutive-day pairs and 5 rough days.
3. **Cycle phase** — a symptom that lifts in the days before a period, across
   at least two observed cycles. Cycling and irregular only.
4. **Positive streak** — the current quiet stretch, celebrated once per stretch
   rather than every day it continues.
5. **Honest not-yet** — under 21 logged days, it says so and says how much
   longer, rather than padding.

Every threshold is in `lib/insights/constants.ts` with a comment. The bias is
toward silence: near a threshold, it does not fire. The tests are mostly
adversarial — flat data, one cycle, thin windows — because the failure that
matters is not a crash, it is saying something her data does not support.

It also avoids serving the same *kind* two days running when it has an
alternative, so she does not get four intervention comparisons in a row.

## The Relief Loop

Programs she runs on herself: match, deliver, prove.

One generic system — `programs`, `program_sessions`, `enrollments`,
`session_completions`, `outcomes` — with the three launch tracks as content on
top. A supplement, when there is one, becomes another intervention on the same
rails.

**Match.** `lib/programs/match.ts` reads her own record. It needs a fortnight
of check-ins, then picks the track whose target symptom is noticeable-or-worse
on the biggest share of her days; a tie at the top goes to Steady, because a
tie is what Steady is for. The card on Today is dismissible and stays away for
four weeks. Matching is a recommendation, never a gate — she can browse and
self-enroll in any of them, one at a time.

**Deliver.** `/programs/[id]/session/[day]`. Audio sessions get a filling arc,
text sessions get paced cards, and both end with one tap: helped, neutral, not
for me. Missing days do nothing at all. Audio resolves at
`/audio/{program}/{ref}.mp3`, and a session whose file is not in yet says so
and still lets her mark it done.

**Prove.** Enrolling writes an intervention row, so the before/after machinery
that already exists treats a program exactly like magnesium. `computeOutcome`
compares the fortnight before enrollment with the fortnight at the end, and a
null result is a first-class verdict with its own sentence. Outcomes are
persisted and flow into the doctor report automatically.

### Where the copy lives

`content/programs/*.ts`. Structure is in the database, the words are here, and
`npm run gen:sessions` regenerates the seed so the two cannot drift. Anything
not yet through claims review is marked `FOR_REPLACEMENT` and the tests check
that it still is.

`tests/programs.test.ts` runs a regex over every string a user could read,
looking for treat, cure, therapy, clinically proven and the rest. It also
checks each track states the limits of its evidence, and that the outcome
engine cannot be talked into calling a null result a success. Break a rule and
it fails — that was checked by breaking one on purpose.

## Ask Marlow

`app/api/chat/route.ts`. `claude-opus-5`, streaming, adaptive thinking at low
effort so the first token still arrives at chat speed. Server-side refusal
fallbacks are on. The stable system prompt carries a cache breakpoint.

Two things make it more than a chat window:

- **It is grounded.** `buildSummary()` turns her last sixty days into plain
  sentences — per-symptom frequency, what is easing, active interventions,
  cycle position, what Marlow has already told her — and sends it as a second
  system block. Built entirely server-side; the browser never says what her
  record contains.
- **The rails are in the prompt, and one is not.** No diagnosing, no telling
  her to start or stop a medication, no interpreting labs, and a red-flag list
  that stops the conversation and sends her to a doctor. Self-harm is the
  exception: `lib/safety.ts` matches it before the API is called at all and
  returns fixed text with crisis numbers. That one is too important to leave to
  a generation.

Rate limited to 40 messages per user per day. Without `ANTHROPIC_API_KEY` the
app still runs; Ask says plainly that it cannot answer.

## Analytics

`events` is write-only for users and read only by the service role. It stores
counts, never content — that a check-in happened and how long it took, never
what she logged. `/admin` is gated on `MARLOW_FOUNDER_EMAILS` and 404s for
everyone else. Week-4 retention is the number the business runs on; the rest is
context.

## The demo account

```bash
npm run seed:demo -- demo@yourdomain.com
```

Sixty days of deterministic, realistic history so Patterns and Report can be
filmed without touching a beta user's data. It refuses to overwrite an account
that is not tagged as a demo. The same generator feeds the engine tests and the
design preview.

## Screenshots

```bash
npm run build && MARLOW_PREVIEW=1 npx next start -p 3100
node scripts/screenshots.mjs ./screenshots     # 12 screens at 390px
node scripts/print-check.mjs ./screenshots/print.png
```

`print-check` reports the report's rendered height under print media. It has to
stay under about 1030px to land on one A4 sheet.

## Not in v1, on purpose

Payments, forecasting, stage orientation cards, the shareable monthly card,
micro-education, community, push notifications. The seams are clean: an
optional daily email nudge is wired (`/api/cron/nudge`, hourly, no-ops without
`RESEND_API_KEY`), and the PWA is installable so push can be added later.

The service worker keeps the app opening offline and serves pages she has
already visited. It does **not** queue a check-in written offline — saving
needs the server, and silently holding her answers in a cache we might lose is
worse than telling her it did not save.
