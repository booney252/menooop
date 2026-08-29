import { cool } from "./cool";
import { rest } from "./rest";
import { steady } from "./steady";
import type { ProgramContent, SessionContent } from "./types";

export * from "./types";

export const PROGRAMS: ProgramContent[] = [cool, rest, steady].sort((a, b) => a.sort - b.sort);

export type ProgramId = ProgramContent["id"];

export const PROGRAM_BY_ID = Object.fromEntries(
  PROGRAMS.map((p) => [p.id, p])
) as Record<ProgramId, ProgramContent>;

export const isProgramId = (v: string): v is ProgramId => v in PROGRAM_BY_ID;

export const sessionFor = (id: ProgramId, day: number): SessionContent | undefined =>
  PROGRAM_BY_ID[id]?.sessions.find((s) => s.day === day);

export const totalDays = (id: ProgramId) => PROGRAM_BY_ID[id].weeks * 7;

/** /audio/{program}/{ref}.mp3 — files drop in without a code change */
export const audioUrl = (id: ProgramId, ref: string) => `/audio/${id}/${ref}.mp3`;
