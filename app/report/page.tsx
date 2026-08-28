import { redirect } from "next/navigation";
import { getDays, getProfile } from "@/lib/data/history";
import { ReportCover } from "./ReportCover";

export const dynamic = "force-dynamic";

export default async function ReportIndex() {
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");
  const days = await getDays(profile);
  return <ReportCover loggedDays={days.length} />;
}
