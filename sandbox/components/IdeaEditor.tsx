"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AutoInput, AutoSelect, AutoTextarea } from "./AutoField";
import { BeatsTable } from "./BeatsTable";
import { ScriptEditor } from "./ScriptEditor";
import {
  copyBeatsFromInspo,
  deleteIdea,
  setIdeaStatus,
  updateIdeaBeats,
  updateIdeaField,
} from "@/lib/actions";
import { FORMATS, STATUSES, type Beat, type Idea, type Status } from "@/lib/types";

type InspoPick = { id: number; title: string; creator: string; beats: Beat[] };

export function IdeaEditor({ idea: initial, inspo }: { idea: Idea; inspo: InspoPick[] }) {
  const router = useRouter();
  const [idea, setIdea] = useState(initial);
  const [beatsKey, setBeatsKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const save = (field: keyof Idea, value: string | number | null) => {
    setIdea((i) => ({ ...i, [field]: value }));
    return updateIdeaField(idea.id, field, value);
  };

  const linked = inspo.find((i) => i.id === idea.inspo_id) ?? null;

  const copyBeats = async () => {
    if (!linked) return;
    if (idea.beats.some((b) => b.what_happens || b.why_it_works) && !confirm("Replace the current beats with the inspo's structure?")) return;
    const beats = await copyBeatsFromInspo(idea.id);
    if (beats) {
      setIdea((i) => ({ ...i, beats }));
      setBeatsKey((k) => k + 1);
    }
  };

  const moveTo = async (status: Status) => {
    if (busy) return;
    setBusy(true);
    setIdea((i) => ({ ...i, status }));
    const { videoId } = await setIdeaStatus(idea.id, status);
    setBusy(false);
    if (videoId) router.push(`/videos?highlight=${videoId}`);
  };

  // Escape (outside a field) goes back to the board.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "Escape" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) router.push("/ideas");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/ideas" className="whitespace-nowrap text-mute hover:text-fg">← Ideas</Link>
        <AutoInput bare value={idea.title} onSave={(v) => save("title", v)} placeholder="Untitled idea" className="text-lg font-semibold" />
        <div className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap">
          <AutoSelect value={idea.status} options={STATUSES} onSave={(v) => moveTo(v)} className="w-32" />
          {idea.status !== "filmed" && idea.status !== "posted" ? (
            <button className="btn" disabled={busy} onClick={() => moveTo("filmed")}>Mark as filmed</button>
          ) : null}
          {idea.status !== "posted" ? (
            <button className="btn btn-primary" disabled={busy} onClick={() => moveTo("posted")}>Mark as posted</button>
          ) : (
            <Link href="/videos" className="btn">Open in Videos →</Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr_160px_1fr] gap-3">
        <div>
          <span className="label">Hook</span>
          <AutoTextarea rows={2} value={idea.hook} onSave={(v) => save("hook", v)} placeholder="First line out of my mouth." />
        </div>
        <div>
          <span className="label">One-liner</span>
          <AutoTextarea rows={2} value={idea.one_line} onSave={(v) => save("one_line", v)} placeholder="What the video is." />
        </div>
        <div>
          <span className="label">Format</span>
          <AutoSelect value={idea.format} options={FORMATS} onSave={(v) => save("format", v)} />
        </div>
        <div>
          <span className="label">Based on</span>
          <div className="flex items-center gap-2">
            <select
              className="field"
              value={idea.inspo_id ?? ""}
              onChange={(e) => save("inspo_id", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— none —</option>
              {inspo.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title || "Untitled"}{i.creator ? ` · ${i.creator}` : ""}
                </option>
              ))}
            </select>
            {linked ? (
              <Link href={`/inspo?id=${linked.id}`} className="text-mute hover:text-fg" title="Open inspo">↗</Link>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="label mb-0">Beats</span>
          <button className="btn btn-sm" disabled={!linked} title={linked ? "" : "Pick an inspo first"} onClick={copyBeats}>
            Copy beats from inspo
          </button>
        </div>
        <BeatsTable key={beatsKey} beats={idea.beats} onChange={(b) => updateIdeaBeats(idea.id, b)} />
      </div>

      <div>
        <span className="label">Script</span>
        <ScriptEditor value={idea.script} onSave={(v) => save("script", v)} />
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-mute">
        <span>Created {idea.created_at.slice(0, 10)} · updated {idea.updated_at.slice(0, 10)}</span>
        <button
          className="hover:text-fg"
          onClick={() => {
            if (confirm("Delete this idea?")) void deleteIdea(idea.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
