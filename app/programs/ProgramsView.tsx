"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/Reveal";

type Card = { id: string; name: string; tagline: string; weeks: number; minutes: number };

export function ProgramsView({
  programs,
  matchedId,
  enrollments,
}: {
  programs: Card[];
  matchedId: string | null;
  enrollments: { program_id: string; status: string; id: string }[];
}) {
  const statusOf = (id: string) =>
    enrollments.find((e) => e.program_id === id && e.status !== "stopped")?.status ?? null;

  return (
    <AppShell tab="programs">
      <div className="px-7 pt-14 pb-36">
        <Reveal delay={60}>
          <h1 className="display text-[31px] leading-[1.15] text-bone">Programs</h1>
          <p className="mt-4 max-w-[19rem] text-[15.5px] leading-relaxed text-dune">
            Short daily sessions built for one pattern at a time. At the end, Marlow shows you
            what your own check-ins did — including when the answer is nothing.
          </p>
        </Reveal>

        <ul className="mt-9 flex flex-col gap-3">
          {programs.map((p, n) => {
            const status = statusOf(p.id);
            return (
              <Reveal key={p.id} delay={200 + n * 80}>
                <li>
                  <Link
                    href={`/programs/${p.id}`}
                    className="block rounded-[20px] border px-5 py-5 transition-colors duration-500"
                    style={{
                      background:
                        p.id === matchedId
                          ? "color-mix(in srgb, var(--color-figlift) 16%, var(--color-clay))"
                          : "var(--color-clay)",
                      borderColor:
                        p.id === matchedId ? "var(--color-figlift)" : "var(--hair)",
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="display text-[24px] text-bone">{p.name}</h2>
                      {status && (
                        <span className="label" style={{ letterSpacing: "0.18em" }}>
                          {status === "active" ? "Running" : status}
                        </span>
                      )}
                      {!status && p.id === matchedId && (
                        <span className="label" style={{ letterSpacing: "0.18em" }}>
                          Suggested
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[16px] text-[#e4d9e0]">{p.tagline}</p>
                    <p className="mt-3 text-[14px] text-dune">
                      {p.weeks} weeks · about {p.minutes} minutes a day
                    </p>
                  </Link>
                </li>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delay={520}>
          <p className="mt-9 text-[13.5px] leading-relaxed text-dune">
            One program at a time. You can stop or pause whenever, and nothing is lost.
          </p>
        </Reveal>
      </div>
    </AppShell>
  );
}
