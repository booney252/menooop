import { redirect } from "next/navigation";
import { getDays, getProfile } from "@/lib/data/history";
import { todayIn } from "@/lib/day";
import { CheckInFlow } from "./CheckInFlow";

export const dynamic = "force-dynamic";

export default async function CheckIn() {
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const today = todayIn(profile.timezone);
  const days = await getDays(profile, 2);
  const existing = days.find((d) => d.day === today) ?? null;

  return <CheckInFlow profile={profile} existing={existing} />;
}
