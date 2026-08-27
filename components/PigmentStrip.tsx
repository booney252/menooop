"use client";

import { inkPigment, paperPigment } from "@/lib/pigment";
import type { Point } from "@/lib/insights";

/**
 * One mark a day, oldest on the left. A mark carries the day's weight twice —
 * in how tall it stands and how much pigment has soaked into it — so sixty
 * days still reads at a glance on a phone.
 */
export function PigmentStrip({
  points,
  height = 30,
  paper = false,
  animate = true,
}: {
  points: Point[];
  height?: number;
  paper?: boolean;
  animate?: boolean;
}) {
  const tint = paper ? paperPigment : inkPigment;
  return (
    <div
      className="flex w-full items-end gap-[2px] border-b"
      style={{ height, borderColor: paper ? "#dbcdba" : "var(--hair)" }}
    >
      {points.map((p, i) => {
        const v = p.value;
        const share = v === null ? 0.16 : 0.22 + (Math.max(0, Math.min(3, v)) / 3) * 0.78;
        return (
          <span
            key={p.date}
            className={`block flex-1 rounded-t-[1px] ${animate ? "soak" : ""}`}
            style={{
              height: `${share * 100}%`,
              background: tint(v),
              animationDelay: animate ? `${i * 7}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
