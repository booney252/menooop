/**
 * Tests for the insight engine. No framework — just assertions and a exit
 * code, so `npm test` stays boring and fast.
 *
 * The engine is the product, and the risk is not that it crashes: it is that
 * it says something her data does not support. Most of these tests are about
 * making it stay quiet.
 */

import assert from "node:assert/strict";
import { candidates, nextInsight } from "@/lib/insights/engine";
import { TUNING } from "@/lib/insights/constants";
import {
  DEMO_INTERVENTION_DAYS_AGO,
  demoDays,
  demoInterventions,
  demoProfile,
} from "@/lib/demo-data";
import { shiftDay } from "@/lib/day";
import type { DayRecord, History, Severity } from "@/lib/types";
import type { SymptomKey } from "@/lib/symptoms";

const END = "2026-08-27";
let passed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (error) {
    failures.push(`${name}\n    ${(error as Error).message.split("\n")[0]}`);
  }
}

const fullHistory = (): History => ({
  profile: demoProfile(),
  days: demoDays(END),
  interventions: demoInterventions(END),
});

const flat = (days: number, value: Severity, keys: SymptomKey[]): DayRecord[] =>
  Array.from({ length: days }, (_, i) => ({
    day: shiftDay(END, -(days - i)),
    severities: Object.fromEntries(keys.map((k) => [k, value])) as Partial<
      Record<SymptomKey, Severity>
    >,
    note: null,
    goodThings: [],
    periodStarted: false,
  }));

// ── silence on thin data ────────────────────────────────────────────────────

test("says nothing but the honest not-yet on an empty history", () => {
  const c = candidates({ profile: demoProfile(), days: [], interventions: [] });
  assert.equal(c.length, 1, "expected exactly one candidate");
  assert.equal(c[0].kind, "not_yet");
});

test("the not-yet sentence names how much longer, and never claims a pattern", () => {
  const c = candidates({
    profile: demoProfile(),
    days: demoDays(END).slice(-5),
    interventions: [],
  });
  const notYet = c.find((x) => x.kind === "not_yet")!;
  assert.match(notYet.sentence, /Nothing conclusive yet/);
  assert.match(notYet.sentence, /two more weeks|another week|few more days/);
});

test("stops offering the not-yet once she has enough days", () => {
  const days = demoDays(END).slice(-TUNING.notYet.enoughDays);
  const c = candidates({ profile: demoProfile(), days, interventions: [] });
  assert.ok(!c.some((x) => x.kind === "not_yet"), "not_yet fired on sufficient data");
});

test("will not compare an intervention with too few logged days on one side", () => {
  const days = demoDays(END).filter(
    (d) => d.day < shiftDay(END, -DEMO_INTERVENTION_DAYS_AGO) || d.day > shiftDay(END, -4)
  );
  const c = candidates({ profile: demoProfile(), days, interventions: demoInterventions(END) });
  const ir = c.find((x) => x.kind === "intervention_response");
  if (ir) {
    assert.ok(
      (ir.payload.afterDays as number) >= TUNING.intervention.minDaysEachSide,
      "fired with too few days after the start"
    );
  }
});

test("will not claim a cycle pattern from a single observed cycle", () => {
  const days = demoDays(END).map((d, i) => ({ ...d, periodStarted: i === 40 }));
  const c = candidates({ profile: demoProfile(), days, interventions: [] });
  assert.ok(!c.some((x) => x.kind === "cycle_phase"), "cycle_phase fired on one cycle");
});

test("never claims a cycle pattern for someone whose periods have stopped", () => {
  const c = candidates({
    profile: demoProfile({ stage: "stopped" }),
    days: demoDays(END),
    interventions: demoInterventions(END),
  });
  assert.ok(!c.some((x) => x.kind === "cycle_phase"));
});

test("a flat, featureless history produces no pattern claims at all", () => {
  const days = flat(45, 1, ["sleep", "anxiety", "brain_fog"]);
  const c = candidates({ profile: demoProfile(), days, interventions: [] });
  const claims = c.filter((x) => x.kind !== "positive_streak" && x.kind !== "not_yet");
  assert.deepEqual(claims, [], `invented ${claims.length} pattern(s) from flat data`);
});

// ── the rules do fire when the data is there ───────────────────────────────

test("finds the intervention response in the demo history", () => {
  const c = candidates(fullHistory());
  const ir = c.find((x) => x.kind === "intervention_response");
  assert.ok(ir, "no intervention response found");
  assert.ok(
    Math.abs((ir!.payload.after as number) - (ir!.payload.before as number)) >=
      TUNING.intervention.minShift,
    "fired below the minimum shift"
  );
});

test("finds the cycle pattern across the demo's two cycles", () => {
  const c = candidates(fullHistory());
  const cyc = c.find((x) => x.kind === "cycle_phase");
  assert.ok(cyc, "no cycle pattern found in a history built to contain one");
  assert.ok((cyc!.payload.hits as number) >= TUNING.cycle.minHits);
});

test("celebrates the quiet stretch in her sleep", () => {
  const c = candidates(fullHistory());
  const streak = c.find((x) => x.kind === "positive_streak");
  assert.ok(streak, "no streak found");
  assert.ok((streak!.payload.days as number) >= TUNING.streak.minDays);
});

// ── voice and safety ────────────────────────────────────────────────────────

// Marlow observes; it never diagnoses. These are the shapes of a claim about
// her body rather than a description of her logs.
const DIAGNOSTIC =
  /\byou (have|are suffering from|are experiencing)\s+(a|an|the)?\s*[a-z]*\s*(deficiency|disorder|imbalance|syndrome|condition|menopause|perimenopause)\b/i;
const CLINICAL_CLAIM =
  /\bdiagnos|\byour (oestrogen|estrogen|hormones?|progesterone|testosterone|thyroid)\b|\bcaused by\b|\bbecause of your\b/i;
const FORBIDDEN_TONE = /journey|warrior|blossom|thrive|hormonal chaos|the change|amazing|congratulations/i;

test("no insight diagnoses, or claims a cause", () => {
  for (const c of candidates(fullHistory())) {
    for (const text of [c.sentence, c.detail ?? ""]) {
      assert.ok(!DIAGNOSTIC.test(text), `diagnostic: ${text}`);
      assert.ok(!CLINICAL_CLAIM.test(text), `clinical claim: ${text}`);
    }
  }
});

test("no insight uses the tone we banned", () => {
  for (const c of candidates(fullHistory())) {
    assert.ok(!FORBIDDEN_TONE.test(c.sentence), `off-voice sentence: ${c.sentence}`);
  }
});

test("every insight is a single sentence she can read in one breath", () => {
  for (const c of candidates(fullHistory())) {
    assert.ok(c.sentence.length <= 140, `too long (${c.sentence.length}): ${c.sentence}`);
    assert.ok(c.sentence.trim().endsWith("."), `no full stop: ${c.sentence}`);
  }
});

test("plural symptoms take plural verbs", () => {
  const history = fullHistory();
  for (const c of candidates(history)) {
    assert.ok(!/hot flashes (has|is|runs)\b/i.test(c.sentence), `agreement: ${c.sentence}`);
    assert.ok(!/\bsleep (have|are)\b/i.test(c.sentence), `agreement: ${c.sentence}`);
  }
});

// ── one a day, and never the same one twice ────────────────────────────────

test("offers the highest-priority insight first", () => {
  const first = nextInsight(fullHistory(), new Set());
  assert.equal(first?.kind, "intervention_response");
});

test("moves on rather than repeating one she has already seen", () => {
  const history = fullHistory();
  const seen = new Set<string>();
  let last: string | null = null;
  const kinds: string[] = [];

  for (let i = 0; i < 5; i++) {
    const next = nextInsight(history, seen, last as never);
    if (!next) break;
    assert.ok(!seen.has(next.dedupeKey), "returned an insight she has already seen");
    seen.add(next.dedupeKey);
    kinds.push(next.kind);
    last = next.kind;
  }

  assert.ok(kinds.length >= 3, `only produced ${kinds.length} insights`);
});

test("does not serve the same kind two days running when it has alternatives", () => {
  const history = fullHistory();
  const seen = new Set<string>();
  let last: string | null = null;

  for (let i = 0; i < 5; i++) {
    const remaining = candidates(history).filter((c) => !seen.has(c.dedupeKey));
    const hasAlternative = remaining.some((c) => c.kind !== last);
    const next = nextInsight(history, seen, last as never);
    if (!next) break;
    if (hasAlternative) {
      assert.notEqual(next.kind, last, `served ${next.kind} twice running with alternatives left`);
    }
    seen.add(next.dedupeKey);
    last = next.kind;
  }
});

test("returns nothing at all once every candidate has been seen", () => {
  const history = fullHistory();
  const seen = new Set(candidates(history).map((c) => c.dedupeKey));
  assert.equal(nextInsight(history, seen), null);
});

test("a quiet stretch is celebrated once, not every day it continues", () => {
  const history = fullHistory();
  const today = candidates(history).filter((c) => c.kind === "positive_streak");
  const tomorrow = candidates({
    ...history,
    days: [
      ...history.days,
      {
        day: shiftDay(END, 1),
        severities: { sleep: 0 as Severity },
        note: null,
        goodThings: [],
        periodStarted: false,
      },
    ],
  }).filter((c) => c.kind === "positive_streak");

  const before = today.find((c) => c.subject === "sleep");
  const after = tomorrow.find((c) => c.subject === "sleep");
  if (before && after) {
    assert.equal(before.dedupeKey, after.dedupeKey, "the same stretch would fire twice");
  }
});

// ── report ──────────────────────────────────────────────────────────────────

console.log(`\n  ${passed} passed, ${failures.length} failed\n`);
for (const f of failures) console.error(`  ✗ ${f}\n`);
process.exit(failures.length ? 1 : 0);
