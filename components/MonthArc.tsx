"use client";

import { daysEnding, type Day } from "@/lib/day";
import { SYMPTOM_BY_KEY, type SymptomKey } from "@/lib/symptoms";
import { inkPigment } from "@/lib/pigment";
import type { DayRecord } from "@/lib/types";

const SPAN = 30;
const W = 342;
const H = 92;

/** the weight of one day: burden symptoms as logged, the positive one flipped */
export function dayLoad(record: DayRecord | undefined, symptoms: SymptomKey[]): number | null {
  if (!record) return null;
  const values = symptoms
    .map((key) => {
      const v = record.severities[key];
      if (typeof v !== "number") return null;
      return SYMPTOM_BY_KEY[key]?.kind === "positive" ? 3 - v : v;
    })
    .filter((v): v is number => v !== null);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/**
 * Her month as a soft arc. One dot a day, pigment = how heavy that day was.
 * Today sits at the near end, ringed.
 */
export function MonthArc({
  days,
  endDay,
  symptoms,
}: {
  days: DayRecord[];
  endDay: Day;
  symptoms: SymptomKey[];
}) {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const window = daysEnding(endDay, SPAN);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`The last ${SPAN} days. Each mark is one day; deeper marks were heavier days.`}
    >
      {window.map((day, i) => {
        const t = i / (SPAN - 1);
        const x = 11 + t * (W - 22);
        const y = 70 - 46 * Math.sin(Math.PI * t);
        const load = dayLoad(byDay.get(day), symptoms);
        const isToday = i === SPAN - 1;
        return (
          <g key={day}>
            {isToday && (
              <circle cx={x} cy={y} r="8.5" fill="none" stroke="var(--color-dune)" strokeWidth="1" opacity="0.55" />
            )}
            <circle
              cx={x}
              cy={y}
              r={isToday ? 4.4 : 3.2}
              fill={load === null ? "var(--color-wash)" : inkPigment(load)}
              className="soak"
              style={{ animationDelay: `${240 + i * 16}ms` }}
            />
          </g>
        );
      })}
    </svg>
  );
}
