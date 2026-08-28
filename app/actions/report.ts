"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { shiftDay, todayIn } from "@/lib/day";
import { logEvent } from "@/lib/events";
import type { Profile } from "@/lib/types";

export async function generateReport(windowDays: number, sayNote: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profileRow } = await supabase.from("profiles").select("*").maybeSingle();
  if (!profileRow) redirect("/onboarding");
  const profile = profileRow as Profile;

  const span = [30, 60, 90].includes(windowDays) ? windowDays : 60;
  const end = todayIn(profile.timezone);
  const start = shiftDay(end, -(span - 1));

  const { count } = await supabase
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .gte("local_date", start)
    .lte("local_date", end);

  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      window_start: start,
      window_end: end,
      checkin_count: count ?? 0,
      say_note: sayNote.trim().slice(0, 600) || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Couldn’t put that together just now. Try again." };

  await logEvent("report_generated", { window_days: span, checkins: count ?? 0 });
  revalidatePath("/", "layout");
  redirect(`/report/${data.id}`);
}

export async function logAppointmentOutcome(
  id: string,
  went: "heard" | "mixed" | "dismissed" | "not_yet",
  note: string
) {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("reports")
    .update({
      outcome_logged_at: new Date().toISOString(),
      outcome_went: went,
      outcome_note: note.trim().slice(0, 600) || null,
    })
    .eq("id", id);

  if (error) return { error: "Couldn’t save that just now." };
  await logEvent("report_outcome_logged", { went });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function dismissAppointmentPrompt(id: string) {
  const supabase = await supabaseServer();
  await supabase
    .from("reports")
    .update({ outcome_dismissed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/", "layout");
  return { ok: true };
}
