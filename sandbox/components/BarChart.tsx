// Plain SVG bars. No library.
export function BarChart({
  title,
  data,
  unit,
}: {
  title: string;
  data: { label: string; value: number }[];
  unit?: string;
}) {
  const w = 640;
  const h = 160;
  const pad = { l: 8, r: 8, t: 18, b: 26 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = Math.max(1, data.length);
  const slot = (w - pad.l - pad.r) / n;
  const bw = Math.max(4, Math.min(28, slot * 0.7));
  const fmt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : String(v));

  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-mute">{title}</span>
        <span className="text-[11px] text-mute">{data.length ? `max ${fmt(max)}${unit ? " " + unit : ""}` : ""}</span>
      </div>
      {data.length === 0 ? (
        <div className="py-10 text-center text-xs text-mute">No videos yet.</div>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="block h-40 w-full" role="img" aria-label={title}>
          <line x1={pad.l} x2={w - pad.r} y1={h - pad.b} y2={h - pad.b} stroke="var(--color-line)" />
          {data.map((d, i) => {
            const x = pad.l + i * slot + (slot - bw) / 2;
            const bh = ((h - pad.t - pad.b) * d.value) / max;
            const y = h - pad.b - bh;
            return (
              <g key={i}>
                <title>{`${d.label}: ${d.value}${unit ? " " + unit : ""}`}</title>
                <rect x={x} y={y} width={bw} height={bh} fill="var(--color-accent)" opacity={0.85} rx={2} />
                {d.value > 0 ? (
                  <text x={x + bw / 2} y={y - 3} textAnchor="middle" fontSize="9" fill="var(--color-mute)">
                    {fmt(d.value)}
                  </text>
                ) : null}
                <text
                  x={x + bw / 2}
                  y={h - pad.b + 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--color-mute)"
                >
                  {d.label.length > Math.max(3, Math.floor(slot / 5.5)) ? d.label.slice(0, Math.max(2, Math.floor(slot / 5.5) - 1)) + "…" : d.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
