"use client";

import { useState } from "react";
import { AutoInput, AutoTextarea } from "./AutoField";
import { blankBeat, BEAT_HINTS } from "@/lib/beats";
import type { Beat } from "@/lib/types";

// Twelve rows by default. Rows can be edited inline, reordered, deleted, added.
// Every change is saved as the whole array, since beats live as JSON on the parent row.
export function BeatsTable({
  beats,
  onChange,
  compact,
}: {
  beats: Beat[];
  onChange: (beats: Beat[]) => void | Promise<void>;
  compact?: boolean;
}) {
  const [rows, setRows] = useState<Beat[]>(beats);

  const commit = (next: Beat[]) => {
    setRows(next);
    void onChange(next);
  };
  const setCell = (i: number, key: keyof Beat, value: string) =>
    commit(rows.map((b, j) => (j === i ? { ...b, [key]: value } : b)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };
  const remove = (i: number) => commit(rows.filter((_, j) => j !== i));
  const add = () => commit([...rows, blankBeat()]);

  return (
    <div>
      <table className="w-full table-fixed border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-mute">
            <th className="w-7 pb-1 font-normal">#</th>
            <th className="w-[18%] pb-1 font-normal">Beat</th>
            <th className="w-16 pb-1 font-normal">Time</th>
            <th className="pb-1 font-normal">What happens</th>
            <th className="pb-1 font-normal">Why it works</th>
            <th className="w-[68px] pb-1 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b, i) => (
            <tr key={i} className="border-t border-line align-top">
              <td className="py-1.5 pr-1 text-mute tabular-nums">{i + 1}</td>
              <td className="py-1 pr-1">
                <AutoInput bare value={b.name} placeholder="beat" onSave={(v) => setCell(i, "name", v)} className="font-medium" />
                {!compact && BEAT_HINTS[b.name] ? (
                  <div className="px-1 text-[11px] leading-snug text-mute">{BEAT_HINTS[b.name]}</div>
                ) : null}
              </td>
              <td className="py-1 pr-1">
                <AutoInput bare value={b.timestamp} placeholder="0:00" onSave={(v) => setCell(i, "timestamp", v)} className="tabular-nums" />
              </td>
              <td className="py-1 pr-1">
                <AutoTextarea bare rows={compact ? 1 : 2} value={b.what_happens} placeholder="…" onSave={(v) => setCell(i, "what_happens", v)} className="resize-y" />
              </td>
              <td className="py-1 pr-1">
                <AutoTextarea bare rows={compact ? 1 : 2} value={b.why_it_works} placeholder="…" onSave={(v) => setCell(i, "why_it_works", v)} className="resize-y" />
              </td>
              <td className="py-1.5 whitespace-nowrap text-mute">
                <button type="button" title="Move up" className="px-1 hover:text-fg disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" title="Move down" className="px-1 hover:text-fg disabled:opacity-30" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button type="button" title="Delete beat" className="px-1 hover:text-fg" onClick={() => remove(i)}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn btn-sm mt-2" onClick={add}>
        + Add beat
      </button>
    </div>
  );
}
