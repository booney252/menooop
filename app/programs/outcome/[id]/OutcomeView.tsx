"use client";

import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { NOT_A_DOCTOR } from "@/content/programs";
import { SYMPTOM_BY_KEY } from "@/lib/symptoms";
import { dayRange, daysBetween, type Day } from "@/lib/day";
import type { OutcomeResult } from "@/lib/programs/outcome";

export function OutcomeView({
  programId,
  programName,
  weeks,
  startedOn,
  endedOn,
  sessionsDone,
  sessionsTotal,
  results,
}: {
  programId: string;
  programName: string;
  weeks: number;
  startedOn: Day;
  endedOn: Day;
  sessionsDone: number;
  sessionsTotal: number;
  results: OutcomeResult[];
}) {
  return (
    <div className="min-h-dvh bg-ink sm:flex sm:items-center sm:justify-center sm:p-10">
      <div className="relative w-full bg-ink sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(180,159,174,0.14)]">
        <div className="h-dvh overflow-y-auto px-7 pt-14 pb-16 sm:h-full">
          <Reveal delay={40}>
            <p className="label">{weeks} weeks of {programName}</p>
            <p className="mt-3 text-[13.5px] text-dune">
              {dayRange(startedOn, endedOn)} · {sessionsDone} of {sessionsTotal} sessions
            </p>
          </Reveal>

          <div className="mt-10 flex flex-col gap-12">
            {results.map((r, n) => (
              <Reveal key={r.symptom} delay={200 + n * 220}>
                <section>
                  <h2 className="display text-[26px] leading-[1.3] italic text-bone">
                    {r.sentence}
                  </h2>
                  <div className="mt-7">
                    <Curve result={r} startedOn={startedOn} />
                  </div>
                  <p className="mt-4 text-[13.5px] leading-relaxed text-dune">
                    {SYMPTOM_BY_KEY[r.symptom].label} · {r.baselineDays} check-ins before,{" "}
                    {r.endpointDays} after.
                  </p>
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal delay={900}>
            <div className="mt-12 border-t hair pt-6">
              <p className="text-[15px] leading-relaxed text-[#e4d9e0]">
                This goes into your doctor report automatically, with the curve attached.
              </p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-dune">{NOT_A_DOCTOR}</p>
            </div>
          </Reveal>

          <Reveal delay={980}>
            <div className="mt-8 flex flex-col gap-2.5">
              <Link
                href="/report"
                className="flex w-full items-center justify-center rounded-[16px] border border-fig bg-fig text-[16px] text-bone"
                style={{ minHeight: 52 }}
              >
                Put it in a report
              </Link>
              <Link
                href={`/programs/${programId}`}
                className="flex w-full items-center justify-center rounded-[16px] border hair text-[16px] text-[#e4d9e0]"
                style={{ minHeight: 52 }}
              >
                Back to {programName}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

const W = 342;
const H = 150;
const PAD = 10;

/**
 * Her own curve. Daily marks in the app's pigment, a mean line for each side,
 * and a hairline where the program started. Days she did not log are simply
 * absent — the line is never interpolated across a gap she did not fill.
 */
function Curve({ result, startedOn }: { result: OutcomeResult; startedOn: Day }) {
  const points = [...result.before, ...result.after];
  if (points.length < 2) return null;

  const span = points.length - 1;
  const x = (i: number) => PAD + (i / span) * (W - PAD * 2);
  const y = (v: number) => PAD + (1 - v / 3) * (H - PAD * 2);

  const startIndex = points.findIndex((p) => p.day >= startedOn);
  const divider = startIndex > 0 ? x(startIndex) - (x(1) - x(0)) / 2 : x(0);

  const meanLine = (value: number | null, from: number, to: number, key: string) =>
    value === null ? null : (
      <line
        key={key}
        x1={from}
        x2={to}
        y1={y(value)}
        y2={y(value)}
        stroke="var(--color-bone)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
    );

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={result.sentence}
      >
        {[0, 1, 2, 3].map((v) => (
          <line
            key={v}
            x1={PAD}
            x2={W - PAD}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--color-wash)"
            strokeWidth="1"
          />
        ))}

        <line
          x1={divider}
          x2={divider}
          y1={PAD - 4}
          y2={H - PAD + 4}
          stroke="var(--color-dune)"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.8"
        />

        {points.map((p, i) =>
          p.value === null ? null : (
            <circle
              key={p.day}
              cx={x(i)}
              cy={y(p.value)}
              r="2.6"
              fill="var(--color-figlift)"
              opacity={i < result.before.length ? 0.45 : 0.95}
            />
          )
        )}

        {meanLine(result.baseline, PAD, divider - 4, "b")}
        {meanLine(result.endpoint, divider + 4, W - PAD, "a")}
      </svg>

      <div className="mt-2 flex justify-between text-[10.5px] uppercase text-dune" style={{ letterSpacing: "0.16em" }}>
        <span>Before</span>
        <span>{daysBetween(startedOn, result.after[result.after.length - 1]?.day ?? startedOn)} days in</span>
      </div>
    </div>
  );
}
