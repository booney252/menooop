"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isSymptomKey, type Stage, type SymptomKey } from "@/lib/symptoms";
import { todayIn } from "@/lib/day";
import { logEvent } from "@/lib/events";

const STAGES: Stage[] = ["cycling", "irregular", "stopped"];

function cleanSymptoms(raw: unknown): SymptomKey[] {
  const list = Array.isArray(raw) ? raw : [];
  return [...new Set(list.filter((v): v is SymptomKey => typeof v === "string" && isSymptomKey(v)))];
}

export type OnboardingInput = {
  stage: string;
  symptoms: string[];
  interventions: string[];
  timezone: string;
};

export async function completeOnboarding(input: OnboardingInput) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const stage = STAGES.includes(input.stage as Stage) ? (input.stage as Stage) : "irregular";
  const symptoms = cleanSymptoms(input.symptoms);
  if (symptoms.length < 3 || symptoms.length > 6) {
    return { error: "Choose between three and six symptoms." };
  }

  const timezone = typeof input.timezone === "string" && input.timezone ? input.timezone : "UTC";

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    stage,
    symptoms,
    timezone,
    onboarded_at: new Date().toISOString(),
  });
  if (error) return { error: "Couldn’t save that just now. Try again in a moment." };

  const names = [...new Set(input.interventions.map((n) => n.trim()).filter(Boolean))].slice(0, 6);
  if (names.length) {
    await supabase.from("interventions").insert(
      names.map((name) => ({
        user_id: user.id,
        name: name.slice(0, 80),
        started_on: todayIn(timezone),
      }))
    );
  }

  await logEvent("signup_completed", { symptoms: symptoms.length, stage });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateSymptoms(symptoms: string[]) {
  const supabase = await supabaseServer();
  const clean = cleanSymptoms(symptoms);
  if (clean.length < 3 || clean.length > 6) {
    return { error: "Marlow asks about three to six a day. Pick within that." };
  }
  const { error } = await supabase.from("profiles").update({ symptoms: clean }).not("id", "is", null);
  if (error) return { error: "Couldn’t save that just now." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateProfileDetails(input: {
  first_name?: string;
  timezone?: string;
  nudge_enabled?: boolean;
  nudge_hour?: number | null;
}) {
  const supabase = await supabaseServer();
  const patch: Record<string, unknown> = {};
  if (typeof input.first_name === "string") patch.first_name = input.first_name.trim().slice(0, 40) || null;
  if (typeof input.timezone === "string" && input.timezone) patch.timezone = input.timezone;
  if (typeof input.nudge_enabled === "boolean") patch.nudge_enabled = input.nudge_enabled;
  if (input.nudge_hour === null || typeof input.nudge_hour === "number") {
    patch.nudge_hour =
      input.nudge_hour === null ? null : Math.max(0, Math.min(23, Math.round(input.nudge_hour)));
  }
  if (!Object.keys(patch).length) return { ok: true };

  const { error } = await supabase.from("profiles").update(patch).not("id", "is", null);
  if (error) return { error: "Couldn’t save that just now." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addIntervention(name: string, startedOn?: string) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const clean = name.trim().slice(0, 80);
  if (!clean) return { error: "Give it a name first." };

  const { data: profile } = await supabase.from("profiles").select("timezone").maybeSingle();
  const started = startedOn ?? todayIn(profile?.timezone ?? "UTC");

  const { error } = await supabase
    .from("interventions")
    .insert({ user_id: user.id, name: clean, started_on: started });
  if (error) return { error: "Couldn’t add that just now." };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function endIntervention(id: string) {
  const supabase = await supabaseServer();
  const { data: profile } = await supabase.from("profiles").select("timezone").maybeSingle();
  await supabase
    .from("interventions")
    .update({ ended_on: todayIn(profile?.timezone ?? "UTC") })
    .eq("id", id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeIntervention(id: string) {
  const supabase = await supabaseServer();
  await supabase.from("interventions").delete().eq("id", id);
  revalidatePath("/", "layout");
  return { ok: true };
}
