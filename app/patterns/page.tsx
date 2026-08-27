"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PigmentStrip } from "@/components/PigmentStrip";
import { Reveal } from "@/components/Reveal";
import { SYMPTOM_BY_ID } from "@/lib/data";
import { shortDate } from "@/lib/dates";
import { lutealLift, patternCards, series, summary, windowStart } from "@/lib/insights";
import { useStore } from "@/lib/store";

const RANGES = [30, 60] as const;

export default function Patterns() {
  const { ready, profile, entries } = useStore();
  const [range, setRange] = useState<(typeof RANGES)[number]>(60);

  if (!ready) return <AppShell tab="patterns"><div /></AppShell>;

  const cards = patternCards(entries, profile);
  const from = windowStart(entries, range);

  return (
    <AppShell tab="patterns">
      <div className="px-7 pt-14 pb-36">
        <Reveal delay={60}>
          <h1 className="display text-[31px] leading-[1.15] text-bone">
            What the last sixty days say
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-dune">
            One mark a day. The taller and deeper the mark, the heavier that day was.
          </p>
        </Reveal>

        {cards.length > 0 && (
          <Reveal delay={220} className="mt-10">
            <ul>
              {cards.map((c, n) => (
                <li key={c.title} className={n === 0 ? "" : "mt-7 border-t hair pt-7"}>
                  <div className="flex gap-3.5">
                    <span
                      aria-hidden
                      className="mt-[11px] h-[6px] w-[6px] shrink-0 rounded-full"
                      style={{ background: "var(--color-figlift)" }}
                    />
                    <div>
                      <h2 className="display text-[21px] leading-[1.3] text-bone">{c.title}</h2>
                      <p className="mt-2.5 text-[15px] leading-[1.65] text-dune">{c.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        <Reveal delay={420} className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="label">Symptom by symptom</h2>
            <div className="flex items-center gap-1.5" role="group" aria-label="Range">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  aria-pressed={range === r}
                  className="rounded-full border px-3.5 text-[13px] transition-colors duration-500"
                  style={{
                    minHeight: 34,
                    borderColor: range === r ? "var(--color-figlift)" : "var(--hair)",
                    background:
                      range === r
                        ? "color-mix(in srgb, var(--color-figlift) 26%, var(--color-clay))"
                        : "transparent",
                    color: range === r ? "var(--color-bone)" : "var(--color-dune)",
                  }}
                >
                  {r} days
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={470}>
          <div className="mt-5 flex justify-between border-b hair pb-2 text-[11px] tracking-[0.1em] text-dune uppercase">
            <span>{shortDate(from)}</span>
            <span>Today</span>
          </div>
        </Reveal>

        <div className="mt-7 flex flex-col gap-9">
          {profile.symptoms.map((id, n) => {
            const s = summary(entries, id);
            const lift = lutealLift(entries, id, profile);
            return (
              <Reveal key={id} delay={520 + n * 90}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[17px] text-[#ded3c7]">{SYMPTOM_BY_ID[id].label}</h3>
                  <span className="text-[13.5px] text-dune">{s.trend.word}</span>
                </div>
                <div className="mt-3.5">
                  <PigmentStrip points={series(entries, id, range)} />
                </div>
                <p className="mt-3 text-[14.5px] leading-relaxed text-dune">
                  Noticeable or worse on {s.felt} of {s.days} days, rough on {s.rough}.
                  {lift && lift.lift >= 30
                    ? ` Heaviest in the days before a period.`
                    : s.trend.word === "easing"
                      ? ` A little lighter these past two weeks.`
                      : ""}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
