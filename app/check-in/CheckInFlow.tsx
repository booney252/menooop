"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Action, Chip, Dots } from "@/components/Choice";
import { Reveal } from "@/components/Reveal";
import { GOOD_THINGS, SYMPTOM_BY_KEY, scaleFor, type SymptomKey } from "@/lib/symptoms";
import { depth } from "@/lib/pigment";
import { saveCheckIn } from "@/app/actions/checkin";
import type { DayRecord, Profile, Severity } from "@/lib/types";

type Step = { kind: "symptom"; key: SymptomKey } | { kind: "good" } | { kind: "note" };

export function CheckInFlow({
  profile,
  existing,
}: {
  profile: Profile;
  existing: DayRecord | null;
}) {
  const router = useRouter();
  const startedAt = useRef(Date.now());

  const [values, setValues] = useState<Partial<Record<SymptomKey, Severity>>>(
    existing?.severities ?? {}
  );
  const [goodThings, setGoodThings] = useState<string[]>(existing?.goodThings ?? []);
  const [note, setNote] = useState(existing?.note ?? "");
  const [periodStarted, setPeriodStarted] = useState(existing?.periodStarted ?? false);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps: Step[] = useMemo(
    () => [
      ...profile.symptoms.map((key) => ({ kind: "symptom" as const, key })),
      { kind: "good" as const },
      { kind: "note" as const },
    ],
    [profile.symptoms]
  );

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => router.replace("/today"), 2400);
    return () => window.clearTimeout(t);
  }, [saved, router]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const result = await saveCheckIn({
        severities: values as Record<string, number>,
        goodThings,
        note,
        periodStarted,
        durationMs: Date.now() - startedAt.current,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSaved(goodThings);
    } catch {
      // Offline, or the server is having a moment. Say so rather than sitting
      // on "Saving…" — and do not clear what she just entered.
      setError(
        "That didn’t save — Marlow couldn’t reach the server. Your answers are still here; try again when you have signal."
      );
    } finally {
      setSaving(false);
    }
  }

  if (saved) return <Saved goodThings={saved} />;

  const step = steps[index];

  return (
    <Frame>
      <div className="flex min-h-full flex-1 flex-col px-7 pt-14 pb-10">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (index === 0 ? router.push("/today") : setIndex(index - 1))}
            className="-ml-2 flex items-center px-2 text-[15px] text-dune"
            style={{ minHeight: 44 }}
          >
            {index === 0 ? "Close" : "Back"}
          </button>
          <Dots total={steps.length} index={index} />
        </div>

        {step.kind === "symptom" && (
          <SymptomStep
            key={step.key}
            symptomKey={step.key}
            value={values[step.key]}
            position={index + 1}
            of={profile.symptoms.length}
            onChoose={(v) => {
              setValues((s) => ({ ...s, [step.key]: v }));
              window.setTimeout(() => setIndex((n) => n + 1), 430);
            }}
          />
        )}

        {step.kind === "good" && (
          <GoodStep
            chosen={goodThings}
            onToggle={(key) =>
              setGoodThings((list) =>
                list.includes(key) ? list.filter((g) => g !== key) : [...list, key]
              )
            }
            onNext={() => setIndex((n) => n + 1)}
          />
        )}

        {step.kind === "note" && (
          <NoteStep
            note={note}
            onNote={setNote}
            showCycle={profile.stage !== "stopped"}
            periodStarted={periodStarted}
            onPeriod={setPeriodStarted}
            saving={saving}
            error={error}
            onSave={save}
          />
        )}
      </div>
    </Frame>
  );
}

function SymptomStep({
  symptomKey,
  value,
  position,
  of,
  onChoose,
}: {
  symptomKey: SymptomKey;
  value: Severity | undefined;
  position: number;
  of: number;
  onChoose: (v: Severity) => void;
}) {
  const symptom = SYMPTOM_BY_KEY[symptomKey];
  const scale = scaleFor(symptomKey);

  return (
    <div className="flex flex-1 flex-col">
      <div className="h-10 sm:h-14" />
      <Reveal delay={60}>
        <h2 className="display text-[33px] leading-[1.12] text-bone">{symptom.label}</h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-dune">{symptom.aside}</p>
      </Reveal>

      <Reveal delay={220} className="mt-9 flex flex-col gap-2.5">
        {scale.map((option, n) => {
          const on = value === option.value;
          // the positive symptom reads in reverse: more pigment for more of it
          const shade = symptom.kind === "positive" ? option.value : option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChoose(option.value as Severity)}
              aria-pressed={on}
              className="soak flex w-full items-center rounded-[18px] px-6 text-left text-[18px] transition-transform duration-500"
              style={{
                minHeight: 66,
                animationDelay: `${260 + n * 70}ms`,
                background: `color-mix(in srgb, var(--color-figlift) ${Math.round(
                  depth(shade) * 100
                )}%, var(--color-wash))`,
                boxShadow: on ? "inset 0 0 0 1.5px var(--color-bone)" : "none",
                color: on ? "var(--color-bone)" : "#e2d8cd",
                transform: on ? "scale(1.012)" : "none",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </Reveal>

      <div className="flex-1" />
      <p className="pt-10 text-center text-[13.5px] text-dune">
        {position} of {of}
      </p>
      <div className="h-4" />
    </div>
  );
}

function GoodStep({
  chosen,
  onToggle,
  onNext,
}: {
  chosen: string[];
  onToggle: (key: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <Reveal delay={60}>
        <h2 className="display mt-12 text-[31px] leading-[1.15] text-bone">
          Anything good in there?
        </h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-dune">
          Tick what applies, or none of it. Both are honest answers.
        </p>
      </Reveal>

      <Reveal delay={220} className="mt-8">
        <div className="flex flex-wrap gap-2.5">
          {GOOD_THINGS.map((g) => (
            <Chip
              key={g.key}
              label={g.label}
              selected={chosen.includes(g.key)}
              onSelect={() => onToggle(g.key)}
            />
          ))}
        </div>
      </Reveal>

      <div className="flex-1" />
      <Reveal delay={380}>
        <Action onClick={onNext}>{chosen.length ? "Nearly there" : "Not today"}</Action>
      </Reveal>
    </div>
  );
}

function NoteStep({
  note,
  onNote,
  showCycle,
  periodStarted,
  onPeriod,
  saving,
  error,
  onSave,
}: {
  note: string;
  onNote: (v: string) => void;
  showCycle: boolean;
  periodStarted: boolean;
  onPeriod: (v: boolean) => void;
  saving: boolean;
  error: string | null;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <Reveal delay={60}>
        <h2 className="display mt-12 text-[31px] leading-[1.15] text-bone">
          Anything worth remembering?
        </h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-dune">
          Optional. A few words is plenty — it shows up in your report.
        </p>
      </Reveal>

      <Reveal delay={220} className="mt-7">
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder="Slept through for once."
          className="w-full resize-none rounded-[18px] border hair bg-clay px-5 py-4 text-[17px] leading-relaxed text-bone placeholder:text-dune"
        />
      </Reveal>

      {showCycle && (
        <Reveal delay={320} className="mt-4">
          <button
            type="button"
            onClick={() => onPeriod(!periodStarted)}
            aria-pressed={periodStarted}
            className="flex w-full items-center gap-3.5 rounded-[16px] border px-5 py-3.5 text-left transition-colors duration-500"
            style={{
              minHeight: 54,
              background: periodStarted
                ? "color-mix(in srgb, var(--color-figlift) 24%, var(--color-clay))"
                : "var(--color-clay)",
              borderColor: periodStarted ? "var(--color-figlift)" : "var(--hair)",
            }}
          >
            <span
              aria-hidden
              className="h-[7px] w-[7px] shrink-0 rounded-full transition-all duration-500"
              style={{
                background: periodStarted ? "var(--color-figlift)" : "var(--color-wash)",
              }}
            />
            <span className="text-[16px] text-[#ded3c7]">My period started today</span>
          </button>
        </Reveal>
      )}

      <div className="flex-1" />
      {error && <p className="mb-3 text-[14.5px] leading-relaxed text-[#e0c9c2]">{error}</p>}
      <Reveal delay={420}>
        <Action onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save today"}
        </Action>
      </Reveal>
    </div>
  );
}

function Saved({ goodThings }: { goodThings: string[] }) {
  const line =
    goodThings.length > 0
      ? "And there was something good in it."
      : "That’s all today needed.";

  return (
    <Frame>
      <div className="flex flex-1 flex-col items-center justify-center px-9 text-center">
        <Reveal delay={100}>
          <p className="display text-[40px] leading-none text-bone">Saved.</p>
        </Reveal>
        <Reveal delay={500}>
          <p className="mt-6 max-w-[16rem] text-[17px] leading-relaxed text-dune">{line}</p>
        </Reveal>
        <Reveal delay={1100}>
          <Link
            href="/today"
            className="mt-10 block text-[15px] text-dune underline underline-offset-4"
          >
            Back to today
          </Link>
        </Reveal>
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#151210] sm:flex sm:items-center sm:justify-center sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 hidden sm:block"
        style={{
          background:
            "radial-gradient(60rem 40rem at 28% 18%, rgba(123,75,87,0.16), transparent 62%)",
        }}
      />
      <div className="relative w-full bg-ink sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(162,148,138,0.12)]">
        <div className="flex h-dvh flex-col overflow-y-auto sm:h-full">{children}</div>
      </div>
    </div>
  );
}
