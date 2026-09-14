"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, EXPORT_DIR } from "./db";
import { defaultBeats, parseBeats } from "./beats";
import { detectPlatform } from "./platform";
import { toCsv } from "./csv";
import { getIdea, getInspo } from "./queries";
import {
  FORMATS,
  PLATFORMS,
  STATUSES,
  VIDEO_METRICS,
  type Beat,
  type Format,
  type Platform,
  type Status,
} from "./types";

function refresh() {
  revalidatePath("/", "layout");
}

const INSPO_TEXT = new Set(["url", "title", "creator", "transcript", "notes", "tags"]);
const IDEA_TEXT = new Set(["title", "hook", "one_line", "script"]);
const VIDEO_TEXT = new Set(["title", "url", "notes", "posted_at"]);

function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : null;
}

// ---------- inspo ----------

export async function createInspo(input: { url: string; title: string; creator: string }) {
  const url = input.url.trim();
  const platform = detectPlatform(url);
  const r = getDb()
    .prepare("INSERT INTO inspo (url, title, creator, platform, beats) VALUES (?, ?, ?, ?, ?)")
    .run(url, input.title.trim(), input.creator.trim(), platform, JSON.stringify(defaultBeats()));
  refresh();
  return Number(r.lastInsertRowid);
}

export async function updateInspoField(id: number, field: string, value: string | number | null) {
  const db = getDb();
  if (INSPO_TEXT.has(field)) {
    db.prepare(`UPDATE inspo SET ${field} = ? WHERE id = ?`).run(String(value ?? ""), id);
  } else if (field === "platform") {
    if (!PLATFORMS.includes(value as Platform)) return;
    db.prepare("UPDATE inspo SET platform = ? WHERE id = ?").run(value, id);
  } else if (field === "rating") {
    const n = intOrNull(value);
    db.prepare("UPDATE inspo SET rating = ? WHERE id = ?").run(n === null ? null : Math.max(1, Math.min(5, n)), id);
  } else {
    return;
  }
  refresh();
}

export async function updateInspoBeats(id: number, beats: Beat[]) {
  getDb().prepare("UPDATE inspo SET beats = ? WHERE id = ?").run(JSON.stringify(parseBeats(beats)), id);
  refresh();
}

export async function deleteInspo(id: number) {
  getDb().prepare("DELETE FROM inspo WHERE id = ?").run(id);
  refresh();
}

// ---------- ideas ----------

export async function createIdea(input?: { title?: string; inspo_id?: number | null }) {
  const inspo = input?.inspo_id ? getInspo(input.inspo_id) : null;
  const r = getDb()
    .prepare("INSERT INTO ideas (title, inspo_id, beats) VALUES (?, ?, ?)")
    .run(input?.title?.trim() ?? "", inspo ? inspo.id : null, JSON.stringify(defaultBeats()));
  refresh();
  return Number(r.lastInsertRowid);
}

// Used by the "n" shortcut and the quick-add buttons: create, then open the editor.
export async function newIdeaAndOpen() {
  const id = await createIdea();
  redirect(`/ideas/${id}`);
}

const touch = "updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')";

export async function updateIdeaField(id: number, field: string, value: string | number | null) {
  const db = getDb();
  if (IDEA_TEXT.has(field)) {
    db.prepare(`UPDATE ideas SET ${field} = ?, ${touch} WHERE id = ?`).run(String(value ?? ""), id);
  } else if (field === "format") {
    if (!FORMATS.includes(value as Format)) return;
    db.prepare(`UPDATE ideas SET format = ?, ${touch} WHERE id = ?`).run(value, id);
  } else if (field === "status") {
    if (!STATUSES.includes(value as Status)) return;
    db.prepare(`UPDATE ideas SET status = ?, ${touch} WHERE id = ?`).run(value, id);
  } else if (field === "inspo_id") {
    const n = intOrNull(value);
    db.prepare(`UPDATE ideas SET inspo_id = ?, ${touch} WHERE id = ?`).run(n && getInspo(n) ? n : null, id);
  } else {
    return;
  }
  refresh();
}

export async function updateIdeaBeats(id: number, beats: Beat[]) {
  getDb().prepare(`UPDATE ideas SET beats = ?, ${touch} WHERE id = ?`).run(JSON.stringify(parseBeats(beats)), id);
  refresh();
}

// Copies the linked inspo's beat names and why_it_works; what_happens is left for my version.
export async function copyBeatsFromInspo(ideaId: number): Promise<Beat[] | null> {
  const idea = getIdea(ideaId);
  if (!idea?.inspo_id) return null;
  const inspo = getInspo(idea.inspo_id);
  if (!inspo) return null;
  const beats: Beat[] = inspo.beats.map((b) => ({
    name: b.name,
    timestamp: "",
    what_happens: "",
    why_it_works: b.why_it_works,
  }));
  getDb().prepare(`UPDATE ideas SET beats = ?, ${touch} WHERE id = ?`).run(JSON.stringify(beats), ideaId);
  refresh();
  return beats;
}

export async function setIdeaStatus(id: number, status: Status): Promise<{ videoId: number | null }> {
  if (!STATUSES.includes(status)) return { videoId: null };
  const db = getDb();
  const idea = getIdea(id);
  if (!idea) return { videoId: null };
  db.prepare(`UPDATE ideas SET status = ?, ${touch} WHERE id = ?`).run(status, id);
  let videoId: number | null = null;
  if (status === "posted") {
    // Moving to posted logs the video, pre-linked to this idea. Only once.
    const existing = db.prepare("SELECT id FROM videos WHERE idea_id = ? LIMIT 1").get(id) as { id: number } | undefined;
    if (existing) {
      videoId = existing.id;
    } else {
      const inspo = idea.inspo_id ? getInspo(idea.inspo_id) : null;
      const platform: Platform = idea.format === "short" ? "tiktok" : inspo?.platform ?? "youtube";
      const r = db
        .prepare("INSERT INTO videos (idea_id, title, platform) VALUES (?, ?, ?)")
        .run(id, idea.title, platform);
      videoId = Number(r.lastInsertRowid);
    }
  }
  refresh();
  return { videoId };
}

export async function deleteIdea(id: number) {
  getDb().prepare("DELETE FROM ideas WHERE id = ?").run(id);
  refresh();
  redirect("/ideas");
}

// ---------- videos ----------

export async function createVideo(input?: { title?: string; idea_id?: number | null }) {
  const r = getDb()
    .prepare("INSERT INTO videos (title, idea_id) VALUES (?, ?)")
    .run(input?.title?.trim() ?? "", input?.idea_id ?? null);
  refresh();
  return Number(r.lastInsertRowid);
}

export async function updateVideoField(id: number, field: string, value: string | number | null) {
  const db = getDb();
  if (VIDEO_TEXT.has(field)) {
    const s = String(value ?? "");
    if (field === "posted_at" && !/^\d{4}-\d{2}-\d{2}$/.test(s)) return;
    db.prepare(`UPDATE videos SET ${field} = ? WHERE id = ?`).run(s, id);
    if (field === "url" && s) {
      // Platform follows the URL, same as inspo.
      db.prepare("UPDATE videos SET platform = ? WHERE id = ?").run(detectPlatform(s), id);
    }
  } else if (field === "platform") {
    if (!PLATFORMS.includes(value as Platform)) return;
    db.prepare("UPDATE videos SET platform = ? WHERE id = ?").run(value, id);
  } else if ((VIDEO_METRICS as readonly string[]).includes(field)) {
    db.prepare(`UPDATE videos SET ${field} = ? WHERE id = ?`).run(intOrNull(value), id);
  } else if (field === "idea_id") {
    const n = intOrNull(value);
    db.prepare("UPDATE videos SET idea_id = ? WHERE id = ?").run(n && getIdea(n) ? n : null, id);
  } else {
    return;
  }
  refresh();
}

export async function deleteVideo(id: number) {
  getDb().prepare("DELETE FROM videos WHERE id = ?").run(id);
  refresh();
}

// ---------- export ----------

export async function exportCsv(): Promise<{ dir: string; files: string[] }> {
  const db = getDb();
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const tables: Record<string, string[]> = {
    inspo: ["id", "url", "title", "creator", "platform", "added_at", "transcript", "notes", "beats", "tags", "rating"],
    ideas: ["id", "title", "hook", "one_line", "format", "status", "inspo_id", "script", "beats", "created_at", "updated_at"],
    videos: [
      "id", "idea_id", "title", "url", "platform", "posted_at",
      "views", "likes", "comments", "shares", "saves", "follows_gained", "link_clicks", "founding_spots",
      "notes", "logged_at",
    ],
  };
  const files: string[] = [];
  for (const [table, columns] of Object.entries(tables)) {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id`).all() as Record<string, unknown>[];
    const file = `${stamp}-${table}.csv`;
    fs.writeFileSync(path.join(EXPORT_DIR, file), toCsv(rows, columns), "utf8");
    files.push(file);
  }
  return { dir: path.relative(process.cwd(), EXPORT_DIR), files };
}
