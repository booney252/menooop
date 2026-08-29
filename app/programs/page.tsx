import { redirect } from "next/navigation";
import { getDays, getProfile } from "@/lib/data/history";
import { getEnrollments } from "@/lib/data/programs";
import { matchProgram } from "@/lib/programs/match";
import { PROGRAMS } from "@/content/programs";
import { ProgramsView } from "./ProgramsView";

export const dynamic = "force-dynamic";

export default async function Programs() {
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const [days, enrollments] = await Promise.all([getDays(profile), getEnrollments()]);
  const match = matchProgram(days, profile.symptoms);

  return (
    <ProgramsView
      programs={PROGRAMS.map((p) => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        weeks: p.weeks,
        minutes: p.minutesPerSession,
      }))}
      matchedId={match?.program.id ?? null}
      enrollments={enrollments.map((e) => ({
        program_id: e.program_id,
        status: e.status,
        id: e.id,
      }))}
    />
  );
}
