import { supabaseAdmin } from "@/lib/supabase/admin";
import { todayIn } from "@/lib/day";
import { siteUrl } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The optional daily nudge. One email, at most, at roughly the hour she chose,
 * and never a word about days she missed.
 *
 * Meant to be called hourly by a scheduler (Vercel cron) with CRON_SECRET set.
 * With no email provider configured it is a no-op that reports what it would
 * have sent, so the schedule can be wired up before the provider is.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Not authorised.", { status: 401 });
  }

  const admin = supabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id, timezone, nudge_hour, last_nudged_on")
    .eq("nudge_enabled", true)
    .not("nudge_hour", "is", null);

  const rows = (data ?? []) as {
    id: string;
    timezone: string;
    nudge_hour: number;
    last_nudged_on: string | null;
  }[];

  const now = new Date();
  const due = rows.filter((p) => {
    const today = todayIn(p.timezone, now);
    if (p.last_nudged_on === today) return false;
    const localHour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: p.timezone,
        hour: "2-digit",
        hour12: false,
      }).format(now)
    );
    return localHour === p.nudge_hour;
  });

  const key = process.env.RESEND_API_KEY;
  const from = process.env.MARLOW_FROM_EMAIL;
  let sent = 0;

  for (const p of due) {
    if (key && from) {
      const { data: userData } = await admin.auth.admin.getUserById(p.id);
      const email = userData?.user?.email;
      if (!email) continue;

      const ok = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Fifteen seconds, whenever suits",
          text: `Today's check-in is open when you want it.\n\n${siteUrl()}/check-in\n\nIf today isn't the day, that's fine too — Marlow will be here.\n\nTurn these off any time in Settings.`,
        }),
      })
        .then((r) => r.ok)
        .catch(() => false);

      if (!ok) continue;
      sent++;
    }
    await admin
      .from("profiles")
      .update({ last_nudged_on: todayIn(p.timezone, now) })
      .eq("id", p.id);
  }

  return Response.json({
    due: due.length,
    sent,
    configured: Boolean(key && from),
  });
}
