import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data/history";

export const dynamic = "force-dynamic";

export default async function Index() {
  const profile = await getProfile();
  redirect(profile?.onboarded_at ? "/today" : "/onboarding");
}
