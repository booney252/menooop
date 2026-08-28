import { notFound } from "next/navigation";
import { getReport } from "@/lib/data/reports";
import { OutcomeForm } from "./OutcomeForm";

export const dynamic = "force-dynamic";

export default async function Outcome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();
  return <OutcomeForm id={report.id} windowEnd={report.window_end} />;
}
