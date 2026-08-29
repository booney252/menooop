import { redirect } from "next/navigation";
import { getDays, getInterventions, getProfile } from "@/lib/data/history";
import {
  activeEnrollment,
  daysDone,
  getCompletions,
  getEnrollments,
  getRecommendations,
  nextDay,
} from "@/lib/data/programs";
import { PROGRAM_BY_ID, totalDays, type ProgramId } from "@/content/programs";
import { matchProgram, shouldOffer } from "@/lib/programs/match";
import { weeklyNote } from "@/lib/programs/outcome";
import { logEvent } from "@/lib/events";
import { todaysInsight } from "@/lib/data/insights";
import { getPendingReportPrompt } from "@/lib/data/reports";
import { todayIn } from "@/lib/day";
import { TodayView } from "./TodayView";

export const dynamic = "force-dynamic";

export default async function Today() {
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const [days, interventions, enrollments, recommendations] = await Promise.all([
    getDays(profile, 120),
    getInterventions(),
    getEnrollments(),
    getRecommendations(),
  ]);
  const history = { profile, days, interventions };
  const today = todayIn(profile.timezone);

  const [insight, appointmentPrompt] = await Promise.all([
    todaysInsight(history),
    getPendingReportPrompt(profile),
  ]);

  // the running program, if there is one
  const running =
    activeEnrollment(enrollments) ??
    enrollments.find((e) => e.status === "paused") ??
    null;
  const completions = running ? await getCompletions(running.id) : [];
  const total = running ? totalDays(running.program_id as ProgramId) : 0;

  const active = running
    ? {
        id: running.program_id,
        name: PROGRAM_BY_ID[running.program_id as ProgramId].name,
        next: nextDay(completions, total),
        total,
        done: daysDone(completions),
        note: weeklyNote(days, running, profile.symptoms, today),
        doneToday: completions.some((c) => c.completed_on === today),
        paused: running.status === "paused",
      }
    : null;

  // and the suggestion, only when nothing is running
  const offer = active
    ? null
    : shouldOffer(matchProgram(days, profile.symptoms), enrollments, recommendations, today);
  if (offer) await logEvent("program_recommended", { program: offer.program.id });

  return (
    <TodayView
      profile={profile}
      days={days}
      today={today}
      insight={insight}
      appointmentPrompt={appointmentPrompt}
      activeProgram={active}
      suggestion={offer ? { id: offer.program.id, lines: offer.lines } : null}
    />
  );
}
