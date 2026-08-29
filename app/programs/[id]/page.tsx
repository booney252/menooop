import { notFound, redirect } from "next/navigation";
import { getDays, getProfile } from "@/lib/data/history";
import { getCompletions, getEnrollments, daysDone, nextDay } from "@/lib/data/programs";
import { isProgramId, PROGRAM_BY_ID, totalDays } from "@/content/programs";
import { outcomeReady, weeklyNote } from "@/lib/programs/outcome";
import { todayIn } from "@/lib/day";
import { logEvent } from "@/lib/events";
import { ProgramView } from "./ProgramView";

export const dynamic = "force-dynamic";

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isProgramId(id)) notFound();

  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const program = PROGRAM_BY_ID[id];
  const [days, enrollments] = await Promise.all([getDays(profile, 120), getEnrollments()]);

  const enrollment =
    enrollments.find((e) => e.program_id === id && e.status !== "stopped") ?? null;
  const completions = enrollment ? await getCompletions(enrollment.id) : [];
  const today = todayIn(profile.timezone);
  const total = totalDays(id);

  await logEvent("program_viewed", { program: id });

  const otherRunning = enrollments.some(
    (e) => e.program_id !== id && (e.status === "active" || e.status === "paused")
  );

  return (
    <ProgramView
      program={{
        id,
        name: program.name,
        tagline: program.tagline,
        weeks: program.weeks,
        minutes: program.minutesPerSession,
        what: program.what,
        commitment: program.commitment,
        evidence: program.evidence,
        arc: program.arc,
      }}
      enrollment={
        enrollment && {
          id: enrollment.id,
          status: enrollment.status,
          startedOn: enrollment.started_on,
        }
      }
      total={total}
      done={daysDone(completions)}
      next={nextDay(completions, total)}
      note={enrollment ? weeklyNote(days, enrollment, profile.symptoms, today) : null}
      outcomeReady={enrollment ? outcomeReady(enrollment, today) : false}
      otherRunning={otherRunning}
    />
  );
}
