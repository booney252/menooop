"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Action } from "@/components/Choice";
import { Reveal } from "@/components/Reveal";
import { NOT_A_DOCTOR, VOICE_DISCLOSURE } from "@/content/programs";
import { longDay } from "@/lib/day";
import { enroll, setEnrollmentStatus, resumeEnrollment } from "@/app/actions/programs";

type Program = {
  id: string;
  name: string;
  tagline: string;
  weeks: number;
  minutes: number;
  what: string[];
  commitment: string;
  evidence: string[];
  arc: string[];
};

export function ProgramView({
  program,
  enrollment,
  total,
  done,
  next,
  note,
  outcomeReady,
  otherRunning,
}: {
  program: Program;
  enrollment: { id: string; status: string; startedOn: string } | null | undefined;
  total: number;
  done: number;
  next: number;
  note: string | null;
  outcomeReady: boolean;
  otherRunning: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const running = enrollment?.status === "active";
  const paused = enrollment?.status === "paused";
  const finished = enrollment?.status === "completed";

  return (
    <AppShell tab="programs">
      <div className="px-7 pt-14 pb-36">
        <Reveal delay={40}>
          <Link href="/programs" className="-ml-2 inline-block px-2 py-2 text-[15px] text-dune">
            All programs
          </Link>
          <h1 className="display mt-6 text-[34px] leading-[1.12] text-bone">{program.name}</h1>
          <p className="mt-2 text-[17px] text-[#e4d9e0]">{program.tagline}</p>
          <p className="mt-3 text-[14.5px] text-dune">
            {program.weeks} weeks · {program.commitment.toLowerCase()}
          </p>
        </Reveal>

        {enrollment && !finished && (
          <Reveal delay={200} className="mt-9">
            <div className="rounded-[20px] border hair bg-clay px-5 py-5">
              <p className="label">
                {paused ? "Paused" : `Day ${next} of ${total}`}
              </p>
              {note && (
                <p className="display mt-4 text-[19px] leading-snug italic text-bone">{note}</p>
              )}
              <div className="mt-4">
                <Bar done={done} total={total} />
                <p className="mt-2.5 text-[13.5px] text-dune">
                  {done} of {total} sessions · started {longDay(enrollment.startedOn)}
                </p>
              </div>

              {paused ? (
                <button
                  type="button"
                  onClick={() => start(() => void resumeEnrollment(enrollment.id))}
                  className="mt-5 flex w-full items-center justify-center rounded-[14px] border border-fig bg-fig text-[16px] text-bone"
                  style={{ minHeight: 50 }}
                >
                  Pick it back up
                </button>
              ) : (
                <Link
                  href={`/programs/${program.id}/session/${next}`}
                  className="mt-5 flex w-full items-center justify-center rounded-[14px] border border-fig bg-fig text-[16px] text-bone"
                  style={{ minHeight: 50 }}
                >
                  {done === 0 ? "Start the first session" : "Today’s session"}
                </Link>
              )}
            </div>

            {outcomeReady && (
              <Link
                href={`/programs/outcome/${enrollment.id}`}
                className="mt-3 flex w-full items-center justify-center rounded-[16px] border hair text-[16px] text-[#e4d9e0]"
                style={{ minHeight: 52 }}
              >
                See what changed
              </Link>
            )}
          </Reveal>
        )}

        {finished && enrollment && (
          <Reveal delay={200} className="mt-9">
            <Link
              href={`/programs/outcome/${enrollment.id}`}
              className="flex w-full items-center justify-center rounded-[16px] border border-fig bg-fig text-[17px] text-bone"
              style={{ minHeight: 56 }}
            >
              See what changed
            </Link>
          </Reveal>
        )}

        <Reveal delay={320} className="mt-11">
          <h2 className="label mb-4">What this is</h2>
          <div className="flex flex-col gap-3.5">
            {program.what.map((line) => (
              <p key={line} className="text-[16.5px] leading-[1.7] text-[#e4d9e0]">
                {line}
              </p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={400} className="mt-10">
          <h2 className="label mb-4">Week by week</h2>
          <ol className="flex flex-col gap-2.5">
            {program.arc.map((line, i) => (
              <li key={line} className="flex gap-3.5">
                <span className="display shrink-0 text-[16px] text-dune">{i + 1}</span>
                <span className="text-[16px] leading-snug text-[#e4d9e0]">{line}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={470} className="mt-10">
          <h2 className="label mb-4">What the research actually shows</h2>
          <div className="flex flex-col gap-3.5">
            {program.evidence.map((line) => (
              <p key={line} className="text-[15.5px] leading-[1.7] text-dune">
                {line}
              </p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={540} className="mt-10">
          <div className="rounded-[18px] border hair px-5 py-4">
            <p className="display text-[17px] leading-snug italic text-[#e4d9e0]">
              At the end, Marlow shows you exactly what changed, using your own check-ins.
            </p>
          </div>
          <p className="mt-4 text-[13.5px] leading-relaxed text-dune">{VOICE_DISCLOSURE}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-dune">{NOT_A_DOCTOR}</p>
        </Reveal>

        {!enrollment && (
          <Reveal delay={620} className="mt-9">
            {otherRunning && (
              <p className="mb-3 text-[14.5px] leading-relaxed text-dune">
                You have another program running. Pause or stop that one first — one at a time
                is the whole point.
              </p>
            )}
            {error && (
              <p className="mb-3 text-[14.5px] leading-relaxed text-[#ebccda]">{error}</p>
            )}
            <Action
              disabled={pending || otherRunning}
              onClick={() =>
                start(async () => {
                  setError(null);
                  try {
                    const result = await enroll(program.id);
                    if ("error" in result && result.error) {
                      setError(result.error);
                      return;
                    }
                    router.push(`/programs/${program.id}/session/1`);
                  } catch {
                    setError("Marlow couldn’t reach the server. Try again.");
                  }
                })
              }
            >
              {pending ? "Starting…" : `Start ${program.name}`}
            </Action>
          </Reveal>
        )}

        {enrollment && !finished && (
          <Reveal delay={620} className="mt-9">
            <button
              type="button"
              onClick={() =>
                start(() => void setEnrollmentStatus(enrollment.id, paused ? "stopped" : "paused"))
              }
              className="w-full py-3 text-center text-[14.5px] text-dune underline underline-offset-4"
            >
              {paused ? "Stop this program" : "Pause for now"}
            </button>
          </Reveal>
        )}
      </div>
    </AppShell>
  );
}

function Bar({ done, total }: { done: number; total: number }) {
  return (
    <div
      className="h-[7px] w-full overflow-hidden rounded-full"
      style={{ background: "var(--color-wash)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.max(2, Math.round((done / Math.max(total, 1)) * 100))}%`,
          background: "var(--color-figlift)",
        }}
      />
    </div>
  );
}
