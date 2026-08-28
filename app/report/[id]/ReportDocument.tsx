"use client";

import Link from "next/link";
import { PigmentStrip } from "@/components/PigmentStrip";
import { Reveal } from "@/components/Reveal";
import { SYMPTOM_BY_KEY, type Stage, type SymptomKey } from "@/lib/symptoms";
import { dayRange, longDay } from "@/lib/day";
import type { SymptomSummary } from "@/lib/insights/describe";
import type { Intervention, Report } from "@/lib/types";

export function ReportDocument({
  report,
  rows,
  interventions,
  questions,
  notes,
  stage,
}: {
  report: Report;
  rows: { key: SymptomKey; summary: SymptomSummary }[];
  interventions: Intervention[];
  questions: string[];
  notes: { day: string; note: string }[];
  stage: Stage | null;
}) {
  const active = interventions.filter((i) => !i.ended_on);
  const past = interventions.filter((i) => i.ended_on);

  return (
    <div className="report-shell min-h-dvh bg-[#170c13] sm:flex sm:items-center sm:justify-center sm:p-10">
      <div className="report-frame relative w-full sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(180,159,174,0.14)]">
        <div className="report-scroll paper h-dvh overflow-y-auto sm:h-full">
          <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b paper-rule bg-bone/90 px-5 py-2.5 backdrop-blur">
            <Link href="/report" className="-ml-2 px-2 text-[15px] paper-dim" style={{ minHeight: 44 }}>
              Back
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full border border-fig px-4 text-[14px] text-fig"
              style={{ minHeight: 40 }}
            >
              Print or save as PDF
            </button>
          </div>

          <article className="print-page px-7 pt-9 pb-16">
            <Reveal delay={40}>
              <div className="flex items-end justify-between">
                <p className="display text-[20px] tracking-[0.02em] text-[#2b1a26]">
                  Marlow
                  <span
                    aria-hidden
                    className="ml-[6px] inline-block h-[5px] w-[5px] translate-y-[-3px] rounded-full bg-fig"
                  />
                </p>
                <p className="paper-label">Symptom record</p>
              </div>
              <div className="mt-2.5 border-t-2" style={{ borderColor: "var(--color-fig)" }} />
            </Reveal>

            <Reveal delay={160}>
              <h1 className="doc-title display mt-8 text-[29px] leading-[1.14] text-[#2b1a26]">
                A record of my
                <br />
                symptoms
              </h1>
              <p className="doc-meta mt-3.5 text-[13.5px] paper-dim">
                {dayRange(report.window_start, report.window_end)}
              </p>
            </Reveal>

            {report.say_note && (
              <Reveal delay={260}>
                <p className="paper-label mt-10">What I want to say</p>
                <p className="doc-lead mt-3 text-[16.5px] leading-[1.7] text-[#2b1a26]">
                  {report.say_note}
                </p>
              </Reveal>
            )}

            <Reveal delay={340}>
              <p className="paper-label mt-11">Day by day</p>
              <p className="doc-note mt-2.5 text-[13.5px] leading-relaxed paper-dim">
                One mark per day, oldest on the left. Taller, darker marks are heavier days.
                Self-reported, on a four-point scale.
              </p>
            </Reveal>

            <div className="doc-rows mt-6 flex flex-col gap-7">
              {rows.map(({ key, summary }, n) => (
                <Reveal key={key} delay={420 + n * 60}>
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="doc-rowname text-[16.5px] text-[#2b1a26]">
                        {SYMPTOM_BY_KEY[key].label}
                      </h2>
                    </div>
                    <div className="doc-strip mt-2.5">
                      <PigmentStrip points={summary.points} height={26} paper animate={false} />
                    </div>
                    <p className="doc-rownote mt-2.5 text-[13.5px] leading-relaxed paper-dim">
                      {summary.sentence}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={800}>
              <p className="paper-label mt-12">What I&rsquo;ve tried</p>
              <ul className="doc-tried-list mt-3.5 flex flex-col gap-2.5">
                {active.length === 0 && past.length === 0 && (
                  <Tried label="Nothing yet" value="—" />
                )}
                {active.map((i) => (
                  <Tried key={i.id} label={i.name} value={`Since ${longDay(i.started_on)}`} />
                ))}
                {past.map((i) => (
                  <Tried
                    key={i.id}
                    label={i.name}
                    value={`${longDay(i.started_on)} to ${longDay(i.ended_on!)}`}
                  />
                ))}
              </ul>
            </Reveal>

            {notes.length > 0 && (
              <Reveal delay={880}>
                <p className="paper-label mt-12">In my own words</p>
                <ul className="doc-quotes mt-3.5 flex flex-col gap-3">
                  {notes.map((n) => (
                    <li
                      key={n.day}
                      className="doc-quote display text-[16.5px] italic leading-relaxed text-[#3a2833]"
                    >
                      &ldquo;{n.note}&rdquo;
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            <Reveal delay={960}>
              <p className="paper-label mt-12">Questions I&rsquo;d like to ask</p>
              <ol className="doc-questions mt-4 flex flex-col gap-4">
                {questions.map((q, i) => (
                  <li key={q} className="flex gap-4">
                    <span className="display shrink-0 text-[17px] text-fig">{i + 1}</span>
                    <span className="doc-q text-[16px] leading-[1.6] text-[#2b1a26]">{q}</span>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={1040}>
              <div className="mt-12 border-t paper-rule pt-4">
                <p className="doc-foot text-[12.5px] leading-relaxed paper-dim">
                  Prepared with Marlow from {report.checkin_count} daily check-
                  {report.checkin_count === 1 ? "in" : "ins"}
                  {stage === "stopped" ? "" : ", including cycle dates"}. Self-reported; a record
                  of symptoms, not a diagnosis.
                </p>
              </div>
            </Reveal>
          </article>
        </div>
      </div>
    </div>
  );
}

function Tried({ label, value }: { label: string; value: string }) {
  return (
    <li className="doc-tried flex items-baseline justify-between gap-4 border-b paper-rule pb-2.5">
      <span className="shrink-0 text-[16px] text-[#2b1a26]">{label}</span>
      <span className="text-right text-[13.5px] paper-dim">{value}</span>
    </li>
  );
}
