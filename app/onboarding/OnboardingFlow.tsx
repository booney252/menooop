"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Action, Chip, Dots, Stone } from "@/components/Choice";
import { Reveal } from "@/components/Reveal";
import {
  INTERVENTION_SUGGESTIONS,
  STAGES,
  SYMPTOMS,
  type Stage,
  type SymptomKey,
} from "@/lib/symptoms";
import { completeOnboarding } from "@/app/actions/profile";

const COUNT_WORD = ["none", "one", "two", "three", "four", "five", "six"];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"door" | 0 | 1 | 2 | "done">("door");
  const [stage, setStage] = useState<Stage | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomKey[]>([]);
  const [taking, setTaking] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      const result = await completeOnboarding({
        stage: stage ?? "irregular",
        symptoms,
        interventions: [...taking, custom].map((s) => s.trim()).filter(Boolean),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setStep("done");
    } catch {
      setError("Marlow couldn’t reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Frame>
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
                key={s.key}
                label={s.label}
                aside={s.aside}
                selected={stage === s.key}
                onSelect={() => {
                  setStage(s.key);
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
          aside="Choose three to six. These become your daily check-in, and you can swap them any time."
          footer={
            <>
              {symptoms.length >= 6 && (
                <p className="mb-4 text-center text-[14px] leading-relaxed text-dune">
                  Six is the most Marlow will ask about in a day.
                </p>
              )}
              <Action onClick={() => setStep(2)} disabled={symptoms.length < 3}>
                {symptoms.length < 3
                  ? "Choose at least three"
                  : `Continue with ${COUNT_WORD[symptoms.length]}`}
              </Action>
            </>
          }
        >
          <div className="flex flex-wrap gap-2.5">
            {SYMPTOMS.map((s) => {
              const on = symptoms.includes(s.key);
              return (
                <Chip
                  key={s.key}
                  label={s.label}
                  selected={on}
                  disabled={!on && symptoms.length >= 6}
                  onSelect={() =>
                    setSymptoms((list) =>
                      on ? list.filter((k) => k !== s.key) : [...list, s.key]
                    )
                  }
                />
              );
            })}
          </div>
        </Question>
      )}

      {step === 2 && (
        <Question
          index={2}
          title="Anything you’re already trying?"
          aside="So the record shows what changed, and when. Skip it if nothing has."
          footer={
            <>
              {error && (
                <p className="mb-3 text-center text-[14.5px] leading-relaxed text-[#e0c9c2]">
                  {error}
                </p>
              )}
              <Action onClick={finish} disabled={saving}>
                {saving ? "Saving…" : "That’s everything"}
              </Action>
            </>
          }
        >
          <div className="flex flex-wrap gap-2.5">
            {INTERVENTION_SUGGESTIONS.map((name) => (
              <Chip
                key={name}
                label={name}
                selected={taking.includes(name)}
                onSelect={() =>
                  setTaking((list) =>
                    list.includes(name) ? list.filter((n) => n !== name) : [...list, name]
                  )
                }
              />
            ))}
          </div>
          <label htmlFor="custom" className="label mt-9 mb-3 block">
            Something else
          </label>
          <input
            id="custom"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={80}
            placeholder="Sea swimming, a new pillow, anything"
            className="w-full rounded-[16px] border hair bg-clay px-5 text-[16.5px] text-bone placeholder:text-dune"
            style={{ minHeight: 54 }}
          />
        </Question>
      )}

      {step === "done" && <Done onGo={() => router.replace("/today")} />}
    </Frame>
  );
}

function Wordmark() {
  return (
    <p className="display text-[19px] tracking-[0.02em] text-bone">
      Marlow
      <span
        aria-hidden
        className="ml-[6px] inline-block h-[5px] w-[5px] translate-y-[-3px] rounded-full"
        style={{ background: "var(--color-figlift)" }}
      />
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
          <h1 className="display text-[36px] leading-[1.1] text-bone">
            Three questions,
            <br />
            then you’re in.
          </h1>
        </Reveal>
        <Reveal delay={520}>
          <p className="mt-7 max-w-[19rem] text-[17px] leading-[1.7] text-[#cfc3b7]">
            Marlow needs to know roughly where you are and what’s been loudest. Nothing here is
            fixed — you can change all of it later.
          </p>
        </Reveal>
      </div>
      <Reveal delay={760}>
        <Action onClick={onNext}>Begin</Action>
        <p className="mt-4 text-center text-[14px] text-dune">About a minute.</p>
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

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink sm:flex sm:items-center sm:justify-center sm:p-10">
      <div className="relative w-full bg-ink sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(162,148,138,0.12)]">
        <div className="flex h-dvh flex-col overflow-y-auto sm:h-full">{children}</div>
      </div>
    </div>
  );
}
