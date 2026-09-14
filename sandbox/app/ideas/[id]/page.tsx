import { notFound } from "next/navigation";
import { getIdea, listInspo } from "@/lib/queries";
import { IdeaEditor } from "@/components/IdeaEditor";

export const dynamic = "force-dynamic";

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = getIdea(Number(id));
  if (!idea) notFound();
  const inspo = listInspo().map((i) => ({ id: i.id, title: i.title, creator: i.creator, beats: i.beats }));
  return <IdeaEditor idea={idea} inspo={inspo} />;
}
