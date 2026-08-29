/**
 * The Relief Loop.
 *
 * Two jobs. Half of these guard the claims rails — this feature ships copy
 * about a health intervention, and the words are the risk. The other half
 * guard the outcome engine against the thing it would be most tempting to do,
 * which is to make the programs look like they worked.
 */
import assert from "node:assert/strict";
import { harness } from "./harness";
import {
  FOR_REPLACEMENT,
  NOT_A_DOCTOR,
  PROGRAMS,
  PROGRAM_BY_ID,
  VOICE_DISCLOSURE,
  totalDays,
} from "@/content/programs";
import { matchProgram, shouldOffer } from "@/lib/programs/match";
import { computeOutcome, outcomeReady, weeklyNote } from "@/lib/programs/outcome";
import { TUNING } from "@/lib/insights/constants";
import { shiftDay } from "@/lib/day";
import type { DayRecord, Enrollment, Severity } from "@/lib/types";
import type { SymptomKey } from "@/lib/symptoms";

const { test, done } = harness();
const TODAY = "2026-08-27";

// ── helpers ─────────────────────────────────────────────────────────────────

/** every string a user could actually read */
function copyOf(programId: string): string[] {
  const p = PROGRAM_BY_ID[programId as never];
  return [
    p.name,
    p.tagline,
    ...p.what,
    p.commitment,
    ...p.evidence,
    ...p.arc,
    ...p.sessions.flatMap((s) => [s.title, s.intro ?? "", ...(s.cards ?? [])]),
  ].filter(Boolean);
}

const runOf = (
  count: number,
  values: Partial<Record<SymptomKey, Severity>>,
  endDay = TODAY
): DayRecord[] =>
  Array.from({ length: count }, (_, i) => ({
    day: shiftDay(endDay, -(count - 1 - i)),
    severities: values,
    note: null,
    goodThings: [],
    periodStarted: false,
  }));

const enrollment = (over: Partial<Enrollment> = {}): Enrollment => ({
  id: "e1",
  program_id: "cool",
  started_on: shiftDay(TODAY, -42),
  status: "active",
  paused_at: null,
  completed_at: null,
  intervention_id: null,
  created_at: new Date().toISOString(),
  ...over,
});

// ── the claims rails ────────────────────────────────────────────────────────

// Wellness framing only. These are the words that turn a program into a
// medical claim, and none of them may appear in anything she reads.
const BANNED =
  /\b(treats?|treated|treating|treatment|cures?|cured|curing|therapy|therapies|therapeutic|hypnotherap\w*|clinically proven|proven to|guaranteed?|remedy|remedies|prescrib\w*|diagnos\w*|reverses?|prevents?)\b/i;

test("no program copy uses medical-claim language", () => {
  for (const p of PROGRAMS) {
    for (const line of copyOf(p.id)) {
      const hit = BANNED.exec(line);
      assert.equal(hit, null, `${p.id}: banned word "${hit?.[0]}" in — ${line.slice(0, 90)}`);
    }
  }
});

test("no program copy promises a result", () => {
  const PROMISE = /\b(will (stop|end|fix|eliminate)|you will feel|guarantee|works for everyone)\b/i;
  for (const p of PROGRAMS) {
    for (const line of copyOf(p.id)) {
      assert.ok(!PROMISE.test(line), `${p.id}: promise in — ${line.slice(0, 90)}`);
    }
  }
});

test("every track states what the research shows, and its limits", () => {
  for (const p of PROGRAMS) {
    assert.ok(p.evidence.length >= 3, `${p.id}: evidence too thin`);
    const body = p.evidence.join(" ");
    assert.ok(
      /\bnot\b|\bsmall\b|\bdoes not work for everyone\b|\bmay do less\b|\bsmaller\b/i.test(body),
      `${p.id}: evidence names no limits`
    );
  }
});

test("unapproved copy is marked for replacement, never quietly shipped", () => {
  for (const p of PROGRAMS) {
    assert.ok(p.evidence.includes(FOR_REPLACEMENT), `${p.id}: evidence not marked`);
    for (const s of p.sessions) {
      if (s.status !== "placeholder") continue;
      const text = [s.intro ?? "", ...(s.cards ?? [])].join(" ");
      assert.ok(text.includes(FOR_REPLACEMENT), `${p.id} day ${s.day}: placeholder not marked`);
    }
  }
});

test("the AI voice disclosure and the not-a-doctor line exist and say so plainly", () => {
  assert.match(VOICE_DISCLOSURE, /\bAI\b/);
  assert.match(NOT_A_DOCTOR, /doesn’t replace one/);
  assert.ok(!BANNED.test(VOICE_DISCLOSURE));
});

test("every track has two written sessions to test the experience with", () => {
  for (const p of PROGRAMS) {
    const final = p.sessions.filter((s) => s.status === "final");
    assert.ok(final.length >= 2, `${p.id}: only ${final.length} written sessions`);
    for (const s of final) {
      assert.ok((s.cards?.length ?? 0) > 0, `${p.id} day ${s.day}: no body`);
    }
  }
});

test("every day of every track has exactly one session", () => {
  for (const p of PROGRAMS) {
    const days = p.sessions.map((s) => s.day).sort((a, b) => a - b);
    assert.equal(days.length, totalDays(p.id), `${p.id}: wrong session count`);
    assert.deepEqual(days, Array.from({ length: totalDays(p.id) }, (_, i) => i + 1), `${p.id}: gaps`);
  }
});

// ── matching ────────────────────────────────────────────────────────────────

test("says nothing until there is a fortnight to go on", () => {
  const days = runOf(TUNING.program.minDaysToRecommend - 1, { hot_flashes: 3 });
  assert.equal(matchProgram(days, ["hot_flashes"]), null);
});

test("points at Cool when the flashes dominate", () => {
  const days = runOf(30, { hot_flashes: 3, sleep: 0, low_mood: 0 });
  const m = matchProgram(days, ["hot_flashes", "sleep", "low_mood"]);
  assert.equal(m?.program.id, "cool");
  assert.equal(m?.because, "hot_flashes");
});

test("points at Rest when the sleep dominates", () => {
  const days = runOf(30, { sleep: 3, hot_flashes: 0, low_mood: 0 });
  assert.equal(matchProgram(days, ["sleep", "hot_flashes", "low_mood"])?.program.id, "rest");
});

test("a tie at the top goes to Steady, which is what a tie means", () => {
  const days = runOf(30, { sleep: 3, hot_flashes: 3, low_mood: 3 });
  assert.equal(matchProgram(days, ["sleep", "hot_flashes", "low_mood"])?.program.id, "steady");
});

test("stays quiet when nothing is bad enough to name", () => {
  const days = runOf(30, { hot_flashes: 1, sleep: 1, low_mood: 1 });
  assert.equal(matchProgram(days, ["hot_flashes", "sleep", "low_mood"]), null);
});

test("the recommendation says what it saw, how long it takes, and no more", () => {
  const days = runOf(30, { sleep: 3 });
  const m = matchProgram(days, ["sleep"])!;
  assert.match(m.lines[0], /points at your sleep/);
  assert.match(m.lines[1], /four-week program/);
  assert.match(m.lines[2], /minutes a day/);
  for (const line of m.lines) assert.ok(!BANNED.test(line), `banned word in — ${line}`);
});

test("never offers a second program while one is running", () => {
  const days = runOf(30, { sleep: 3 });
  const m = matchProgram(days, ["sleep"]);
  assert.equal(shouldOffer(m, [enrollment({ status: "active" })], [], TODAY), null);
  assert.equal(shouldOffer(m, [enrollment({ status: "paused" })], [], TODAY), null);
});

test("never re-offers a program she has already finished", () => {
  const days = runOf(30, { sleep: 3 });
  const m = matchProgram(days, ["sleep"]);
  const done = enrollment({ program_id: "rest", status: "completed" });
  assert.equal(shouldOffer(m, [done], [], TODAY), null);
});

test("a dismissal buys weeks of quiet, then the pattern may speak again", () => {
  const days = runOf(30, { sleep: 3 });
  const m = matchProgram(days, ["sleep"]);
  const rec = {
    id: "r1",
    program_id: "rest",
    shown_on: shiftDay(TODAY, -3),
    dismissed_at: new Date().toISOString(),
  };
  assert.equal(shouldOffer(m, [], [rec], TODAY), null, "offered again three days later");

  const old = { ...rec, shown_on: shiftDay(TODAY, -(TUNING.program.quietDaysAfterDismiss + 1)) };
  assert.ok(shouldOffer(m, [], [old], TODAY), "never came back");
});

// ── the outcome engine ──────────────────────────────────────────────────────

const started = shiftDay(TODAY, -42);

/** flashes at `before` for the fortnight prior, `after` for the run since */
function beforeAfter(before: Severity, after: Severity): DayRecord[] {
  const pre = runOf(14, { hot_flashes: before }, shiftDay(started, -1));
  const post = runOf(43, { hot_flashes: after }, TODAY);
  return [...pre, ...post];
}

test("refuses to call an outcome without enough check-ins on both sides", () => {
  const thin = runOf(4, { hot_flashes: 3 }, shiftDay(started, -1));
  const [result] = computeOutcome(thin, enrollment(), ["hot_flashes"], TODAY);
  assert.equal(result.verdict, "not_enough_data");
  assert.match(result.sentence, /rather say nothing than guess/);
  assert.equal(result.delta, null);
});

test("reports an improvement with both numbers in it", () => {
  const [result] = computeOutcome(beforeAfter(3, 1), enrollment(), ["hot_flashes"], TODAY);
  assert.equal(result.verdict, "improved");
  assert.match(result.sentence, /3 to 1/);
  assert.match(result.sentence, /That change is yours/);
});

test("calls a null result a null result, and points somewhere else", () => {
  const [result] = computeOutcome(beforeAfter(2, 2), enrollment(), ["hot_flashes"], TODAY);
  assert.equal(result.verdict, "no_change");
  assert.match(result.sentence, /didn’t move much/);
  assert.match(result.sentence, /Other approaches exist/);
  assert.ok(!/change is yours/.test(result.sentence), "dressed up a null result");
});

test("says so when things went the other way, without blaming her", () => {
  const [result] = computeOutcome(beforeAfter(1, 3), enrollment(), ["hot_flashes"], TODAY);
  assert.equal(result.verdict, "worse");
  assert.match(result.sentence, /does not mean you did anything wrong/);
});

test("a shift smaller than the threshold is never called an improvement", () => {
  const nudge = TUNING.program.minShift / 2;
  const pre = runOf(14, { hot_flashes: 2 }, shiftDay(started, -1));
  const post = runOf(43, { hot_flashes: 2 }, TODAY).map((d, i) => ({
    ...d,
    severities: { hot_flashes: (i % 2 ? 2 : 2 - nudge * 2) as Severity },
  }));
  const [result] = computeOutcome([...pre, ...post], enrollment(), ["hot_flashes"], TODAY);
  assert.notEqual(result.verdict, "improved");
});

test("no outcome sentence uses medical-claim language", () => {
  for (const days of [beforeAfter(3, 1), beforeAfter(2, 2), beforeAfter(1, 3)]) {
    for (const r of computeOutcome(days, enrollment(), ["hot_flashes"], TODAY)) {
      assert.ok(!BANNED.test(r.sentence), `banned word in — ${r.sentence}`);
    }
  }
});

test("the outcome waits for completion, or for six weeks", () => {
  assert.equal(outcomeReady(enrollment({ started_on: shiftDay(TODAY, -10) }), TODAY), false);
  assert.equal(outcomeReady(enrollment({ started_on: shiftDay(TODAY, -43) }), TODAY), true);
  assert.equal(
    outcomeReady(
      enrollment({ started_on: shiftDay(TODAY, -10), status: "completed" }),
      TODAY
    ),
    true
  );
});

// ── the weekly note ─────────────────────────────────────────────────────────

test("the weekly note hedges, every time", () => {
  const note = weeklyNote(beforeAfter(3, 1), enrollment(), ["hot_flashes"], TODAY);
  assert.ok(note);
  assert.match(note!, /Too early to call/);
  assert.ok(!BANNED.test(note!));
});

test("there is no weekly note in the first week", () => {
  const e = enrollment({ started_on: shiftDay(TODAY, -3) });
  assert.equal(weeklyNote(beforeAfter(3, 1), e, ["hot_flashes"], TODAY), null);
});

test("the weekly note admits when it cannot see anything yet", () => {
  const thin = runOf(3, { hot_flashes: 2 }, TODAY);
  const note = weeklyNote(thin, enrollment({ started_on: shiftDay(TODAY, -14) }), ["hot_flashes"], TODAY);
  assert.match(note!, /Not enough check-ins yet/);
});

done("relief loop");
