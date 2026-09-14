import { listIdeas, listVideos } from "@/lib/queries";
import { VideosScreen } from "@/components/VideosScreen";

export const dynamic = "force-dynamic";

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ highlight?: string }> }) {
  const { highlight } = await searchParams;
  const videos = listVideos();
  const ideas = listIdeas().map((i) => ({ id: i.id, title: i.title }));
  return <VideosScreen videos={videos} ideas={ideas} highlight={highlight ? Number(highlight) : null} />;
}
