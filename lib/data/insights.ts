import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import { nextInsight } from "@/lib/insights/engine";
import { todayIn } from "@/lib/day";
import type { History, Insight } from "@/lib/types";

export async function getInsights(limit = 50): Promise<Insight[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("insights")
    .select("*")
    .order("for_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Insight[] | null) ?? [];
}

/**
 * At most one new insight a day.
 *
 * If today already produced one, that is the one she sees. Otherwise the
 * engine is asked for the next thing worth saying; if it has nothing, we show
 * the most recent stored insight rather than inventing something, and if there
 * is nothing at all we return null and Today says so plainly.
 */
export async function todaysInsight(history: History): Promise<Insight | null> {
  const supabase = await supabaseServer();
  const today = todayIn(history.profile.timezone);
  const stored = await getInsights();

  const forToday = stored.find((i) => i.for_date === today);
  if (forToday) return forToday;

  const seen = new Set(stored.map((i) => i.dedupe_key));
  const candidate = nextInsight(history, seen, stored[0]?.kind ?? null);
  if (!candidate) return stored[0] ?? null;

  const { data, error } = await supabase
    .from("insights")
    .upsert(
      {
        user_id: history.profile.id,
        kind: candidate.kind,
        subject: candidate.subject,
        sentence: candidate.sentence,
        detail: candidate.detail,
        payload: candidate.payload,
        for_date: today,
        dedupe_key: candidate.dedupeKey,
      },
      { onConflict: "user_id,dedupe_key", ignoreDuplicates: true }
    )
    .select()
    .maybeSingle();

  if (error) return stored[0] ?? null;
  return (data as Insight) ?? stored[0] ?? null;
}
