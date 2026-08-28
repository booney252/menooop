# Getting Marlow onto a real site

About an hour, most of it waiting. Two accounts (Supabase, Vercel), plus an
Anthropic key if you want Ask Marlow to answer.

Work through it in order. The four places people lose an afternoon are marked
**gotcha** — read those even if you skip the rest.

---

## 1. Supabase — the database

1. Create a project at supabase.com. Any region near your users. Save the
   database password somewhere; you will not need it for this, but you will
   later.
2. Open **SQL Editor** → New query. Paste the entire contents of
   `supabase/migrations/20260101000000_init.sql` and run it. It should finish
   with no errors and no output.
3. Open **Table Editor** and check you have: profiles, symptoms, checkins,
   checkin_symptoms, interventions, insights, chat_messages, reports, events.
   The `symptoms` table should already have 11 rows.
4. Open **Project Settings → API keys** and copy the two keys:
   - **Publishable key**, `sb_publishable_…` — safe in a browser. Row-level
     security is what protects the data, not this key.
   - **Secret key**, `sb_secret_…` — click the eye to reveal it. This one
     bypasses all security. Server only, never in a browser, never committed.

   Then **Project Settings → Data API** for the **Project URL**, which looks
   like `https://abcdefghijklmnop.supabase.co`. It is on a different page from
   the keys, which is easy to miss.

   > On older projects these were called the `anon` and `service_role` keys.
   > Same things, renamed. Marlow accepts either naming.

> **Gotcha — email limits.** Supabase's built-in email sender is capped at a
> couple of messages an hour on the free tier. Marlow signs people in with
> magic links, so with the built-in sender your third beta user of the morning
> silently gets nothing. Before you invite anyone: **Authentication → Emails →
> SMTP Settings**, and plug in a real sender. Resend's free tier (3,000/month)
> is enough and takes ten minutes, including verifying a domain you own. Then
> raise **Authentication → Rate Limits → emails per hour** to something sane
> like 60.

---

## 2. Anthropic — Ask Marlow

Get an API key at console.anthropic.com and put a small amount of credit on it.
Marlow uses `claude-opus-5` at low effort with short replies, so a beta of a few
dozen people is a few dollars a month, not hundreds. The daily cap is 40
messages per user, set in `app/api/chat/route.ts`.

Skip this if you like — the app runs fine without it and Ask says plainly that
it cannot answer.

---

## 3. Vercel — the site

1. vercel.com → Add New → Project → import `booney252/menooop`.
2. Set the production branch to `claude/perimenopause-app-mvp-do627b` (Settings
   → Git), or merge that branch into `main` first and deploy that.
3. Add environment variables, all for **Production, Preview and Development**:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | the Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
   | `SUPABASE_SECRET_KEY` | `sb_secret_…` |
   | `ANTHROPIC_API_KEY` | from step 2, if you did it |
   | `NEXT_PUBLIC_SITE_URL` | your final URL, e.g. `https://marlow.app` |
   | `MARLOW_FOUNDER_EMAILS` | your email, for `/admin` |

4. Deploy.

> **Gotcha — `NEXT_PUBLIC_SITE_URL`.** Set it explicitly, to the domain people
> will actually use. If you leave it out, Marlow falls back to Vercel's
> per-deployment URL, which changes on every push — so magic links will point at
> a deployment from last Tuesday and sign-in will look broken for no visible
> reason.

> **Gotcha — never set `MARLOW_PREVIEW` in production.** It switches on
> `/preview`, the fixture-rendered design harness. The route refuses to render
> on a Vercel production deployment even if the flag is set, but do not rely on
> that. It belongs in `.env.local` only.

---

## 4. Point Supabase back at the site

**Authentication → URL Configuration**:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: add `https://your-domain.com/auth/callback`, and
  `http://localhost:3000/auth/callback` so local development still works.

> **Gotcha — this is the one everyone hits.** Without the callback URL in the
> allow-list, the magic link email arrives, looks perfect, and dumps her on an
> error page. There is no warning anywhere that this is why.

---

## 5. Check it works

In this order, because each one depends on the last:

1. Open the site. You should land on the sign-in door, not `/setup`. If you see
   "Not connected yet", the Supabase variables did not reach the build.
2. Enter your own email. The link should arrive within a minute and sign you in.
3. Complete onboarding, then do a check-in.
4. Open **Patterns**. With one day logged you should see the honest not-yet
   insight — "Nothing conclusive yet" — not an empty screen and not a fabricated
   pattern.
5. Open **Ask** and ask something. If it answers, the Anthropic key is live.
6. Open `/admin`. If you get a 404, `MARLOW_FOUNDER_EMAILS` does not match the
   address you signed in with.
7. Open **Settings → Download everything**. You should get a JSON file.

---

## 6. Seed a demo account for filming

So you can screen-record Patterns and the Report without using a beta user's
real data:

```bash
npm run seed:demo -- demo@your-domain.com
```

Needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` in your local
`.env.local`. It writes sixty days of realistic history and refuses to touch any
account not tagged as a demo. Sign in as that address to see it.

---

## 7. Optional: the daily email nudge

Only worth doing once you have people using it.

1. Set `RESEND_API_KEY`, `MARLOW_FROM_EMAIL` (a verified sender) and
   `CRON_SECRET` (any long random string) on Vercel.
2. Something has to call `/api/cron/nudge` every hour, so each person is caught
   at the hour she picked. `.github/workflows/nudge.yml` does this for free —
   add `MARLOW_SITE_URL` and `CRON_SECRET` as repository secrets and it starts
   running.
3. On Vercel Pro you can use Vercel's own cron instead. Add to `vercel.json`:

   ```json
   "crons": [{ "path": "/api/cron/nudge", "schedule": "0 * * * *" }]
   ```

   Do not add this on the Hobby plan — Hobby cron only runs once a day, and a
   more frequent schedule fails the deploy.

Without any of this the endpoint is inert and nothing breaks.

---

## Before you invite anyone

- [ ] Custom SMTP configured, or magic links will quietly stop after two or
      three users an hour.
- [ ] `npm run db:verify` passes on your machine — it proves one account cannot
      read another's rows.
- [ ] You have signed in, checked in, and generated a report as a real user.
- [ ] `/privacy` says something true about what you actually do with the data.
      It currently promises no selling, no sharing, no third-party tracking, and
      a real delete. Keep it true or change it.
- [ ] Deleting a test account from Settings actually empties its rows. Check in
      the Supabase table editor.

## Costs, roughly

Supabase free tier and Vercel Hobby will carry a beta of this size. Resend's
free tier covers the email. Anthropic is the only thing that costs real money,
and it scales with how much people talk to Marlow, not with how many sign up.
