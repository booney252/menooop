/**
 * Seeds a demo account with sixty days of realistic history, so Patterns and
 * the Report can be filmed without touching anyone's real data.
 *
 *   npm run seed:demo -- demo@marlow.app
 *
 * Idempotent: re-running wipes that account's check-ins, interventions and
 * insights and lays them down again. It refuses to touch an account that has
 * not been marked as a demo, so it can never be pointed at a beta user.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { demoDays, demoInterventions, DEMO_SYMPTOMS } from "../lib/demo-data";
import { candidates } from "../lib/insights/engine";
import { shiftDay, todayIn } from "../lib/day";
import type { History } from "../lib/types";

for (const file of [".env.local", ".env"]) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run seed:demo -- demo@example.com");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const TIMEZONE = "Europe/London";
const admin = createClient(url, key, { auth: { persistSession: false } });

async function findOrCreateUser(): Promise<string> {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    if (existing.user_metadata?.demo !== true) {
      console.error(
        `${email} exists but is not marked as a demo account. Refusing to overwrite it.`
      );
      process.exit(1);
    }
    return existing.id;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { demo: true },
  });
  if (error || !created.user) {
    console.error("Could not create the demo user:", error?.message);
    process.exit(1);
  }
  return created.user.id;
}

async function main() {
  const userId = await findOrCreateUser();
  const today = todayIn(TIMEZONE);

  await admin
    .from("profiles")
    .upsert({
      id: userId,
      first_name: "Ada",
      stage: "irregular",
      symptoms: DEMO_SYMPTOMS,
      timezone: TIMEZONE,
      onboarded_at: new Date(Date.parse(`${shiftDay(today, -61)}T09:00:00Z`)).toISOString(),
      created_at: new Date(Date.parse(`${shiftDay(today, -61)}T09:00:00Z`)).toISOString(),
    });

  for (const table of ["insights", "interventions", "checkins", "chat_messages", "reports"]) {
    await admin.from(table).delete().eq("user_id", userId);
  }

  const interventions = demoInterventions(today);
  const { data: savedInterventions } = await admin
    .from("interventions")
    .insert(
      interventions.map((i) => ({
        user_id: userId,
        name: i.name,
        started_on: i.started_on,
        ended_on: i.ended_on,
      }))
    )
    .select("id, name, started_on, ended_on");

  const days = demoDays(today);

  for (const day of days) {
    const { data: checkin } = await admin
      .from("checkins")
      .insert({
        user_id: userId,
        local_date: day.day,
        note: day.note,
        good_things: day.goodThings,
        period_started: day.periodStarted,
        duration_ms: 12_000 + Math.round(Math.random() * 6000),
      })
      .select("id")
      .single();
    if (!checkin) continue;

    await admin.from("checkin_symptoms").insert(
      Object.entries(day.severities).map(([symptom_key, severity]) => ({
        checkin_id: checkin.id,
        user_id: userId,
        symptom_key,
        severity,
      }))
    );
  }

  // run the engine the way the app would have, one insight at a time
  const history: History = {
    profile: {
      id: userId,
      first_name: "Ada",
      stage: "irregular",
      symptoms: DEMO_SYMPTOMS,
      timezone: TIMEZONE,
      nudge_enabled: false,
      nudge_hour: null,
      last_nudged_on: null,
      onboarded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    days,
    interventions: (savedInterventions ?? interventions) as History["interventions"],
  };

  const seen = new Set<string>();
  let lastKind: string | null = null;
  let offset = 0;

  for (let i = 0; i < 5; i++) {
    const fresh = candidates(history).filter((c) => !seen.has(c.dedupeKey));
    const pick = fresh.find((c) => c.kind !== lastKind) ?? fresh[0];
    if (!pick) break;
    seen.add(pick.dedupeKey);
    lastKind = pick.kind;
    await admin.from("insights").insert({
      user_id: userId,
      kind: pick.kind,
      subject: pick.subject,
      sentence: pick.sentence,
      detail: pick.detail,
      payload: pick.payload,
      for_date: shiftDay(today, -offset),
      dedupe_key: pick.dedupeKey,
    });
    offset += 3;
  }

  const checkinEvents = days.map((d) => ({
    user_id: userId,
    name: "checkin_completed",
    props: { day: d.day },
    created_at: new Date(Date.parse(`${d.day}T20:00:00Z`)).toISOString(),
  }));
  await admin.from("events").insert(checkinEvents);

  console.log(`Seeded ${email}: ${days.length} check-ins, ${seen.size} insights.`);
  console.log("Sign in with a magic link to that address to see it.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
