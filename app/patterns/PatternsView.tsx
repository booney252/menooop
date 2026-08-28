"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PigmentStrip } from "@/components/PigmentStrip";
import { InsightVisual } from "@/components/InsightVisual";
import { Reveal } from "@/components/Reveal";
import { describeSymptom, symptomHeading, trendWord } from "@/lib/insights/describe";
import { longDay, shiftDay, shortDay, type Day } from "@/lib/day";
import type { DayRecord, Insight, Profile } from "@/lib/types";

const SPANS = [30, 60] as const;

export function PatternsView({
  profile,
  days,
  insights,
  today,
}: {
  profile: Profile;
  days: DayRecord[];
  insights: Insight[];
  today: Day;
}) {
  const [span, setSpan] = useState<(typeof SPANS)[number]>(60);
  const from = shiftDay(today, -(span - 1));
  const logged = days.length;

  return (
    <AppShell tab="patterns">
      <div className="px-7 pt-14 pb-36">
        <Reveal delay={60}>
          <h1 className="display text-[31px] leading-[1.15] text-bone">
            {logged >= 21 ? "What your logs say" : "What you have so far"}
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-dune">
            {logged === 0
              ? "Nothing here yet. One check-in and this page starts filling in."
              : "One mark a day. The taller and deeper the mark, the heavier that day was."}
          </p>
        </Reveal>

        {insights.length > 0 && (
          <Reveal delay={220} className="mt-10">
            <h2 className="label mb-5">What Marlow has noticed</h2>
            <ul>
              {insights.map((insight, n) => (
                <li key={insight.id} className={n === 0 ? "" : "mt-7 border-t hair pt-7"}>
                  <div className="flex gap-3.5">
                    <span
                      aria-hidden
                      className="mt-[11px] h-[6px] w-[6px] shrink-0 rounded-full"
                      style={{ background: "var(--color-figlift)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="display text-[20px] leading-[1.32] text-bone">
                        {insight.sentence}
                      </h3>
                      {insight.detail && (
                        <p className="mt-2.5 text-[14.5px] leading-[1.6] text-dune">
                          {insight.detail}
                        </p>
                      )}
                      <div className="mt-4">
                        <InsightVisual insight={insight} />
                      </div>
                      <p className="mt-3 text-[12px] tracking-[0.08em] text-dune uppercase">
                        {longDay(insight.for_date)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {logged > 0 && (
          <>
            <Reveal delay={420} className="mt-12">
              <div className="flex items-center justify-between">
                <h2 className="label">Symptom by symptom</h2>
                <div className="flex items-center gap-1.5" role="group" aria-label="Range">
                  {SPANS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpan(s)}
                      aria-pressed={span === s}
                      className="rounded-full border px-3.5 text-[13px] transition-colors duration-500"
                      style={{
                        minHeight: 34,
                        borderColor: span === s ? "var(--color-figlift)" : "var(--hair)",
                        background:
                          span === s
                            ? "color-mix(in srgb, var(--color-figlift) 26%, var(--color-clay))"
                            : "transparent",
                        color: span === s ? "var(--color-bone)" : "var(--color-dune)",
                      }}
                    >
                      {s} days
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={470}>
              <div className="mt-5 flex justify-between border-b hair pb-2 text-[11px] tracking-[0.1em] text-dune uppercase">
                <span>{shortDay(from)}</span>
                <span>Today</span>
              </div>
            </Reveal>

            <div className="mt-7 flex flex-col gap-9">
              {profile.symptoms.map((key, n) => {
                const summary = describeSymptom(days, key, span, today);
                const trend = trendWord(summary);
                return (
                  <Reveal key={key} delay={520 + n * 90}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[17px] text-[#ded3c7]">{symptomHeading(key)}</h3>
                      {trend && <span className="text-[13.5px] text-dune">{trend}</span>}
                    </div>
                    <div className="mt-3.5">
                      <PigmentStrip points={summary.points} />
                    </div>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-dune">
                      {summary.sentence}
                    </p>
                  </Reveal>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
