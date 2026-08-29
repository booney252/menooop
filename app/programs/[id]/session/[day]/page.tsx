import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/data/history";
import { getCompletions, getEnrollments } from "@/lib/data/programs";
import { isProgramId, PROGRAM_BY_ID, sessionFor, totalDays } from "@/content/programs";
import { SessionPlayer } from "./SessionPlayer";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string; day: string }>;
}) {
  const { id, day } = await params;
  if (!isProgramId(id)) notFound();

  const profile = await getProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const dayIndex = Number(day);
  const session = sessionFor(id, dayIndex);
  if (!session) notFound();

  const enrollments = await getEnrollments();
  const enrollment = enrollments.find(
    (e) => e.program_id === id && e.status !== "stopped"
  );
  if (!enrollment) redirect(`/programs/${id}`);

  const completions = await getCompletions(enrollment.id);

  return (
    <SessionPlayer
      programId={id}
      programName={PROGRAM_BY_ID[id].name}
      enrollmentId={enrollment.id}
      session={session}
      total={totalDays(id)}
      alreadyDone={completions.some((c) => c.day_index === dayIndex)}
    />
  );
}
