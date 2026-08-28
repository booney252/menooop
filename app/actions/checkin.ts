"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isSymptomKey } from "@/lib/symptoms";
import { GOOD_THINGS } from "@/lib/symptoms";
import { daysBetween, todayIn } from "@/lib/day";
import { logEvent } from "@/lib/events";
import type { Profile } from "@/lib/types";

const GOOD_KEYS = new Set(GOOD_THINGS.map((g) => g.key as string));

export type CheckInInput = {
  severities: Record<string, number>;
  goodThings: string[];
  note: string;
  periodStarted: boolean;
  durationMs?: number;
};

/**
 * Saves today's check-in. The date is always today in her timezone, worked out
 * on the server — the client never gets to say which day it is writing to,
 * which is also what makes "editable until midnight" true by construction.
 */
export async function saveCheckIn(input: CheckInInput) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("*").maybeSingle();
  if (!profile) return { error: "Finish setting up first." };

  const p = profile as Profile;
  const today = todayIn(p.timezone);

  const severities = Object.entries(input.severities ?? {}).filter(
    ([key, value]) =>
      isSymptomKey(key) &&
      p.symptoms.includes(key) &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 3
  );
  if (!severities.length) return { error: "Nothing to save yet." };

  const goodThings = [...new Set((input.goodThings ?? []).filter((g) => GOOD_KEYS.has(g)))];
  const note = (input.note ?? "").trim().slice(0, 280) || null;

  const { data: checkin, error } = await supabase
    .from("checkins")
    .upsert(
      {
        user_id: user.id,
        local_date: today,
        note,
        good_things: goodThings,
        period_started: Boolean(input.periodStarted),
        duration_ms: input.durationMs ?? null,
      },
      { onConflict: "user_id,local_date" }
    )
    .select("id")
    .single();

  if (error || !checkin) return { error: "Couldn’t save that just now. Try again." };

  // replace rather than merge, so unticking a symptom actually removes it
  await supabase.from("checkin_symptoms").delete().eq("checkin_id", checkin.id);
  const { error: symptomError } = await supabase.from("checkin_symptoms").insert(
    severities.map(([symptom_key, severity]) => ({
      checkin_id: checkin.id,
      user_id: user.id,
      symptom_key,
      severity,
    }))
  );
  if (symptomError) return { error: "Couldn’t save that just now. Try again." };

  const dayN = daysBetween(p.created_at.slice(0, 10), today);
  await logEvent("checkin_completed", {
    duration_ms: input.durationMs ?? 0,
    symptoms: severities.length,
    good_things: goodThings.length,
    day_n: dayN,
  });
  if (dayN > 0) await logEvent("day_n_return", { day_n: dayN });

  revalidatePath("/", "layout");
  return { ok: true, goodThings };
}
