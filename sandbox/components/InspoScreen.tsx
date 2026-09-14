"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AutoInput, AutoSelect, AutoTextarea } from "./AutoField";
import { BeatsTable } from "./BeatsTable";
import { Stars } from "./Stars";
import { createInspo, deleteInspo, updateInspoBeats, updateInspoField } from "@/lib/actions";
import { detectPlatform, youtubeId } from "@/lib/platform";
import { defaultBeats } from "@/lib/beats";
import { PLATFORMS, type Inspo, type Platform } from "@/lib/types";

function tagList(tags: string): string[] {
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}

export function InspoScreen({ items: initial, initialId, openAdd }: { items: Inspo[]; initialId: number | null; openAdd?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [selectedId, setSelectedId] = useState<number | null>(initialId ?? initial[0]?.id ?? null);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [adding, setAdding] = useState(!!openAdd);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => tagList(i.tags).forEach((t) => s.add(t)));
    return [...s].sort();
  }, [items]);

  const visible = items.filter((i) => {
    if (platform && i.platform !== platform) return false;
    if (tag && !tagList(i.tags).includes(tag)) return false;
    if (q) {
      const hay = `${i.title} ${i.creator} ${i.tags} ${i.notes}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const patch = (id: number, p: Partial<Inspo>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const save = (id: number, field: keyof Inspo, value: string | number | null) => {
    patch(id, { [field]: value } as Partial<Inspo>);
    return updateInspoField(id, field, value);
  };

  const select = (id: number) => {
    setSelectedId(id);
    router.replace(`/inspo?id=${id}`, { scroll: false });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this inspo video?")) return;
    await deleteInspo(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
    setSelectedId(null);
  };

  return (
    <div className="grid grid-cols-[320px_1fr] gap-5">
      <aside className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            className="field"
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-primary whitespace-nowrap" onClick={() => setAdding(true)}>
            + Add
          </button>
        </div>
        <div className="flex gap-2">
          <select className="field" value={platform} onChange={(e) => setPlatform(e.target.value as Platform | "")}>
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select className="field" value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <ul className="flex flex-col gap-1">
          {visible.length === 0 ? (
            <li className="px-2 py-6 text-center text-mute">
              {items.length === 0 ? "Nothing saved yet." : "No matches."}
            </li>
          ) : null}
          {visible.map((i) => (
            <li key={i.id}>
              <button
                onClick={() => select(i.id)}
                className={`block w-full rounded-md border px-3 py-2 text-left ${
                  i.id === selectedId ? "border-accent/60 bg-panel2" : "border-line bg-panel hover:bg-panel2"
                }`}
              >
                <div className="truncate font-medium">{i.title || <span className="text-mute">Untitled</span>}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-mute">
                  <span className="truncate">{i.creator || "—"}</span>
                  <span>·</span>
                  <span>{i.platform}</span>
                  {i.rating ? <span className="ml-auto text-fg">{"★".repeat(i.rating)}</span> : null}
                </div>
                {i.tags ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tagList(i.tags).map((t) => (
                      <span key={t} className="rounded bg-panel2 px-1.5 py-px text-[11px] text-mute">{t}</span>
                    ))}
                  </div>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="min-w-0">
        {selected ? (
          <InspoDetail key={selected.id} inspo={selected} save={save} onDelete={() => remove(selected.id)} />
        ) : (
          <div className="rounded-md border border-dashed border-line p-10 text-center text-mute">
            Select a video, or add one.
          </div>
        )}
      </section>

      {adding ? (
        <AddInspo
          onClose={() => setAdding(false)}
          onCreated={(row) => {
            setItems((xs) => [row, ...xs]);
            setAdding(false);
            select(row.id);
          }}
        />
      ) : null}
    </div>
  );
}

function InspoDetail({
  inspo,
  save,
  onDelete,
}: {
  inspo: Inspo;
  save: (id: number, field: keyof Inspo, value: string | number | null) => Promise<void>;
  onDelete: () => void;
}) {
  const yt = inspo.platform === "youtube" ? youtubeId(inspo.url) : null;
  const s = (field: keyof Inspo) => (v: string | number | null) => save(inspo.id, field, v);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_1fr_120px_140px] gap-3">
        <div>
          <span className="label">Title</span>
          <AutoInput value={inspo.title} onSave={s("title")} placeholder="Title" />
        </div>
        <div>
          <span className="label">Creator</span>
          <AutoInput value={inspo.creator} onSave={s("creator")} placeholder="Creator" />
        </div>
        <div>
          <span className="label">Platform</span>
          <AutoSelect value={inspo.platform} options={PLATFORMS} onSave={s("platform")} />
        </div>
        <div>
          <span className="label">Steal rating</span>
          <Stars value={inspo.rating} onChange={(v) => save(inspo.id, "rating", v)} />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-3">
        <div>
          <span className="label">
            URL
            {inspo.url ? (
              <>
                {" · "}
                <a href={inspo.url} target="_blank" rel="noreferrer" className="text-accent hover:underline normal-case tracking-normal">
                  open ↗
                </a>
              </>
            ) : null}
          </span>
          <AutoInput
            value={inspo.url}
            onSave={async (v) => {
              await save(inspo.id, "url", v);
              const p = detectPlatform(v);
              if (v && p !== inspo.platform) await save(inspo.id, "platform", p);
            }}
            placeholder="https://"
          />
        </div>
        <div>
          <span className="label">Tags (comma separated)</span>
          <AutoInput value={inspo.tags} onSave={s("tags")} placeholder="hook, stunt, founder" />
        </div>
      </div>

      {yt ? (
        <div className="aspect-video w-full max-w-[720px] overflow-hidden rounded-md border border-line bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${yt}`}
            title={inspo.title || "YouTube"}
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="label">Transcript</span>
          <AutoTextarea rows={12} value={inspo.transcript} onSave={s("transcript")} placeholder="Paste the transcript." className="font-mono text-[12.5px]" />
        </div>
        <div>
          <span className="label">Notes</span>
          <AutoTextarea rows={12} value={inspo.notes} onSave={s("notes")} placeholder="What to steal, what to skip." />
        </div>
      </div>

      <div>
        <span className="label">Beats</span>
        <BeatsTable beats={inspo.beats} onChange={(b) => updateInspoBeats(inspo.id, b)} />
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-mute">
        <span>Added {inspo.added_at.slice(0, 10)}</span>
        <button className="hover:text-fg" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function AddInspo({ onClose, onCreated }: { onClose: () => void; onCreated: (row: Inspo) => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [busy, setBusy] = useState(false);
  const platform = detectPlatform(url);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const id = await createInspo({ url, title, creator });
    onCreated({
      id,
      url: url.trim(),
      title: title.trim(),
      creator: creator.trim(),
      platform,
      added_at: new Date().toISOString(),
      transcript: "",
      notes: "",
      beats: defaultBeats(),
      tags: "",
      rating: null,
    });
  };

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center bg-black/60 pt-[15vh]" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-[440px] rounded-lg border border-line bg-panel p-4 shadow-xl"
      >
        <div className="mb-3 text-sm font-semibold">Add inspo</div>
        <label className="label">URL</label>
        <input className="field mb-3" autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste the link" />
        <label className="label">Title</label>
        <input className="field mb-3" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="label">Creator</label>
        <input className="field mb-3" value={creator} onChange={(e) => setCreator(e.target.value)} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-mute">Platform: {url ? platform : "—"}</span>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>Add</button>
          </div>
        </div>
      </form>
    </div>
  );
}
