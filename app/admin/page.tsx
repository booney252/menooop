import { notFound } from "next/navigation";
import { founderEmails } from "@/lib/env";
import { currentUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString();
const weekKey = (d: Date) => {
  const monday = new Date(d);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
};

type Row = { user_id: string; name: string; created_at: string };

export default async function Admin() {
  const user = await currentUser();
  const allowed = founderEmails();
  if (!user?.email || !allowed.includes(user.email.toLowerCase())) notFound();

  const admin = supabaseAdmin();
  const now = Date.now();

  const [{ data: profiles }, { data: events }] = await Promise.all([
    admin.from("profiles").select("id, created_at, onboarded_at"),
    admin.from("events").select("user_id, name, created_at").gte(
      "created_at",
      iso(new Date(now - 120 * DAY))
    ),
  ]);

  const people = (profiles ?? []) as { id: string; created_at: string; onboarded_at: string | null }[];
  const log = (events ?? []) as Row[];

  const signups = people.filter((p) => p.onboarded_at).length;

  const checkins = log.filter((e) => e.name === "checkin_completed");
  const reports = log.filter((e) => e.name === "report_generated").length;

  const activeToday = new Set(
    checkins.filter((e) => now - Date.parse(e.created_at) < DAY).map((e) => e.user_id)
  ).size;

  const activeWeek = new Set(
    checkins.filter((e) => now - Date.parse(e.created_at) < 7 * DAY).map((e) => e.user_id)
  );
  const weekCheckins = checkins.filter((e) => now - Date.parse(e.created_at) < 7 * DAY).length;
  const completion = activeWeek.size ? weekCheckins / (activeWeek.size * 7) : 0;

  // ── weekly cohorts ────────────────────────────────────────────────────────
  const byUser = new Map<string, number[]>();
  for (const e of checkins) {
    const list = byUser.get(e.user_id) ?? [];
    list.push(Date.parse(e.created_at));
    byUser.set(e.user_id, list);
  }

  const cohorts = new Map<
    string,
    { size: number; d7: number; d28: number; matureD7: number; matureD28: number }
  >();

  for (const p of people) {
    if (!p.onboarded_at) continue;
    const joined = Date.parse(p.created_at);
    const key = weekKey(new Date(joined));
    const c = cohorts.get(key) ?? { size: 0, d7: 0, d28: 0, matureD7: 0, matureD28: 0 };
    c.size++;

    const age = (now - joined) / DAY;
    const stamps = byUser.get(p.id) ?? [];
    const returnedAfter = (days: number) => stamps.some((t) => (t - joined) / DAY >= days);

    if (age >= 7) {
      c.matureD7++;
      if (returnedAfter(7)) c.d7++;
    }
    if (age >= 28) {
      c.matureD28++;
      if (returnedAfter(28)) c.d28++;
    }
    cohorts.set(key, c);
  }

  const rows = [...cohorts.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 10);
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

  return (
    <div className="min-h-dvh bg-ink px-7 py-16">
      <div className="mx-auto max-w-[42rem]">
        <h1 className="display text-[28px] text-bone">Marlow, internally</h1>
        <p className="mt-3 text-[14.5px] text-dune">
          Week-4 retention is the number that matters. Everything else is context.
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
          <Stat label="Signups" value={String(signups)} />
          <Stat label="Checked in today" value={String(activeToday)} />
          <Stat label="Reports generated" value={String(reports)} />
          <Stat
            label="Check-in rate, 7d"
            value={pct(weekCheckins, activeWeek.size * 7)}
            note="check-ins ÷ active users × 7"
          />
          <Stat label="Active this week" value={String(activeWeek.size)} />
        </dl>

        <h2 className="label mt-14 mb-4">Retention by signup week</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14.5px]">
            <thead>
              <tr className="border-b hair text-[12px] tracking-[0.1em] text-dune uppercase">
                <th className="py-2 pr-4 font-medium">Week</th>
                <th className="py-2 pr-4 font-medium">Signups</th>
                <th className="py-2 pr-4 font-medium">Day 7</th>
                <th className="py-2 font-medium">Day 28</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-dune">
                    Nobody has signed up yet.
                  </td>
                </tr>
              )}
              {rows.map(([week, c]) => (
                <tr key={week} className="border-b hair text-[#ded3c7]">
                  <td className="py-2.5 pr-4">{week}</td>
                  <td className="py-2.5 pr-4">{c.size}</td>
                  <td className="py-2.5 pr-4">{pct(c.d7, c.matureD7)}</td>
                  <td className="py-2.5">{pct(c.d28, c.matureD28)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-dune">
          A cohort only counts toward a column once it is old enough to have reached it. Day 7
          means she checked in on day 7 or later, not on that exact day.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="display mt-1.5 text-[27px] text-bone">{value}</dd>
      {note && <p className="mt-1 text-[12px] text-dune">{note}</p>}
    </div>
  );
}
