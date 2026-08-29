"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isProgramId, PROGRAM_BY_ID, totalDays } from "@/content/programs";
import { getDays, getProfile } from "@/lib/data/history";
import { getCompletions, getEnrollment, nextDay } from "@/lib/data/programs";
import { computeOutcome } from "@/lib/programs/outcome";
import { todayIn } from "@/lib/day";
import { logEvent } from "@/lib/events";
import type { SessionRating } from "@/lib/types";

const RATINGS: SessionRating[] = ["helped", "neutral", "not_for_me"];

/**
 * Enrolling creates an intervention row alongside the enrollment, so the
 * before/after machinery that already exists treats a program exactly like
 * magnesium — and the doctor report picks it up for free.
 */
export async function enroll(programId: string) {
  if (!isProgramId(programId)) return { error: "That program doesn’t exist." };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const program = PROGRAM_BY_ID[programId];
  const today = todayIn(profile.timezone);

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, status")
    .in("status", ["active", "paused"])
    .maybeSingle();
  if (existing) {
    return { error: "One program at a time. Finish or stop the current one first." };
  }

  const { data: intervention } = await supabase
    .from("interventions")
    .insert({ user_id: user.id, name: `${program.name} program`, started_on: today })
    .select("id")
    .single();

  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      program_id: programId,
      started_on: today,
      status: "active",
      intervention_id: intervention?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Couldn’t start that just now. Try again." };

  await logEvent("program_enrolled", { program: programId });
  revalidatePath("/", "layout");
  return { id: data.id as string };
}

export async function completeSession(
  enrollmentId: string,
  dayIndex: number,
  rating: string | null
) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await getProfile();
  if (!profile) return { error: "Finish setting up first." };

  const enrollment = await getEnrollment(enrollmentId);
  if (!enrollment) return { error: "That program isn’t yours." };

  const total = totalDays(enrollment.program_id as never);
  if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > total) {
    return { error: "That session doesn’t exist." };
  }

  const clean = rating && RATINGS.includes(rating as SessionRating) ? rating : null;
  const today = todayIn(profile.timezone);

  const { error } = await supabase.from("session_completions").insert({
    user_id: user.id,
    enrollment_id: enrollmentId,
    day_index: dayIndex,
    completed_on: today,
    rating: clean,
  });
  if (error) return { error: "Couldn’t save that just now." };

  await logEvent("session_completed", { program: enrollment.program_id, day: dayIndex });

  // a program picked up after a pause is simply running again
  if (enrollment.status === "paused") {
    await supabase
      .from("enrollments")
      .update({ status: "active", paused_at: null })
      .eq("id", enrollmentId);
    await logEvent("program_resumed", { program: enrollment.program_id });
  }

  const completions = await getCompletions(enrollmentId);
  const done = new Set(completions.map((c) => c.day_index)).size;
  if (done >= total && enrollment.status !== "completed") {
    await supabase
      .from("enrollments")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", enrollmentId);
    await logEvent("program_completed", { program: enrollment.program_id, days: done });
  }

  revalidatePath("/", "layout");
  return { ok: true, finished: done >= total };
}

export async function setEnrollmentStatus(enrollmentId: string, status: "paused" | "stopped") {
  const supabase = await supabaseServer();
  const patch =
    status === "paused"
      ? { status, paused_at: new Date().toISOString() }
      : { status, paused_at: null };
  const { error } = await supabase.from("enrollments").update(patch).eq("id", enrollmentId);
  if (error) return { error: "Couldn’t change that just now." };
  await logEvent("program_paused", { status });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resumeEnrollment(enrollmentId: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("enrollments")
    .update({ status: "active", paused_at: null })
    .eq("id", enrollmentId);
  if (error) return { error: "Couldn’t resume that just now." };
  await logEvent("program_resumed", {});
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function dismissRecommendation(programId: string) {
  if (!isProgramId(programId)) return { ok: true };
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: true };

  const profile = await getProfile();
  await supabase.from("program_recommendations").insert({
    user_id: user.id,
    program_id: programId,
    shown_on: todayIn(profile?.timezone ?? "UTC"),
    dismissed_at: new Date().toISOString(),
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Writes the outcome rows. Idempotent — recomputing an outcome overwrites the
 * previous answer rather than stacking a second one.
 */
export async function saveOutcome(enrollmentId: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await getProfile();
  if (!profile) return { error: "Finish setting up first." };

  const enrollment = await getEnrollment(enrollmentId);
  if (!enrollment) return { error: "That program isn’t yours." };

  const today = todayIn(profile.timezone);
  const days = await getDays(profile, 120);
  const results = computeOutcome(days, enrollment, profile.symptoms, today);
  if (!results.length) return { error: "Nothing to measure here." };

  const { error } = await supabase.from("outcomes").upsert(
    results.map((r) => ({
      user_id: user.id,
      enrollment_id: enrollmentId,
      symptom_key: r.symptom,
      baseline: r.baseline,
      endpoint: r.endpoint,
      delta: r.delta,
      baseline_days: r.baselineDays,
      endpoint_days: r.endpointDays,
      verdict: r.verdict,
      sentence: r.sentence,
    })),
    { onConflict: "enrollment_id,symptom_key" }
  );
  if (error) return { error: "Couldn’t work that out just now." };

  revalidatePath("/", "layout");
  return { ok: true };
}
