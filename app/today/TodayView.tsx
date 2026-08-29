"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { MonthArc } from "@/components/MonthArc";
import {
  ActiveProgramRow,
  SuggestionCard,
  type ActiveProgram,
  type Suggestion,
} from "@/components/ProgramOnToday";
import { InsightVisual } from "@/components/InsightVisual";
import { Reveal } from "@/components/Reveal";
import { Wordmark } from "@/components/Wordmark";
import { GOOD_THING_LABEL } from "@/lib/symptoms";
import { daysBetween, longDay, weekdayOf, type Day } from "@/lib/day";
import type { DayRecord, Insight, Profile } from "@/lib/types";

export function TodayView({
  profile,
  days,
  today,
  insight,
  appointmentPrompt,
  activeProgram,
  suggestion,
}: {
  profile: Profile;
  days: DayRecord[];
  today: Day;
  insight: Insight | null;
  appointmentPrompt: { id: string; created_at: string } | null;
  activeProgram: ActiveProgram | null;
  suggestion: Suggestion | null;
}) {
  const todayRecord = days.find((d) => d.day === today);
  const done = Boolean(todayRecord);
  const cycleDay = cycleDayFor(profile, days, today);

  return (
    <AppShell tab="today">
      <div className="flex min-h-dvh flex-col px-7 pt-14 pb-36 sm:min-h-[844px]">
        <Reveal delay={60}>
          <header className="flex items-baseline justify-between">
            <Wordmark />
            <p className="text-[13.5px] text-dune">
              {weekdayOf(today)}, {longDay(today).replace(/ \d{4}$/, "")}
            </p>
          </header>
        </Reveal>

        {profile.stage !== "stopped" && (
          <Reveal delay={160} className="mt-9">
            <MonthArc days={days} endDay={today} symptoms={profile.symptoms} />
            <p className="label mt-1 text-center">
              {cycleDay === null ? "The last thirty days" : `Day ${cycleDay} of this cycle`}
            </p>
          </Reveal>
        )}

        <Reveal delay={profile.stage === "stopped" ? 200 : 520}>
          <hr className={`hair border-t ${profile.stage === "stopped" ? "mt-10" : "mt-11"}`} />
          {insight ? (
            <>
              {/* One sentence and the shape of it. The reasoning behind it is
                  on Patterns — Today has to be readable at a glance. */}
              <p className="display mt-9 text-[25px] leading-[1.35] italic text-bone">
                {insight.sentence}
              </p>
              <div className="mt-6">
                <InsightVisual insight={insight} />
              </div>
            </>
          ) : (
            <>
              <p className="display mt-9 text-[25px] leading-[1.35] italic text-bone">
                Nothing stands out this week.
              </p>
              <p className="mt-4 text-[14.5px] leading-relaxed text-dune">
                That is worth knowing too. Marlow will say something when your logs actually show
                it, and stay quiet until then.
              </p>
            </>
          )}
        </Reveal>

        <Reveal delay={760} className="mt-10">
          {done ? <DoneForToday record={todayRecord!} /> : <NotYet />}
        </Reveal>

        {activeProgram && (
          <Reveal delay={860} className="mt-4">
            <ActiveProgramRow program={activeProgram} />
          </Reveal>
        )}

        {suggestion && (
          <Reveal delay={900} className="mt-8">
            <SuggestionCard suggestion={suggestion} />
          </Reveal>
        )}

        {appointmentPrompt && (
          <Reveal delay={940} className="mt-8">
            <AppointmentPrompt id={appointmentPrompt.id} />
          </Reveal>
        )}

        <div className="flex-1" />

        <Reveal delay={1000}>
          <Link
            href="/settings"
            className="mt-16 inline-block py-2 text-[13.5px] text-dune underline underline-offset-4"
          >
            Settings
          </Link>
        </Reveal>
      </div>
    </AppShell>
  );
}

/** day 1 is the day her last logged period started */
function cycleDayFor(profile: Profile, days: DayRecord[], today: Day): number | null {
  if (profile.stage === "stopped") return null;
  const starts = days.filter((d) => d.periodStarted).map((d) => d.day);
  if (!starts.length) return null;
  return daysBetween(starts[starts.length - 1], today) + 1;
}

function NotYet() {
  return (
    <>
      <Link
        href="/check-in"
        className="flex w-full items-center justify-center rounded-[16px] border border-fig bg-fig text-[17px] text-bone"
        style={{ minHeight: 56 }}
      >
        Start today&rsquo;s check-in
      </Link>
      <p className="mt-4 text-center text-[14px] text-dune">About fifteen seconds.</p>
    </>
  );
}

/**
 * The done state. It reflects the good thing back at her and stops there —
 * replaying five severity ratings would read like an audit, which is the one
 * thing Today must never do. The ratings are a tap away under "Change".
 */
function DoneForToday({ record }: { record: DayRecord }) {
  const good = record.goodThings.map((g) => GOOD_THING_LABEL[g]).filter(Boolean);
  const upNote =
    good.length === 0
      ? "Logged. That is all today needed."
      : good.length === 1
        ? `${good[0]}. That is worth having.`
        : `${good.slice(0, -1).join(", ")} and ${good[good.length - 1]!.toLowerCase()}.`;

  return (
    <div className="rounded-[20px] border hair bg-clay px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="label">Done for today</p>
        <Link
          href="/check-in"
          className="-my-3 py-3 text-[14px] text-dune underline underline-offset-4"
        >
          Change
        </Link>
      </div>

      <p className="display mt-4 text-[20px] leading-snug italic text-bone">{upNote}</p>

      {record.note && (
        <p className="mt-4 border-t hair pt-4 text-[15.5px] leading-relaxed text-[#e4d9e0]">
          {record.note}
        </p>
      )}
    </div>
  );
}

/** Deliberately small and easy to ignore. It asks once, and it never nags. */
function AppointmentPrompt({ id }: { id: string }) {
  return (
    <div className="border-t hair pt-5">
      <p className="text-[15px] leading-relaxed text-dune">
        Did you have your appointment?{" "}
        <Link
          href={`/report/outcome/${id}`}
          className="text-[#e4d9e0] underline underline-offset-4"
        >
          Tell Marlow how it went
        </Link>
      </p>
    </div>
  );
}
