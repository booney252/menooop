"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AutoInput, AutoNumber, AutoSelect } from "./AutoField";
import { BarChart } from "./BarChart";
import { createVideo, deleteVideo, updateVideoField } from "@/lib/actions";
import { spotsPer1k, videoStats } from "@/lib/stats";
import { PLATFORMS, type Video } from "@/lib/types";

type Col = {
  key: keyof Video | "rate";
  label: string;
  kind: "text" | "url" | "date" | "platform" | "num" | "notes" | "rate" | "idea";
  width?: string;
};

const COLS: Col[] = [
  { key: "title", label: "Title", kind: "text", width: "minmax(180px,1.4fr)" },
  { key: "url", label: "URL", kind: "url", width: "36px" },
  { key: "platform", label: "Platform", kind: "platform", width: "92px" },
  { key: "posted_at", label: "Posted", kind: "date", width: "118px" },
  { key: "views", label: "Views", kind: "num", width: "80px" },
  { key: "likes", label: "Likes", kind: "num", width: "70px" },
  { key: "comments", label: "Comments", kind: "num", width: "80px" },
  { key: "shares", label: "Shares", kind: "num", width: "70px" },
  { key: "saves", label: "Saves", kind: "num", width: "70px" },
  { key: "follows_gained", label: "Follows", kind: "num", width: "70px" },
  { key: "link_clicks", label: "Clicks", kind: "num", width: "70px" },
  { key: "founding_spots", label: "Spots", kind: "num", width: "64px" },
  { key: "rate", label: "Spots/1k", kind: "rate", width: "72px" },
  { key: "notes", label: "Notes", kind: "notes", width: "minmax(180px,1.6fr)" },
];

const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toLocaleString());

export function VideosScreen({
  videos: initial,
  ideas,
  highlight,
}: {
  videos: Video[];
  ideas: { id: number; title: string }[];
  highlight: number | null;
}) {
  const [videos, setVideos] = useState(initial);
  const [sort, setSort] = useState<{ key: Col["key"]; dir: 1 | -1 }>({ key: "posted_at", dir: -1 });
  const [flash, setFlash] = useState<number | null>(highlight);
  const ideaTitle = useMemo(() => new Map(ideas.map((i) => [i.id, i.title])), [ideas]);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (flash === null) return;
    highlightRef.current?.scrollIntoView({ block: "center" });
    const t = setTimeout(() => setFlash(null), 2500);
    return () => clearTimeout(t);
  }, [flash]);

  const save = (id: number, field: keyof Video, value: string | number | null) => {
    setVideos((xs) => xs.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
    return updateVideoField(id, field, value);
  };

  const add = async () => {
    const id = await createVideo();
    const row: Video = {
      id,
      idea_id: null,
      title: "",
      url: "",
      platform: "youtube",
      posted_at: new Date().toISOString().slice(0, 10),
      views: null, likes: null, comments: null, shares: null, saves: null,
      follows_gained: null, link_clicks: null, founding_spots: null,
      notes: "",
      logged_at: new Date().toISOString(),
    };
    setVideos((xs) => [row, ...xs]);
    setFlash(id);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this video row?")) return;
    setVideos((xs) => xs.filter((v) => v.id !== id));
    await deleteVideo(id);
  };

  const sorted = useMemo(() => {
    const get = (v: Video) => (sort.key === "rate" ? spotsPer1k(v) : v[sort.key]);
    return [...videos].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (x === null || x === undefined || x === "") return 1;
      if (y === null || y === undefined || y === "") return -1;
      if (typeof x === "number" && typeof y === "number") return (x - y) * sort.dir;
      return String(x).localeCompare(String(y)) * sort.dir;
    });
  }, [videos, sort]);

  const stats = videoStats(videos);
  const last20 = [...videos].sort((a, b) => a.posted_at.localeCompare(b.posted_at) || a.id - b.id).slice(-20);
  const label = (v: Video) => v.title || `#${v.id}`;

  const toggleSort = (key: Col["key"]) =>
    setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "title" || key === "platform" ? 1 : -1 }));

  const gridCols = COLS.map((c) => c.width ?? "1fr").join(" ") + " 28px";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Videos</h1>
        <button className="btn btn-primary" onClick={add}>+ Log video</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Views, last 30 days" value={fmt(stats.views30)} />
        <Stat label="Founding spots, all time" value={fmt(stats.totalSpots)} />
        <Stat label="Best by views" value={stats.bestByViews ? label(stats.bestByViews) : "—"} sub={stats.bestByViews ? `${fmt(stats.bestByViews.views)} views` : ""} />
        <Stat
          label="Best by spots / 1k views"
          value={stats.bestByRate ? label(stats.bestByRate.v) : "—"}
          sub={stats.bestByRate ? `${stats.bestByRate.rate.toFixed(2)} per 1k` : ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <BarChart title="Views per video, last 20" data={last20.map((v) => ({ label: label(v), value: v.views ?? 0 }))} />
        <BarChart title="Founding spots per video, last 20" data={last20.map((v) => ({ label: label(v), value: v.founding_spots ?? 0 }))} unit="spots" />
      </div>

      <div className="overflow-x-auto rounded-md border border-line">
        <div className="min-w-[1500px] text-[13px]">
          <div className="grid items-center border-b border-line bg-panel px-1 text-[11px] uppercase tracking-wider text-mute" style={{ gridTemplateColumns: gridCols }}>
            {COLS.map((c) => (
              <button
                key={c.key}
                className={`px-1 py-2 text-left hover:text-fg ${c.kind === "num" || c.kind === "rate" ? "text-right" : ""}`}
                onClick={() => toggleSort(c.key)}
              >
                {c.label}
                {sort.key === c.key ? <span className="ml-0.5">{sort.dir === 1 ? "↑" : "↓"}</span> : null}
              </button>
            ))}
            <span />
          </div>
          {sorted.length === 0 ? (
            <div className="px-3 py-8 text-center text-mute">No videos logged. Post an idea, or log one by hand.</div>
          ) : null}
          {sorted.map((v) => (
            <div
              key={v.id}
              ref={v.id === flash ? highlightRef : undefined}
              className={`grid items-center border-b border-line px-1 last:border-b-0 ${v.id === flash ? "bg-accent/15" : "hover:bg-panel/70"}`}
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="px-0.5">
                <AutoInput bare value={v.title} placeholder="Title" onSave={(x) => save(v.id, "title", x)} />
                {v.idea_id ? (
                  <Link href={`/ideas/${v.idea_id}`} className="block truncate px-1 text-[11px] text-mute hover:text-fg">
                    ← {ideaTitle.get(v.idea_id) || `idea #${v.idea_id}`}
                  </Link>
                ) : null}
              </div>
              <UrlCell value={v.url} onSave={(x) => save(v.id, "url", x)} />
              <div className="px-0.5">
                <AutoSelect bare value={v.platform} options={PLATFORMS} onSave={(x) => save(v.id, "platform", x)} />
              </div>
              <div className="px-0.5">
                <AutoInput bare type="date" value={v.posted_at} onSave={(x) => save(v.id, "posted_at", x)} className="tabular-nums" />
              </div>
              {(["views", "likes", "comments", "shares", "saves", "follows_gained", "link_clicks", "founding_spots"] as const).map((k) => (
                <div key={k} className="px-0.5">
                  <AutoNumber bare value={v[k]} onSave={(x) => save(v.id, k, x)} />
                </div>
              ))}
              <div className="px-1.5 text-right tabular-nums text-mute">
                {spotsPer1k(v) === null ? "—" : spotsPer1k(v)!.toFixed(2)}
              </div>
              <div className="px-0.5">
                <AutoInput bare value={v.notes} placeholder="What worked / didn't" onSave={(x) => save(v.id, "notes", x)} />
              </div>
              <button className="px-1 text-mute hover:text-fg" title="Delete" onClick={() => remove(v.id)}>×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-line bg-panel px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-mute">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold tabular-nums">{value}</div>
      {sub ? <div className="text-xs text-mute">{sub}</div> : null}
    </div>
  );
}

function UrlCell({ value, onSave }: { value: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <div className="flex items-center justify-center gap-1 text-mute">
        {value ? (
          <a href={value} target="_blank" rel="noreferrer" className="hover:text-accent" title={value}>↗</a>
        ) : null}
        <button className="hover:text-fg" title={value ? "Edit URL" : "Add URL"} onClick={() => setEditing(true)}>
          {value ? "·" : "+"}
        </button>
      </div>
    );
  }
  return (
    <div className="absolute z-10 w-[360px] rounded-md border border-line bg-panel p-1 shadow-lg">
      <AutoInput
        autoFocus
        value={value}
        placeholder="https://"
        onSave={async (v) => {
          await onSave(v);
          setEditing(false);
        }}
        onKeyDownCapture={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
      />
    </div>
  );
}
