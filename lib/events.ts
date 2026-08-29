import "server-only";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * Product analytics. Deliberately thin: a name and a small bag of numbers.
 * Never log anything she wrote — no notes, no chat content, no symptom values.
 */
export type EventName =
  | "signup_completed"
  | "checkin_completed"
  | "insight_viewed"
  | "report_generated"
  | "report_outcome_logged"
  | "chat_message_sent"
  | "day_n_return"
  | "program_recommended"
  | "program_viewed"
  | "program_enrolled"
  | "session_completed"
  | "program_paused"
  | "program_resumed"
  | "program_completed"
  | "outcome_viewed";

export async function logEvent(
  name: EventName,
  props: Record<string, string | number | boolean> = {}
) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("events").insert({ user_id: user.id, name, props });
  } catch {
    // Analytics must never break a screen she is trying to use.
  }
}
