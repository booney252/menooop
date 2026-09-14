import { getDb } from "./db";
import { parseBeats } from "./beats";
import type { Idea, Inspo, Video } from "./types";
import { isoDaysAgo, spotsPer1k } from "./stats";

export { spotsPer1k, videoStats } from "./stats";

type Row = Record<string, unknown>;

function toInspo(r: Row): Inspo {
  return { ...(r as Omit<Inspo, "beats">), beats: parseBeats(r.beats) };
}
function toIdea(r: Row): Idea {
  return { ...(r as Omit<Idea, "beats">), beats: parseBeats(r.beats) };
}
// node:sqlite rows have a null prototype; copy into plain objects so they can cross to client components.
function toVideo(r: Row): Video {
  return { ...r } as unknown as Video;
}

export function listInspo(): Inspo[] {
  return (getDb().prepare("SELECT * FROM inspo ORDER BY added_at DESC, id DESC").all() as Row[]).map(toInspo);
}
export function getInspo(id: number): Inspo | null {
  const r = getDb().prepare("SELECT * FROM inspo WHERE id = ?").get(id) as Row | undefined;
  return r ? toInspo(r) : null;
}

export function listIdeas(): Idea[] {
  return (getDb().prepare("SELECT * FROM ideas ORDER BY updated_at DESC, id DESC").all() as Row[]).map(toIdea);
}
export function getIdea(id: number): Idea | null {
  const r = getDb().prepare("SELECT * FROM ideas WHERE id = ?").get(id) as Row | undefined;
  return r ? toIdea(r) : null;
}

export function listVideos(): Video[] {
  return (getDb().prepare("SELECT * FROM videos ORDER BY posted_at DESC, id DESC").all() as Row[]).map(toVideo);
}

// ---- derived numbers ----

export type WorkingRow = {
  video: Video;
  idea: Idea | null;
  rate: number;
};

// Top videos by founding spots per 1k views, with the idea's hook and format alongside.
export function whatsWorking(limit = 5): WorkingRow[] {
  const videos = listVideos();
  const ideas = new Map(listIdeas().map((i) => [i.id, i]));
  return videos
    .map((video) => ({ video, rate: spotsPer1k(video) }))
    .filter((x): x is { video: Video; rate: number } => x.rate !== null && x.rate > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, limit)
    .map(({ video, rate }) => ({
      video,
      rate,
      idea: video.idea_id ? ideas.get(video.idea_id) ?? null : null,
    }));
}

export function thisWeek() {
  const since = isoDaysAgo(7);
  const sinceIso = since + "T00:00:00";
  const db = getDb();
  const ideasByStatus = db
    .prepare("SELECT status, COUNT(*) AS n FROM ideas WHERE updated_at >= ? GROUP BY status")
    .all(sinceIso) as { status: string; n: number }[];
  const v = db
    .prepare(
      "SELECT COUNT(*) AS posted, COALESCE(SUM(views),0) AS views, COALESCE(SUM(founding_spots),0) AS spots FROM videos WHERE posted_at >= ?",
    )
    .get(since) as { posted: number; views: number; spots: number };
  return { since, ideasByStatus, ...v };
}
