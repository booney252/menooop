import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import { shiftDay, todayIn, type Day } from "@/lib/day";
import type { DayRecord, Intervention, Profile, Severity } from "@/lib/types";
import type { SymptomKey } from "@/lib/symptoms";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("profiles").select("*").maybeSingle();
  return (data as Profile) ?? null;
}

/**
 * Her check-ins for a window ending today, newest last. Days she did not log
 * simply are not in the array — the engine treats absence as absence, never
 * as a zero.
 */
export async function getDays(profile: Profile, windowDays = 90): Promise<DayRecord[]> {
  const supabase = await supabaseServer();
  const today = todayIn(profile.timezone);
  const from = shiftDay(today, -(windowDays - 1));

  const { data } = await supabase
    .from("checkins")
    .select("id, local_date, note, good_things, period_started, checkin_symptoms(symptom_key, severity)")
    .gte("local_date", from)
    .lte("local_date", today)
    .order("local_date", { ascending: true });

  type Row = {
    local_date: Day;
    note: string | null;
    good_things: string[] | null;
    period_started: boolean;
    checkin_symptoms: { symptom_key: SymptomKey; severity: Severity }[] | null;
  };

  return ((data as Row[] | null) ?? []).map((row) => ({
    day: row.local_date,
    note: row.note,
    goodThings: row.good_things ?? [],
    periodStarted: row.period_started,
    severities: Object.fromEntries(
      (row.checkin_symptoms ?? []).map((s) => [s.symptom_key, s.severity])
    ) as Partial<Record<SymptomKey, Severity>>,
  }));
}

export async function getInterventions(): Promise<Intervention[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("interventions")
    .select("id, name, started_on, ended_on")
    .order("started_on", { ascending: false });
  return (data as Intervention[] | null) ?? [];
}

export async function getCheckin(day: Day) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("checkins")
    .select("id, local_date, note, good_things, period_started, checkin_symptoms(symptom_key, severity)")
    .eq("local_date", day)
    .maybeSingle();
  return data;
}
