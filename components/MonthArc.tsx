"use client";

import { addDays, key, today } from "@/lib/dates";
import { dayLoad } from "@/lib/insights";
import { inkPigment } from "@/lib/pigment";
import type { Entry, Profile } from "@/lib/seed";

const DAYS = 30;
const W = 342;
const H = 92;

/**
 * Her month as a soft arc. One dot a day, pigment = how heavy that day was.
 * Today sits at the near end, ringed.
 */
export function MonthArc({
  entries,
  profile,
}: {
  entries: Record<string, Entry>;
  profile: Profile;
}) {
  const anchor = today();
  const dots = Array.from({ length: DAYS }, (_, i) => {
    const daysAgo = DAYS - 1 - i;
    const k = key(addDays(anchor, -daysAgo));
    const t = i / (DAYS - 1);
    return {
      k,
      daysAgo,
      x: 11 + t * (W - 22),
      y: 70 - 46 * Math.sin(Math.PI * t),
      load: dayLoad(entries, k, profile.symptoms),
    };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`The last ${DAYS} days. Each mark is one day; deeper marks were heavier days.`}
    >
      {dots.map((d, i) => {
        const isToday = d.daysAgo === 0;
        return (
          <g key={d.k}>
            {isToday && (
              <circle
                cx={d.x}
                cy={d.y}
                r="8.5"
                fill="none"
                stroke="var(--color-dune)"
                strokeWidth="1"
                opacity="0.55"
              />
            )}
            <circle
              cx={d.x}
              cy={d.y}
              r={isToday ? 4.4 : 3.2}
              fill={d.load === null ? "var(--color-wash)" : inkPigment(d.load)}
              className="soak"
              style={{ animationDelay: `${240 + i * 16}ms` }}
            />
          </g>
        );
      })}
    </svg>
  );
}
