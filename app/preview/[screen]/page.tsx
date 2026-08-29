import { notFound } from "next/navigation";
import { TodayView } from "@/app/today/TodayView";
import { PatternsView } from "@/app/patterns/PatternsView";
import { ReportCover } from "@/app/report/ReportCover";
import { ReportDocument } from "@/app/report/[id]/ReportDocument";
import { AskView } from "@/app/ask/AskView";
import { SettingsView } from "@/app/settings/SettingsView";
import { CheckInFlow } from "@/app/check-in/CheckInFlow";
import { OnboardingFlow } from "@/app/onboarding/OnboardingFlow";
import { ProgramsView } from "@/app/programs/ProgramsView";
import { ProgramView } from "@/app/programs/[id]/ProgramView";
import { SessionPlayer } from "@/app/programs/[id]/session/[day]/SessionPlayer";
import { OutcomeView } from "@/app/programs/outcome/[id]/OutcomeView";
import { PROGRAMS, PROGRAM_BY_ID, sessionFor, totalDays } from "@/content/programs";
import { shiftDay } from "@/lib/day";
import {
  PREVIEW_TODAY,
  previewEnrollment,
  previewOutcome,
  previewSuggestion,
  previewWeeklyNote,
  previewHistory,
  previewInsights,
  previewQuestions,
  previewReport,
  previewReportRows,
} from "@/lib/preview";
import { starterQuestions } from "@/lib/summary";

export const dynamic = "force-dynamic";

/**
 * Design preview. Renders the real view components against fixtures so the
 * screens can be reviewed and screenshotted at 390px without a database.
 *
 * Two gates, both required: MARLOW_PREVIEW must be "1", and it refuses to
 * render on a Vercel production deployment whatever the flag says.
 */
function enabled() {
  return process.env.MARLOW_PREVIEW === "1" && process.env.VERCEL_ENV !== "production";
}

export default async function Preview({ params }: { params: Promise<{ screen: string }> }) {
  if (!enabled()) notFound();
  const { screen } = await params;
  return renderScreen(screen, previewHistory(), previewInsights());
}

function renderScreen(
  screen: string,
  history: ReturnType<typeof previewHistory>,
  insights: ReturnType<typeof previewInsights>
) {
  const { profile, days, interventions } = history;

  switch (screen) {
    case "today":
      return (
        <TodayView
          profile={profile}
          days={days}
          today={PREVIEW_TODAY}
          insight={insights[0] ?? null}
          appointmentPrompt={null}
          activeProgram={null}
          suggestion={null}
        />
      );
    case "today-done":
      return (
        <TodayView
          profile={profile}
          days={[
            ...days,
            {
              day: PREVIEW_TODAY,
              severities: { sleep: 1, anxiety: 2, brain_fog: 1, hot_flashes: 2, like_myself: 2 },
              note: "Walked before work. It helped.",
              goodThings: ["slept_through", "good_energy"],
              periodStarted: false,
            },
          ]}
          today={PREVIEW_TODAY}
          insight={insights[0] ?? null}
          appointmentPrompt={null}
          activeProgram={null}
          suggestion={null}
        />
      );
    case "today-appointment":
      return (
        <TodayView
          profile={profile}
          days={days}
          today={PREVIEW_TODAY}
          insight={insights[1] ?? null}
          appointmentPrompt={{ id: "preview", created_at: new Date().toISOString() }}
          activeProgram={null}
          suggestion={null}
        />
      );
    case "today-suggestion": {
      const offer = previewSuggestion();
      return (
        <TodayView
          profile={profile}
          days={days}
          today={PREVIEW_TODAY}
          insight={insights[0] ?? null}
          appointmentPrompt={null}
          activeProgram={null}
          suggestion={offer ? { id: offer.program.id, lines: offer.lines } : null}
        />
      );
    }
    case "today-program":
      return (
        <TodayView
          profile={profile}
          days={days}
          today={PREVIEW_TODAY}
          insight={insights[0] ?? null}
          appointmentPrompt={null}
          activeProgram={{
            id: "cool",
            name: "Cool",
            next: 19,
            total: 42,
            done: 18,
            note: previewWeeklyNote(),
            doneToday: false,
            paused: false,
          }}
          suggestion={null}
        />
      );
    case "programs":
      return (
        <ProgramsView
          programs={PROGRAMS.map((p) => ({
            id: p.id,
            name: p.name,
            tagline: p.tagline,
            weeks: p.weeks,
            minutes: p.minutesPerSession,
          }))}
          matchedId={previewSuggestion()?.program.id ?? null}
          enrollments={[]}
        />
      );
    case "program-enroll": {
      const p = PROGRAM_BY_ID.cool;
      return (
        <ProgramView
          program={{
            id: p.id, name: p.name, tagline: p.tagline, weeks: p.weeks,
            minutes: p.minutesPerSession, what: p.what, commitment: p.commitment,
            evidence: p.evidence, arc: p.arc,
          }}
          enrollment={null}
          total={totalDays("cool")}
          done={0}
          next={1}
          note={null}
          outcomeReady={false}
          otherRunning={false}
        />
      );
    }
    case "program-running": {
      const p = PROGRAM_BY_ID.cool;
      return (
        <ProgramView
          program={{
            id: p.id, name: p.name, tagline: p.tagline, weeks: p.weeks,
            minutes: p.minutesPerSession, what: p.what, commitment: p.commitment,
            evidence: p.evidence, arc: p.arc,
          }}
          enrollment={{ id: "preview", status: "active", startedOn: shiftDay(PREVIEW_TODAY, -18) }}
          total={totalDays("cool")}
          done={18}
          next={19}
          note={previewWeeklyNote()}
          outcomeReady={false}
          otherRunning={false}
        />
      );
    }
    case "session-audio":
      return (
        <SessionPlayer
          programId="cool"
          programName="Cool"
          enrollmentId="preview"
          session={sessionFor("cool", 1)!}
          total={42}
          alreadyDone={false}
        />
      );
    case "session-text":
      return (
        <SessionPlayer
          programId="rest"
          programName="Rest"
          enrollmentId="preview"
          session={sessionFor("rest", 15)!}
          total={28}
          alreadyDone={false}
        />
      );
    case "outcome":
    case "outcome-null":
      return (
        <OutcomeView
          programId="cool"
          programName="Cool"
          weeks={6}
          startedOn={shiftDay(PREVIEW_TODAY, -42)}
          endedOn={PREVIEW_TODAY}
          sessionsDone={38}
          sessionsTotal={42}
          results={previewOutcome(screen === "outcome")}
        />
      );
    case "check-in":
      return <CheckInFlow profile={profile} existing={null} />;
    case "onboarding":
      return <OnboardingFlow />;
    case "patterns":
      return (
        <PatternsView
          profile={profile}
          days={days}
          insights={insights}
          today={PREVIEW_TODAY}
        />
      );
    case "report":
      return <ReportCover loggedDays={days.length} />;
    case "report-paper":
      return (
        <ReportDocument
          report={previewReport()}
          rows={previewReportRows()}
          interventions={interventions}
          questions={previewQuestions()}
          notes={days
            .filter((d) => d.note)
            .slice(-3)
            .reverse()
            .map((d) => ({ day: d.day, note: d.note as string }))}
          programs={[
            {
              name: "Cool",
              weeks: 6,
              startedOn: shiftDay(PREVIEW_TODAY, -42),
              status: "completed",
              sentences: previewOutcome(true).map((o) => o.sentence),
            },
          ]}
          stage={profile.stage}
        />
      );
    case "ask":
      return (
        <AskView
          initial={[]}
          starters={starterQuestions(history, PREVIEW_TODAY)}
          live
        />
      );
    case "settings":
      return <SettingsView profile={profile} interventions={interventions} />;
    default:
      notFound();
  }
}
