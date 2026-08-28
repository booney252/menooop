import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything Marlow holds about her, as one JSON file. Hers, on request. */
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Not signed in.", { status: 401 });

  const [profile, checkins, symptoms, interventions, insights, chat, reports] = await Promise.all([
    supabase.from("profiles").select("*").maybeSingle(),
    supabase.from("checkins").select("*").order("local_date"),
    supabase.from("checkin_symptoms").select("*"),
    supabase.from("interventions").select("*").order("started_on"),
    supabase.from("insights").select("*").order("for_date"),
    supabase.from("chat_messages").select("*").order("created_at"),
    supabase.from("reports").select("*").order("created_at"),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile: profile.data ?? null,
    checkins: checkins.data ?? [],
    checkin_symptoms: symptoms.data ?? [],
    interventions: interventions.data ?? [],
    insights: insights.data ?? [],
    chat_messages: chat.data ?? [],
    reports: reports.data ?? [],
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="marlow-export-${stamp}.json"`,
      "cache-control": "no-store",
    },
  });
}
