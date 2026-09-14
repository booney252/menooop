"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { newIdeaAndOpen, setIdeaStatus } from "@/lib/actions";
import { STATUSES, type Idea, type Status } from "@/lib/types";

const LABEL: Record<Status, string> = {
  idea: "Idea",
  scripted: "Scripted",
  filmed: "Filmed",
  posted: "Posted",
  killed: "Killed",
};

export function Kanban({ ideas: initial, inspoTitles }: { ideas: Idea[]; inspoTitles: Record<number, string> }) {
  const router = useRouter();
  const [ideas, setIdeas] = useState(initial);
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<Status | null>(null);

  const drop = async (status: Status) => {
    setOver(null);
    if (dragId === null) return;
    const id = dragId;
    setDragId(null);
    const cur = ideas.find((i) => i.id === id);
    if (!cur || cur.status === status) return;
    setIdeas((xs) => xs.map((i) => (i.id === id ? { ...i, status } : i)));
    const { videoId } = await setIdeaStatus(id, status);
    if (videoId) router.push(`/videos?highlight=${videoId}`);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-semibold">Ideas</h1>
        <form action={newIdeaAndOpen}>
          <button className="btn btn-primary">+ New idea</button>
        </form>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {STATUSES.map((status) => {
          const col = ideas.filter((i) => i.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                if (over !== status) setOver(status);
              }}
              onDragLeave={() => setOver((o) => (o === status ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                void drop(status);
              }}
              className={`min-h-[60vh] rounded-md border p-2 ${
                over === status && dragId !== null ? "border-accent/60 bg-panel2" : "border-line bg-panel/60"
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-1 text-[11px] uppercase tracking-wider text-mute">
                <span>{LABEL[status]}</span>
                <span className="tabular-nums">{col.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {col.map((i) => (
                  <Link
                    key={i.id}
                    href={`/ideas/${i.id}`}
                    draggable
                    onDragStart={(e) => {
                      setDragId(i.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOver(null);
                    }}
                    className={`block cursor-grab rounded-md border border-line bg-panel px-3 py-2 hover:border-mute/60 active:cursor-grabbing ${
                      dragId === i.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="font-medium leading-snug">{i.title || <span className="text-mute">Untitled</span>}</div>
                    {i.hook ? <div className="mt-1 line-clamp-2 text-xs text-mute">{i.hook}</div> : null}
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-mute">
                      <span className="rounded bg-panel2 px-1.5 py-px">{i.format}</span>
                      {i.inspo_id && inspoTitles[i.inspo_id] ? (
                        <span className="truncate">← {inspoTitles[i.inspo_id]}</span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
