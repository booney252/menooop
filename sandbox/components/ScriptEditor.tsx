"use client";

import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";

// Markdown editor with a live preview. This is the one place that does not save on blur:
// Cmd+S (or Ctrl+S) or the Save button.
export function ScriptEditor({ value, onSave }: { value: string; onSave: (v: string) => void | Promise<void> }) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(value);
  const [mode, setMode] = useState<"split" | "write" | "preview">("split");
  const dirty = draft !== saved;

  const save = async () => {
    if (!dirty) return;
    await onSave(draft);
    setSaved(draft);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Warn before leaving with unsaved script.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const html = useMemo(() => marked.parse(draft, { async: false, gfm: true, breaks: true }) as string, [draft]);

  return (
    <div className="rounded-md border border-line bg-panel">
      <div className="flex items-center gap-1 border-b border-line px-2 py-1 text-xs">
        {(["write", "split", "preview"] as const).map((m) => (
          <button
            key={m}
            className={`rounded px-2 py-0.5 ${mode === m ? "bg-panel2 text-fg" : "text-mute hover:text-fg"}`}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
        <span className="ml-auto text-mute">{dirty ? "unsaved" : "saved"}</span>
        <button className="btn btn-sm ml-2" disabled={!dirty} onClick={save}>
          Save <kbd>⌘S</kbd>
        </button>
      </div>
      <div className={`grid ${mode === "split" ? "grid-cols-2" : "grid-cols-1"} min-h-[420px]`}>
        {mode !== "preview" ? (
          <textarea
            className="min-h-[420px] w-full resize-y bg-transparent p-3 font-mono text-[13px] leading-relaxed outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={"# Title\n\nHook…\n\n## Beat 1 · Mission\n"}
            spellCheck
          />
        ) : null}
        {mode !== "write" ? (
          <div
            className={`md p-3 ${mode === "split" ? "border-l border-line" : ""}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}
      </div>
    </div>
  );
}
