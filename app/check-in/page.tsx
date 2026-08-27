"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Action, Dots } from "@/components/Choice";
import { Reveal } from "@/components/Reveal";
import { SCALE, SYMPTOM_BY_ID, type SymptomId } from "@/lib/data";
import { depth } from "@/lib/pigment";
import { useStore } from "@/lib/store";

export default function CheckIn() {
  const router = useRouter();
  const { ready, profile, todayEntry, saveCheckIn } = useStore();

  const [values, setValues] = useState<Partial<Record<SymptomId, number>>>({});
  const [note, setNote] = useState("");
  const [i, setI] = useState(0);
  const [saved, setSaved] = useState(false);

  // editing an entry that already exists today
  useEffect(() => {
    if (!ready || !todayEntry) return;
    setValues(todayEntry.severities);
    setNote(todayEntry.note ?? "");
  }, [ready, todayEntry]);

  const steps = useMemo(() => profile.symptoms.length + 1, [profile.symptoms.length]);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => router.replace("/today"), 2200);
    return () => window.clearTimeout(t);
  }, [saved, router]);

  if (!ready) return <Frame><div /></Frame>;

  if (saved) {
    return (
      <Frame>
        <div className="flex flex-1 flex-col items-center justify-center px-9 text-center">
          <Reveal delay={100}>
            <p className="display text-[40px] leading-none text-bone">Saved.</p>
          </Reveal>
          <Reveal delay={500}>
            <p className="mt-6 max-w-[16rem] text-[17px] leading-relaxed text-dune">
              That’s all today needed.
            </p>
          </Reveal>
          <Reveal delay={1100}>
            <Link href="/today" className="mt-10 block text-[15px] text-dune underline underline-offset-4">
              Back to today
            </Link>
          </Reveal>
        </div>
      </Frame>
    );
  }

  const onNote = i === profile.symptoms.length;
  const id = profile.symptoms[i];

  function choose(v: number) {
    setValues((s) => ({ ...s, [id]: v }));
    window.setTimeout(() => setI((n) => n + 1), 430);
  }

  return (
    <Frame>
      <div className="flex min-h-full flex-1 flex-col px-7 pt-14 pb-10">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (i === 0 ? router.push("/today") : setI(i - 1))}
            className="-ml-2 flex items-center px-2 text-[15px] text-dune"
            style={{ minHeight: 44 }}
          >
            {i === 0 ? "Close" : "Back"}
          </button>
          <Dots total={steps} index={i} />
        </div>

        {onNote ? (
          <div key="note" className="flex flex-1 flex-col">
            <Reveal delay={80}>
              <h2 className="display mt-12 text-[31px] leading-[1.15] text-bone">
                Anything worth remembering?
              </h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-dune">
                Optional. A few words is plenty — it shows up in your report.
              </p>
            </Reveal>
            <Reveal delay={260} className="mt-8">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Slept through for once."
                className="w-full resize-none rounded-[18px] border hair bg-clay px-5 py-4 text-[17px] leading-relaxed text-bone placeholder:text-dune"
              />
            </Reveal>
            <div className="flex-1" />
            <Reveal delay={420}>
              <Action
                onClick={() => {
                  saveCheckIn(values, note);
                  setSaved(true);
                }}
              >
                Save today
              </Action>
            </Reveal>
          </div>
        ) : (
          <div key={id} className="flex flex-1 flex-col">
            <div className="h-10 sm:h-14" />
            <Reveal delay={60}>
              <h2 className="display text-[33px] leading-[1.12] text-bone">
                {SYMPTOM_BY_ID[id].label}
              </h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-dune">
                {SYMPTOM_BY_ID[id].aside}
              </p>
            </Reveal>

            <Reveal delay={220} className="mt-9 flex flex-col gap-2.5">
              {SCALE.map((s, n) => {
                const on = values[id] === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => choose(s.value)}
                    aria-pressed={on}
                    className="soak flex w-full items-center rounded-[18px] px-6 text-left text-[18px] transition-transform duration-500"
                    style={{
                      minHeight: 66,
                      animationDelay: `${260 + n * 70}ms`,
                      background: `color-mix(in srgb, var(--color-fig) ${Math.round(
                        depth(s.value) * 100
                      )}%, var(--color-wash))`,
                      boxShadow: on ? "inset 0 0 0 1.5px var(--color-bone)" : "none",
                      color: on ? "var(--color-bone)" : "#e2d8cd",
                      transform: on ? "scale(1.012)" : "none",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </Reveal>

            <div className="flex-1" />
            <p className="pt-10 text-center text-[13.5px] text-dune">
              {i + 1} of {profile.symptoms.length}
            </p>
            <div className="h-4" />
          </div>
        )}
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
