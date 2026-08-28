import { notFound, redirect } from "next/navigation";
import { getDays, getInterventions, getProfile } from "@/lib/data/history";
import { getReport } from "@/lib/data/reports";
import { daysBetween } from "@/lib/day";
import { describeSymptom } from "@/lib/insights/describe";
import { neutralQuestions } from "@/lib/insights/questions";
import { ReportDocument } from "./ReportDocument";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const report = await getReport(id);
  if (!report) notFound();

  const span = daysBetween(report.window_start, report.window_end) + 1;
  const [days, interventions] = await Promise.all([
    getDays(profile, Math.max(span, 30)),
    getInterventions(),
  ]);

  const rows = profile.symptoms.map((key) => ({
    key,
    summary: describeSymptom(days, key, span, report.window_end),
  }));

  const notes = days
    .filter((d) => d.note && d.day >= report.window_start && d.day <= report.window_end)
    .slice(-3)
    .reverse()
    .map((d) => ({ day: d.day, note: d.note as string }));

  return (
    <ReportDocument
      report={report}
      rows={rows}
      interventions={interventions}
      questions={neutralQuestions(days, profile, interventions, span, report.window_end)}
      notes={notes}
      stage={profile.stage}
    />
  );
}
