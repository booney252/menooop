"use client";

import { SYMPTOM_BY_KEY, type SymptomKey } from "@/lib/symptoms";
import type { Insight } from "@/lib/types";

/**
 * The small comparison under an insight sentence. Never a chart with axes —
 * two lengths of the same pigment, labelled in words. The sentence above
 * always carries the meaning; this only shows the shape of it.
 */
export function InsightVisual({ insight, paper = false }: { insight: Insight; paper?: boolean }) {
  const p = insight.payload as Record<string, number | string | boolean>;

  switch (insight.kind) {
    case "intervention_response":
      return (
        <Pair
          paper={paper}
          left={{ label: "Before", value: Number(p.before) }}
          right={{ label: `Since ${String(p.intervention).toLowerCase()}`, value: Number(p.after) }}
        />
      );
    case "lag_effect":
      return (
        <Pair
          paper={paper}
          left={{ label: "A usual day", value: Number(p.afterCalm) }}
          right={{ label: "The day after a rough one", value: Number(p.afterRough) }}
        />
      );
    case "cycle_phase":
      return (
        <Pair
          paper={paper}
          left={{ label: "Rest of the month", value: Number(p.baseline) }}
          right={{ label: "The days before", value: Number(p.windowAvg) }}
        />
      );
    case "positive_streak":
      return <Run count={Number(p.days)} filled={Number(p.days)} paper={paper} />;
    case "not_yet":
      return <Run count={Number(p.needed)} filled={Number(p.logged)} paper={paper} />;
    default:
      return null;
  }
}

function Pair({
  left,
  right,
  paper,
}: {
  left: { label: string; value: number };
  right: { label: string; value: number };
  paper: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {[left, right].map((row, i) => (
        <div key={i}>
          <div
            className="h-[7px] w-full overflow-hidden rounded-full"
            style={{ background: paper ? "#e9dce3" : "var(--color-wash)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(4, Math.min(100, (row.value / 3) * 100))}%`,
                background: paper ? "var(--color-fig)" : "var(--color-figlift)",
              }}
            />
          </div>
          <p
            className="mt-1.5 text-[12.5px]"
            style={{ color: paper ? "#6a5461" : "var(--color-dune)" }}
          >
            {row.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function Run({ count, filled, paper }: { count: number; filled: number; paper: boolean }) {
  const total = Math.max(1, Math.min(count, 30));
  return (
    <div className="flex flex-wrap gap-[5px]">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-[7px] w-[7px] rounded-full"
          style={{
            background:
              i < filled
                ? paper
                  ? "var(--color-fig)"
                  : "var(--color-figlift)"
                : paper
                  ? "#e4d7df"
                  : "var(--color-wash)",
          }}
        />
      ))}
    </div>
  );
}

export function insightSubjectLabel(insight: Insight): string | null {
  const key = insight.subject as SymptomKey | null;
  return key && SYMPTOM_BY_KEY[key] ? SYMPTOM_BY_KEY[key].label : null;
}
