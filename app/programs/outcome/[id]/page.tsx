import { notFound, redirect } from "next/navigation";
import { getDays, getProfile } from "@/lib/data/history";
import { getCompletions, getEnrollment, daysDone } from "@/lib/data/programs";
import { PROGRAM_BY_ID, totalDays, type ProgramId } from "@/content/programs";
import { computeOutcome, outcomeEndDay } from "@/lib/programs/outcome";
import { saveOutcome } from "@/app/actions/programs";
import { todayIn } from "@/lib/day";
import { logEvent } from "@/lib/events";
import { OutcomeView } from "./OutcomeView";

export const dynamic = "force-dynamic";

export default async function OutcomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const enrollment = await getEnrollment(id);
  if (!enrollment) notFound();

  const program = PROGRAM_BY_ID[enrollment.program_id as ProgramId];
  if (!program) notFound();

  const today = todayIn(profile.timezone);
  const [days, completions] = await Promise.all([
    getDays(profile, 120),
    getCompletions(enrollment.id),
  ]);

  // computed fresh, then persisted so the report and the feed can read it
  const results = computeOutcome(days, enrollment, profile.symptoms, today);
  await saveOutcome(enrollment.id);
  await logEvent("outcome_viewed", { program: enrollment.program_id });

  return (
    <OutcomeView
      programId={program.id}
      programName={program.name}
      weeks={program.weeks}
      startedOn={enrollment.started_on}
      endedOn={outcomeEndDay(enrollment, today)}
      sessionsDone={daysDone(completions)}
      sessionsTotal={totalDays(program.id)}
      results={results}
    />
  );
}
