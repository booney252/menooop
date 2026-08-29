import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import { todayIn } from "@/lib/day";
import type {
  Enrollment,
  Outcome,
  Profile,
  ProgramRecommendation,
  SessionCompletion,
} from "@/lib/types";

export async function getEnrollments(): Promise<Enrollment[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("enrollments")
    .select("*")
    .order("started_on", { ascending: false });
  return (data as Enrollment[] | null) ?? [];
}

export async function getEnrollment(id: string): Promise<Enrollment | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("enrollments").select("*").eq("id", id).maybeSingle();
  return (data as Enrollment) ?? null;
}

export const activeEnrollment = (list: Enrollment[]) =>
  list.find((e) => e.status === "active") ?? null;

export async function getCompletions(enrollmentId: string): Promise<SessionCompletion[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("session_completions")
    .select("id, enrollment_id, day_index, completed_on, rating")
    .eq("enrollment_id", enrollmentId)
    .order("day_index", { ascending: true });
  return (data as SessionCompletion[] | null) ?? [];
}

export async function getRecommendations(): Promise<ProgramRecommendation[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("program_recommendations")
    .select("id, program_id, shown_on, dismissed_at")
    .order("shown_on", { ascending: false });
  return (data as ProgramRecommendation[] | null) ?? [];
}

export async function getOutcomes(enrollmentId?: string): Promise<Outcome[]> {
  const supabase = await supabaseServer();
  let q = supabase.from("outcomes").select("*").order("created_at", { ascending: false });
  if (enrollmentId) q = q.eq("enrollment_id", enrollmentId);
  const { data } = await q;
  return (data as Outcome[] | null) ?? [];
}

/**
 * The next session she has not done. Sessions can be repeated, so this is the
 * lowest day index with no completion — never a lock on the ones behind it.
 */
export function nextDay(completions: SessionCompletion[], total: number): number {
  const done = new Set(completions.map((c) => c.day_index));
  for (let day = 1; day <= total; day++) if (!done.has(day)) return day;
  return total;
}

/** distinct days done, which is what adherence means here */
export const daysDone = (completions: SessionCompletion[]) =>
  new Set(completions.map((c) => c.day_index)).size;

/** the last day she played anything, for the silence rules */
export function lastActivity(completions: SessionCompletion[]): string | null {
  return completions.reduce<string | null>(
    (latest, c) => (!latest || c.completed_on > latest ? c.completed_on : latest),
    null
  );
}

export const todayFor = (profile: Profile) => todayIn(profile.timezone);
