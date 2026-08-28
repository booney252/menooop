import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import type { Profile, Report } from "@/lib/types";

export async function getReport(id: string): Promise<Report | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
  return (data as Report) ?? null;
}

export async function getReports(limit = 20): Promise<Report[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Report[] | null) ?? [];
}

/**
 * The soft "did you have your appointment?" nudge. Only ever asked once per
 * report, only after a day has passed, and she can wave it away for good.
 */
export async function getPendingReportPrompt(
  _profile: Profile
): Promise<{ id: string; created_at: string } | null> {
  const supabase = await supabaseServer();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const { data } = await supabase
    .from("reports")
    .select("id, created_at")
    .is("outcome_logged_at", null)
    .is("outcome_dismissed_at", null)
    .lt("created_at", dayAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id: string; created_at: string }) ?? null;
}
