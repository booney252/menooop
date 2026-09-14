import type { Video } from "./types";

// Pure helpers shared by server queries and client screens. No DB here.

export function spotsPer1k(v: Pick<Video, "views" | "founding_spots">): number | null {
  if (!v.views || v.views <= 0) return null;
  return ((v.founding_spots ?? 0) / v.views) * 1000;
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function videoStats(videos: Video[]) {
  const since30 = isoDaysAgo(30);
  const last30 = videos.filter((v) => v.posted_at >= since30);
  const views30 = last30.reduce((n, v) => n + (v.views ?? 0), 0);
  const totalSpots = videos.reduce((n, v) => n + (v.founding_spots ?? 0), 0);
  const bestByViews = videos.reduce<Video | null>(
    (best, v) => ((v.views ?? 0) > (best?.views ?? 0) ? v : best),
    null,
  );
  const bestByRate =
    videos
      .map((v) => ({ v, rate: spotsPer1k(v) }))
      .filter((x): x is { v: Video; rate: number } => x.rate !== null && x.rate > 0)
      .sort((a, b) => b.rate - a.rate)[0] ?? null;
  return { views30, totalSpots, bestByViews, bestByRate };
}
