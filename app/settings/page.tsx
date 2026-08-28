import { redirect } from "next/navigation";
import { getInterventions, getProfile } from "@/lib/data/history";
import { SettingsView } from "./SettingsView";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");
  const interventions = await getInterventions();
  return <SettingsView profile={profile} interventions={interventions} />;
}
