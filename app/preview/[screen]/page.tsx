import { notFound } from "next/navigation";
import { TodayView } from "@/app/today/TodayView";
import { PatternsView } from "@/app/patterns/PatternsView";
import { ReportCover } from "@/app/report/ReportCover";
import { ReportDocument } from "@/app/report/[id]/ReportDocument";
import { AskView } from "@/app/ask/AskView";
import { SettingsView } from "@/app/settings/SettingsView";
import { CheckInFlow } from "@/app/check-in/CheckInFlow";
import { OnboardingFlow } from "@/app/onboarding/OnboardingFlow";
import {
  PREVIEW_TODAY,
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

export default async function Preview({
  params,
  searchParams,
}: {
  params: Promise<{ screen: string }>;
  searchParams: Promise<{ body?: string }>;
}) {
  if (!enabled()) notFound();
  const { screen } = await params;
  const { body } = await searchParams;
  const view = renderScreen(screen, previewHistory(), previewInsights());
  return body === "bricolage" || body === "spectral" ? (
    <div data-body={body}>{view}</div>
  ) : (
    view
  );
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
