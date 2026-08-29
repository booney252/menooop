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

type Row = {
  user_id: string;
  name: string;
  created_at: string;
  props: Record<string, string | number | boolean> | null;
};
type EnrollmentRow = { id: string; program_id: string; status: string; started_on: string };
type OutcomeRow = { enrollment_id: string; delta: number | null; verdict: string };

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export default async function Admin() {
  const user = await currentUser();
  const allowed = founderEmails();
  if (!user?.email || !allowed.includes(user.email.toLowerCase())) notFound();

  const admin = supabaseAdmin();
  const now = Date.now();

  const [{ data: profiles }, { data: events }, { data: enrollmentRows }, { data: outcomeRows }] =
    await Promise.all([
      admin.from("profiles").select("id, created_at, onboarded_at"),
      admin.from("events").select("user_id, name, created_at, props").gte(
        "created_at",
        iso(new Date(now - 120 * DAY))
      ),
      admin.from("enrollments").select("id, program_id, status, started_on"),
      admin.from("outcomes").select("enrollment_id, delta, verdict"),
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

  // ── the Relief Loop ───────────────────────────────────────────────────────
  // Completion rate is the number that decides whether this feature has a
  // future, so it is measured per track and at two depths.
  const enrolls = (enrollmentRows ?? []) as EnrollmentRow[];
  const outs = (outcomeRows ?? []) as OutcomeRow[];
  const recommended = log.filter((e) => e.name === "program_recommended");
  const sessionEvents = log.filter((e) => e.name === "session_completed");

  const offeredUsers = new Set(recommended.map((e) => e.user_id));
  const enrolledAfterOffer = new Set(
    log.filter((e) => e.name === "program_enrolled" && offeredUsers.has(e.user_id)).map((e) => e.user_id)
  );

  const sessionsByEnrollment = new Map<string, Set<number>>();
  for (const e of sessionEvents) {
    const day = Number(e.props?.day ?? 0);
    const key = String(e.props?.program ?? "") + ":" + e.user_id;
    const set = sessionsByEnrollment.get(key) ?? new Set<number>();
    set.add(day);
    sessionsByEnrollment.set(key, set);
  }

  const tracks = ["cool", "rest", "steady"].map((id) => {
    const mine = enrolls.filter((e) => e.program_id === id);
    const mature = mine.filter((e) => (now - Date.parse(e.started_on)) / DAY >= 14);
    const reachedWeek2 = mature.filter((e) => {
      const key = `${id}:`;
      for (const [k, set] of sessionsByEnrollment) {
        if (!k.startsWith(key)) continue;
        if ([...set].some((d) => d >= 8)) return true;
      }
      return false;
    });
    const completed = mine.filter((e) => e.status === "completed");
    const deltas = outs
      .filter((o) => mine.some((e) => e.id === o.enrollment_id) && o.delta !== null)
      .map((o) => Number(o.delta));
    return {
      id,
      enrolled: mine.length,
      week2: pct(reachedWeek2.length, mature.length),
      completed: pct(completed.length, mature.length),
      medianDelta: median(deltas),
    };
  });

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
          <Stat
            label="Enrolled after a nudge"
            value={pct(enrolledAfterOffer.size, offeredUsers.size)}
            note="of users shown a program card"
          />
        </dl>

        <h2 className="label mt-14 mb-4">The Relief Loop, by track</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14.5px]">
            <thead>
              <tr className="border-b hair text-[12px] tracking-[0.1em] text-dune uppercase">
                <th className="py-2 pr-4 font-medium">Track</th>
                <th className="py-2 pr-4 font-medium">Enrolled</th>
                <th className="py-2 pr-4 font-medium">Reached week 2</th>
                <th className="py-2 pr-4 font-medium">Completed</th>
                <th className="py-2 font-medium">Median delta</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((t) => (
                <tr key={t.id} className="border-b hair text-[#e4d9e0]">
                  <td className="py-2.5 pr-4">{t.id}</td>
                  <td className="py-2.5 pr-4">{t.enrolled}</td>
                  <td className="py-2.5 pr-4">{t.week2}</td>
                  <td className="py-2.5 pr-4">{t.completed}</td>
                  <td className="py-2.5">
                    {t.medianDelta === null ? "—" : t.medianDelta.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-dune">
          Percentages count only enrollments old enough to have reached that point. Median delta
          is the change in severity on the track&rsquo;s target symptom — negative is better,
          except for feeling like yourself.
        </p>

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
                <tr key={week} className="border-b hair text-[#e4d9e0]">
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
