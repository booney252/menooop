import { redirect } from "next/navigation";
import { getDays, getProfile } from "@/lib/data/history";
import { getInsights } from "@/lib/data/insights";
import { todayIn } from "@/lib/day";
import { PatternsView } from "./PatternsView";

export const dynamic = "force-dynamic";

export default async function Patterns() {
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const [days, insights] = await Promise.all([getDays(profile), getInsights()]);

  return (
    <PatternsView
      profile={profile}
      days={days}
      insights={insights}
      today={todayIn(profile.timezone)}
    />
  );
}
