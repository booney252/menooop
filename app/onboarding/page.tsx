"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Action, Chip, Dots, Stone } from "@/components/Choice";
import { Reveal } from "@/components/Reveal";
import { STAGES, SUPPLEMENTS, SYMPTOMS, type Hrt, type Stage, type SymptomId } from "@/lib/data";
import { useStore } from "@/lib/store";

type Step = "door" | 0 | 1 | 2 | "done";

const HRT_OPTIONS: { id: Hrt; label: string; aside: string }[] = [
  { id: "yes", label: "Yes, I’m on HRT", aside: "Patch, gel, tablet or coil." },
  { id: "considering", label: "I’m considering it", aside: "Asked already, or about to." },
  { id: "no", label: "Not right now", aside: "By choice, or by circumstance." },
];

const COUNT_WORD = ["none", "one", "two", "three", "four", "five"];

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useStore();

  const [step, setStep] = useState<Step>("door");
  const [stage, setStage] = useState<Stage | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomId[]>([]);
  const [hrt, setHrt] = useState<Hrt | null>(null);
  const [supps, setSupps] = useState<string[]>([]);

  const toggle = <T,>(list: T[], v: T, max = Infinity) =>
    list.includes(v) ? list.filter((x) => x !== v) : list.length < max ? [...list, v] : list;

  function finish() {
    completeOnboarding({
      stage: stage ?? "irregular",
      symptoms,
      hrt: hrt ?? "no",
      supplements: supps,
      cycleDay: stage === "stopped" ? null : 20,
    });
    setStep("done");
  }

  return (
    <div className="min-h-dvh bg-ink sm:flex sm:items-center sm:justify-center sm:p-10">
      <div className="relative w-full bg-ink sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(162,148,138,0.12)]">
        <div className="flex h-dvh flex-col overflow-y-auto sm:h-full">
          {step === "door" && <Door onNext={() => setStep(0)} />}

          {step === 0 && (
            <Question
              index={0}
              title="Where are your periods right now?"
              aside="However you’d describe it today. This changes, and so can your answer."
            >
              <div className="flex flex-col gap-3">
                {STAGES.map((s) => (
                  <Stone
                    key={s.id}
                    label={s.label}
                    aside={s.aside}
                    selected={stage === s.id}
                    onSelect={() => {
                      setStage(s.id);
                      window.setTimeout(() => setStep(1), 420);
                    }}
                  />
                ))}
              </div>
            </Question>
          )}

          {step === 1 && (
            <Question
              index={1}
              title="What’s been loudest lately?"
              aside="Choose three to five. These become your daily check-in, and you can swap them any time."
              footer={
                <>
                  {symptoms.length >= 5 && (
                    <p className="mb-4 text-center text-[14px] leading-relaxed text-dune">
                      Five is the most Marlow will ask about in a day.
                    </p>
                  )}
                  <Action onClick={() => setStep(2)} disabled={symptoms.length < 3}>
                    {symptoms.length < 3
                      ? `Choose at least three`
                      : `Continue with ${COUNT_WORD[symptoms.length]}`}
                  </Action>
                </>
              }
            >
              <div className="flex flex-wrap gap-2.5">
                {SYMPTOMS.map((s) => {
                  const on = symptoms.includes(s.id);
                  return (
                    <Chip
                      key={s.id}
                      label={s.label}
                      selected={on}
                      disabled={!on && symptoms.length >= 5}
                      onSelect={() => setSymptoms((l) => toggle(l, s.id, 5))}
                    />
                  );
                })}
              </div>
            </Question>
          )}

          {step === 2 && (
            <Question
              index={2}
              title="Anything you’re already taking?"
              aside="So the record shows what changed, and when."
              footer={
                <Action onClick={finish} disabled={!hrt}>
                  {hrt ? "That’s everything" : "Choose one to continue"}
                </Action>
              }
            >
              <div className="flex flex-col gap-3">
                {HRT_OPTIONS.map((o) => (
                  <Stone
                    key={o.id}
                    label={o.label}
                    aside={o.aside}
                    selected={hrt === o.id}
                    onSelect={() => setHrt(o.id)}
                  />
                ))}
              </div>
              <p className="label mt-9 mb-3.5">Supplements</p>
              <div className="flex flex-wrap gap-2.5">
                {SUPPLEMENTS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={supps.includes(s)}
                    onSelect={() => setSupps((l) => toggle(l, s))}
                  />
                ))}
              </div>
            </Question>
          )}

          {step === "done" && <Done onGo={() => router.replace("/today")} />}
        </div>
      </div>
    </div>
  );
}

function Wordmark() {
  return (
    <p className="display text-[19px] tracking-[0.02em] text-bone">
      Marlow
      <span aria-hidden className="ml-[6px] inline-block h-[5px] w-[5px] translate-y-[-3px] rounded-full bg-fig" />
    </p>
  );
}

function Door({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-7 pt-16 pb-12">
      <Reveal delay={80}>
        <Wordmark />
      </Reveal>

      <div className="flex flex-1 flex-col justify-center py-14">
        <Reveal delay={260}>
          <h1 className="display text-[38px] leading-[1.1] text-bone">
            You’re not
            <br />
            imagining it.
          </h1>
        </Reveal>
        <Reveal delay={520}>
          <p className="mt-7 max-w-[19rem] text-[17px] leading-[1.7] text-[#cfc3b7]">
            Normal bloodwork and a body that no longer feels like yours can both be true at once.
          </p>
        </Reveal>
        <Reveal delay={700}>
          <p className="mt-4 max-w-[19rem] text-[17px] leading-[1.7] text-dune">
            Marlow keeps the record. So the next time someone asks how you’ve actually been,
            you have an answer instead of a guess.
          </p>
        </Reveal>
      </div>

      <Reveal delay={900}>
        <Action onClick={onNext}>Begin</Action>
        <p className="mt-4 text-center text-[14px] text-dune">Three questions. About a minute.</p>
      </Reveal>
    </div>
  );
}

function Question({
  index,
  title,
  aside,
  children,
  footer,
}: {
  index: number;
  title: string;
  aside: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col px-7 pt-16 pb-8">
      <Reveal delay={40}>
        <Dots total={3} index={index} />
      </Reveal>
      <Reveal delay={140}>
        <h2 className="display mt-8 text-[31px] leading-[1.15] text-bone">{title}</h2>
        <p className="mt-4 mb-9 max-w-[19rem] text-[15.5px] leading-[1.65] text-dune">{aside}</p>
      </Reveal>
      <Reveal delay={320} className="flex-1">
        {children}
      </Reveal>
      {footer ? (
        <div className="sticky bottom-0 -mx-7 mt-12 bg-gradient-to-t from-ink via-ink to-transparent px-7 pt-10 pb-5">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function Done({ onGo }: { onGo: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-7 pt-16 pb-12">
      <Reveal delay={60}>
        <Wordmark />
      </Reveal>
      <div className="flex flex-1 flex-col justify-center py-14">
        <Reveal delay={300}>
          <h2 className="display text-[36px] leading-[1.12] text-bone">That’s everything.</h2>
        </Reveal>
        <Reveal delay={560}>
          <p className="mt-7 max-w-[19rem] text-[17px] leading-[1.7] text-[#cfc3b7]">
            From here Marlow asks a handful of questions a day and nothing more. It takes about
            fifteen seconds.
          </p>
        </Reveal>
        <Reveal delay={720}>
          <p className="mt-4 max-w-[19rem] text-[17px] leading-[1.7] text-dune">
            Miss a day, or a week — it will simply be here when you come back.
          </p>
        </Reveal>
      </div>
      <Reveal delay={900}>
        <Action onClick={onGo}>Go to today</Action>
      </Reveal>
    </div>
  );
}
