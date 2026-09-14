"use client";

import { useState } from "react";
import { exportCsv } from "@/lib/actions";

export function ExportButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {msg ? <span className="text-xs text-mute">{msg}</span> : null}
      <button
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await exportCsv();
            setMsg(`Wrote ${r.files.length} files to ./${r.dir}/ (${r.files[0].slice(0, 19)}-*)`);
          } finally {
            setBusy(false);
          }
        }}
      >
        Export CSV
      </button>
    </div>
  );
}
