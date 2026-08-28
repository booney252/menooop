import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data/history";
import { OnboardingFlow } from "./OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function Onboarding() {
  const profile = await getProfile();
  if (profile?.onboarded_at) redirect("/today");
  return <OnboardingFlow />;
}
