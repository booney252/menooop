import { redirect } from "next/navigation";
import { getDays, getInterventions, getProfile } from "@/lib/data/history";
import { todaysInsight } from "@/lib/data/insights";
import { getPendingReportPrompt } from "@/lib/data/reports";
import { todayIn } from "@/lib/day";
import { TodayView } from "./TodayView";

export const dynamic = "force-dynamic";

export default async function Today() {
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const [days, interventions] = await Promise.all([getDays(profile), getInterventions()]);
  const history = { profile, days, interventions };
  const [insight, appointmentPrompt] = await Promise.all([
    todaysInsight(history),
    getPendingReportPrompt(profile),
  ]);

  return (
    <TodayView
      profile={profile}
      days={days}
      today={todayIn(profile.timezone)}
      insight={insight}
      appointmentPrompt={appointmentPrompt}
    />
  );
}
