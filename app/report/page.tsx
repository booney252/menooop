"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Action } from "@/components/Choice";
import { PigmentStrip } from "@/components/PigmentStrip";
import { Reveal } from "@/components/Reveal";
import { SCALE, SYMPTOM_BY_ID, verb, type SymptomId } from "@/lib/data";
import { longDate, monthName, today } from "@/lib/dates";
import {
  bestLutealLift,
  bestSupplementShift,
  doctorQuestions,
  lutealLift,
  series,
  summary,
  windowStart,
  word,
} from "@/lib/insights";
import { SUPPLEMENT_START, type Entry, type Profile } from "@/lib/seed";
import { useStore } from "@/lib/store";

const RANGE = 60;

export default function Report() {
  const { ready, profile, entries } = useStore();
  const [made, setMade] = useState(false);

  if (!ready) return <AppShell tab="report"><div /></AppShell>;
  if (!made) return <Cover onMake={() => setMade(true)} />;

  return <Paper profile={profile} entries={entries} onBack={() => setMade(false)} />;
}

function Cover({ onMake }: { onMake: () => void }) {
  return (
    <AppShell tab="report">
      <div className="flex min-h-dvh flex-col px-7 pt-16 pb-36 sm:min-h-[844px]">
        <Reveal delay={80}>
          <p className="label">For your appointment</p>
          <h1 className="display mt-7 text-[33px] leading-[1.14] text-bone">
            One page to take
            <br />
            into the room.
          </h1>
        </Reveal>
        <Reveal delay={320}>
          <p className="mt-7 max-w-[19rem] text-[17px] leading-[1.7] text-[#cfc3b7]">
            Sixty days of your entries, set out so a doctor can read them in twenty seconds. How
            often, how heavy, what you’ve already tried.
          </p>
        </Reveal>
        <Reveal delay={480}>
          <p className="mt-4 max-w-[19rem] text-[17px] leading-[1.7] text-dune">
            It ends with five questions worth asking, drawn from what your own record shows.
          </p>
        </Reveal>

        <div className="flex-1" />

        <Reveal delay={680}>
          <Action onClick={onMake}>Prepare the report</Action>
          <p className="mt-4 text-center text-[14px] text-dune">
            Print it, or keep it on your phone.
          </p>
        </Reveal>
      </div>
    </AppShell>
  );
}

function shortVersion(profile: Profile, entries: Record<string, Entry>): string[] {
  const stageLine =
    profile.stage === "stopped"
      ? "My periods stopped over a year ago."
      : profile.stage === "irregular"
        ? "My periods have become unpredictable."
        : "My periods are still fairly regular.";

  const ranked = [...profile.symptoms]
    .map((id) => ({ id, s: summary(entries, id) }))
    .sort((a, b) => b.s.avg - a.s.avg);
  const top = ranked.slice(0, 2).map((r) => SYMPTOM_BY_ID[r.id].label.toLowerCase());

  const out = [
    `${stageLine} For the last sixty days I’ve logged ${word(profile.symptoms.length)} symptoms every day.`,
  ];
  if (top.length === 2) {
    out.push(`The heaviest have been ${top[0]} and ${top[1]}.`);
  }

  const cyc = bestLutealLift(entries, profile);
  if (cyc?.lift) {
    out.push(
      `${SYMPTOM_BY_ID[cyc.id].label} ${verb(cyc.id, "runs", "run")} about ${cyc.lift.lift}% heavier in the five days before a period than through the rest of the month.`
    );
  }

  const eased = bestSupplementShift(entries, profile);
  if (eased?.shift) {
    out.push(
      `${SYMPTOM_BY_ID[eased.id].label} ${verb(eased.id, "is", "are")} down ${eased.shift.pct}% since I started ${profile.supplements[0].toLowerCase()} ${word(SUPPLEMENT_START)} days ago.`
    );
  }
  return out;
}

/** "29 June – 27 August 2026" — the year said once */
function rangeLine(from: Date, to: Date) {
  const sameYear = from.getFullYear() === to.getFullYear();
  const left = `${from.getDate()} ${monthName(from)}${sameYear ? "" : ` ${from.getFullYear()}`}`;
  return `${left} – ${to.getDate()} ${monthName(to)} ${to.getFullYear()}`;
}

function typical(avg: number) {
  const i = Math.max(0, Math.min(3, Math.round(avg)));
  return SCALE[i].short;
}

function Paper({
  profile,
  entries,
  onBack,
}: {
  profile: Profile;
  entries: Record<string, Entry>;
  onBack: () => void;
}) {
  const to = today();
  const from = windowStart(entries, RANGE);
  const questions = doctorQuestions(entries, profile);
  const lines = shortVersion(profile, entries);

  const notes = Object.values(entries)
    .filter((e) => e.note)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  return (
    <div className="report-shell min-h-dvh bg-[#151210] sm:flex sm:items-center sm:justify-center sm:p-10">
      <div className="report-frame relative w-full sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(162,148,138,0.12)]">
        <div className="report-scroll paper h-dvh overflow-y-auto sm:h-full">
          <div className="no-print sticky top-0 z-30 flex items-center justify-between border-b paper-rule bg-bone/90 px-5 py-2.5 backdrop-blur">
            <button
              type="button"
              onClick={onBack}
              className="-ml-2 px-2 text-[15px] paper-dim"
              style={{ minHeight: 44 }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full border border-fig px-4 text-[14px] text-fig"
              style={{ minHeight: 40 }}
            >
              Print or save
            </button>
          </div>

          <article className="print-page px-7 pt-9 pb-16">
            {/* letterhead */}
            <Reveal delay={40}>
              <div className="flex items-end justify-between">
                <p className="display text-[20px] tracking-[0.02em] text-[#2a2320]">
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
              <h1 className="doc-title display mt-8 text-[29px] leading-[1.14] text-[#2a2320]">
                A record of the
                <br />
                last sixty days
              </h1>
              <p className="doc-meta mt-3.5 text-[13.5px] paper-dim">
                {rangeLine(from, to)}
              </p>
            </Reveal>

            <Reveal delay={300}>
              <p className="paper-label mt-10">The short version</p>
              <p className="doc-lead mt-3 text-[16.5px] leading-[1.7] text-[#2a2320]">{lines.join(" ")}</p>
            </Reveal>

            <Reveal delay={420}>
              <p className="paper-label mt-11">Day by day</p>
              <p className="doc-note mt-2.5 text-[13.5px] leading-relaxed paper-dim">
                One mark per day, oldest on the left. Taller, darker marks are heavier days.
              </p>
            </Reveal>

            <div className="doc-rows mt-6 flex flex-col gap-7">
              {profile.symptoms.map((id, n) => (
                <Reveal key={id} delay={500 + n * 70}>
                  <Row id={id} profile={profile} entries={entries} />
                </Reveal>
              ))}
            </div>

            <Reveal delay={880}>
              <p className="paper-label mt-12">What I’ve tried</p>
              <ul className="doc-tried-list mt-3.5 flex flex-col gap-2.5">
                <Tried
                  label="Hormone therapy"
                  value={
                    profile.hrt === "yes"
                      ? "Currently taking it"
                      : profile.hrt === "considering"
                        ? "Not yet — want to discuss"
                        : "Not taking it"
                  }
                />
                {profile.supplements.length ? (
                  profile.supplements.map((s, i) => (
                    <Tried
                      key={s}
                      label={s}
                      value={i === 0 ? `Started ${word(SUPPLEMENT_START)} days ago` : "Ongoing"}
                    />
                  ))
                ) : (
                  <Tried label="Supplements" value="None" />
                )}
              </ul>
            </Reveal>

            {notes.length > 0 && (
              <Reveal delay={960}>
                <p className="paper-label mt-12">In my own words</p>
                <ul className="doc-quotes mt-3.5 flex flex-col gap-3">
                  {notes.map((n) => (
                    <li key={n.date} className="doc-quote display text-[16.5px] italic leading-relaxed text-[#3a302b]">
                      &ldquo;{n.note}&rdquo;
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            <Reveal delay={1040}>
              <p className="paper-label mt-12">Questions for this appointment</p>
              <ol className="doc-questions mt-4 flex flex-col gap-4">
                {questions.map((q, i) => (
                  <li key={q} className="flex gap-4">
                    <span className="display shrink-0 text-[17px] text-fig">{i + 1}</span>
                    <span className="doc-q text-[16px] leading-[1.6] text-[#2a2320]">{q}</span>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={1120}>
              <div className="mt-12 border-t paper-rule pt-4">
                <p className="doc-foot text-[12.5px] leading-relaxed paper-dim">
                  Recorded daily in Marlow, {rangeLine(from, to)}. Self-reported, not a
                  diagnosis.
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
      <span className="shrink-0 text-[16px] text-[#2a2320]">{label}</span>
      <span className="text-right text-[13.5px] paper-dim">{value}</span>
    </li>
  );
}

function Row({
  id,
  profile,
  entries,
}: {
  id: SymptomId;
  profile: Profile;
  entries: Record<string, Entry>;
}) {
  const s = summary(entries, id);
  const lift = lutealLift(entries, id, profile);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="doc-rowname text-[16.5px] text-[#2a2320]">{SYMPTOM_BY_ID[id].label}</h3>
        <span className="doc-trend text-[13px] paper-dim">{s.trend.word}</span>
      </div>
      <div className="mt-2.5">
        <div className="doc-strip">
          <PigmentStrip points={series(entries, id, RANGE)} height={26} paper animate={false} />
        </div>
      </div>
      <p className="doc-rownote mt-2.5 text-[13.5px] leading-relaxed paper-dim">
        Felt on {s.felt} of {s.days} days, rough on {s.rough}. Typically {typical(s.avg)}.
        {lift && lift.lift >= 30 ? ` About ${lift.lift}% heavier before a period.` : ""}
      </p>
    </div>
  );
}
