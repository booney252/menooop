import { listIdeas, listInspo } from "@/lib/queries";
import { Kanban } from "@/components/Kanban";

export const dynamic = "force-dynamic";

export default function IdeasPage() {
  const ideas = listIdeas();
  const inspo = new Map(listInspo().map((i) => [i.id, i.title || i.creator || `#${i.id}`]));
  return <Kanban ideas={ideas} inspoTitles={Object.fromEntries(inspo)} />;
}
