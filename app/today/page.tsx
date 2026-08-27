"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { MonthArc } from "@/components/MonthArc";
import { Reveal } from "@/components/Reveal";
import { SCALE, SYMPTOM_BY_ID } from "@/lib/data";
import { longDate, today, weekday } from "@/lib/dates";
import { todayInsight } from "@/lib/insights";
import { inkPigment } from "@/lib/pigment";
import { useStore } from "@/lib/store";

export default function Today() {
  const { ready, profile, entries, todayEntry } = useStore();

  if (!ready) return <AppShell tab="today"><div /></AppShell>;

  const d = today();
  const insight = todayInsight(entries, profile);
  const done = Boolean(todayEntry);

  return (
    <AppShell tab="today">
      <div className="flex min-h-dvh flex-col px-7 pt-14 pb-36 sm:min-h-[844px]">
        <Reveal delay={60}>
          <header className="flex items-baseline justify-between">
            <p className="display text-[19px] tracking-[0.02em] text-bone">
              Marlow
              <span
                aria-hidden
                className="ml-[6px] inline-block h-[5px] w-[5px] translate-y-[-3px] rounded-full"
                style={{ background: "var(--color-figlift)" }}
              />
            </p>
            <p className="text-[13.5px] text-dune">
              {weekday(d)}, {longDate(d).replace(` ${d.getFullYear()}`, "")}
            </p>
          </header>
        </Reveal>

        <Reveal delay={160} className="mt-9">
          <MonthArc entries={entries} profile={profile} />
          <p className="label mt-1 text-center">
            {profile.cycleDay === null
              ? "The last thirty days"
              : `Day ${profile.cycleDay} of this cycle`}
          </p>
        </Reveal>

        <Reveal delay={520}>
          <hr className="hair mt-11 border-t" />
          <p className="display mt-9 text-[25px] leading-[1.35] italic text-bone">
            {insight.line}
          </p>
          <p className="mt-4 text-[14.5px] leading-relaxed text-dune">{insight.foot}</p>
        </Reveal>

        <Reveal delay={760} className="mt-10">
          {done ? <Saved /> : <NotYet />}
        </Reveal>

        <div className="flex-1" />
      </div>
    </AppShell>
  );
}

function NotYet() {
  return (
    <>
      <Link
        href="/check-in"
        className="flex w-full items-center justify-center rounded-[16px] border border-fig bg-fig text-[17px] text-bone"
        style={{ minHeight: 56 }}
      >
        Start today’s check-in
      </Link>
      <p className="mt-4 text-center text-[14px] text-dune">About fifteen seconds.</p>
    </>
  );
}

function Saved() {
  const { profile, todayEntry } = useStore();
  if (!todayEntry) return null;

  return (
    <div className="rounded-[20px] border hair bg-clay px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="label">Saved today</p>
        <Link href="/check-in" className="-my-3 py-3 text-[14px] text-dune underline underline-offset-4">
          Change
        </Link>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {profile.symptoms.map((id) => {
          const v = todayEntry.severities[id];
          return (
            <li key={id} className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-[9px] w-[9px] shrink-0 rounded-full"
                style={{ background: inkPigment(v) }}
              />
              <span className="flex-1 text-[15.5px] text-[#ded3c7]">
                {SYMPTOM_BY_ID[id].label}
              </span>
              <span className="text-[14px] text-dune">
                {typeof v === "number" ? SCALE[v].short : "—"}
              </span>
            </li>
          );
        })}
      </ul>
      {todayEntry.note ? (
        <p className="display mt-5 border-t hair pt-4 text-[16.5px] italic leading-relaxed text-[#ded3c7]">
          {todayEntry.note}
        </p>
      ) : null}
    </div>
  );
}
