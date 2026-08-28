import { redirect } from "next/navigation";
import { getDays, getInterventions, getProfile } from "@/lib/data/history";
import { supabaseServer } from "@/lib/supabase/server";
import { starterQuestions } from "@/lib/summary";
import { todayIn } from "@/lib/day";
import { anthropicConfigured } from "@/lib/env";
import type { ChatMessage } from "@/lib/types";
import { AskView } from "./AskView";

export const dynamic = "force-dynamic";

export default async function Ask() {
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const supabase = await supabaseServer();
  const [{ data }, days, interventions] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .order("created_at", { ascending: true })
      .limit(80),
    getDays(profile),
    getInterventions(),
  ]);

  const today = todayIn(profile.timezone);

  return (
    <AskView
      initial={(data as ChatMessage[] | null) ?? []}
      starters={starterQuestions({ profile, days, interventions }, today)}
      live={anthropicConfigured()}
    />
  );
}
