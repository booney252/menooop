"use client";

import { useTransition } from "react";
import Link from "next/link";
import { dismissRecommendation } from "@/app/actions/programs";

export type ActiveProgram = {
  id: string;
  name: string;
  next: number;
  total: number;
  done: number;
  note: string | null;
  doneToday: boolean;
  paused: boolean;
};

export type Suggestion = { id: string; lines: [string, string, string] };

/** the quiet row when a program is running */
export function ActiveProgramRow({ program }: { program: ActiveProgram }) {
  if (program.paused) {
    return (
      <div className="rounded-[18px] border hair px-5 py-4">
        <p className="text-[15px] leading-relaxed text-dune">
          {program.name} is paused.{" "}
          <Link href={`/programs/${program.id}`} className="text-[#e4d9e0] underline underline-offset-4">
            Pick it back up
          </Link>
        </p>
      </div>
    );
  }

  if (program.doneToday) {
    return (
      <div className="rounded-[18px] border hair px-5 py-4">
        <p className="text-[15px] leading-relaxed text-dune">
          {program.name}, day {program.done} of {program.total}. Done for today.
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/programs/${program.id}/session/${program.next}`}
      className="flex items-center gap-4 rounded-[18px] border hair bg-clay px-5 py-4"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] text-[#e4d9e0]">
          {program.name}, day {program.next}
        </span>
        <span className="mt-0.5 block text-[13.5px] text-dune">
          {program.note ?? `${program.done} of ${program.total} sessions so far`}
        </span>
      </span>
      <span aria-hidden className="shrink-0 text-[15px] text-dune">
        →
      </span>
    </Link>
  );
}

/**
 * The suggestion. Offered once, dismissible, and it does not come back for
 * weeks — the pattern has to still be there for it to speak again.
 */
export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const [pending, start] = useTransition();

  return (
    <div className="rounded-[20px] border hair bg-clay px-5 py-5">
      <p className="display text-[19px] leading-snug text-bone">{suggestion.lines[0]}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-dune">
        {suggestion.lines[1]} {suggestion.lines[2]}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Link
          href={`/programs/${suggestion.id}`}
          className="flex flex-1 items-center justify-center rounded-[14px] border hair text-[15.5px] text-[#e4d9e0]"
          style={{ minHeight: 46 }}
        >
          Have a look
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => void dismissRecommendation(suggestion.id))}
          className="px-3 py-2 text-[14px] text-dune underline underline-offset-4"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
