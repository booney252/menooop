"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Action, Stone } from "@/components/Choice";
import { Reveal } from "@/components/Reveal";
import { dismissAppointmentPrompt, logAppointmentOutcome } from "@/app/actions/report";

const OPTIONS = [
  { key: "heard" as const, label: "I felt heard", aside: "They took it seriously." },
  { key: "mixed" as const, label: "Mixed", aside: "Some of it landed, some didn’t." },
  { key: "dismissed" as const, label: "I felt dismissed", aside: "Again. I’m sorry." },
  { key: "not_yet" as const, label: "Haven’t been yet", aside: "It’s still coming up." },
];

export function OutcomeForm({ id, windowEnd }: { id: string; windowEnd: string }) {
  const router = useRouter();
  const [went, setWent] = useState<(typeof OPTIONS)[number]["key"] | null>(null);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <Frame>
        <div className="flex flex-1 flex-col items-center justify-center px-9 text-center">
          <Reveal delay={100}>
            <p className="display text-[34px] leading-tight text-bone">Noted.</p>
          </Reveal>
          <Reveal delay={420}>
            <p className="mt-6 max-w-[17rem] text-[17px] leading-relaxed text-dune">
              Thank you. That helps Marlow know whether any of this is doing its job.
            </p>
          </Reveal>
          <Reveal delay={900}>
            <button
              type="button"
              onClick={() => router.replace("/today")}
              className="mt-10 text-[15px] text-dune underline underline-offset-4"
            >
              Back to today
            </button>
          </Reveal>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="flex min-h-full flex-1 flex-col px-7 pt-14 pb-10">
        <Reveal delay={60}>
          <p className="label">After your appointment</p>
          <h1 className="display mt-7 text-[31px] leading-[1.15] text-bone">How did it go?</h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-dune">
            Only if you want to say. Nothing here changes what Marlow shows you — it just means
            someone asked.
          </p>
        </Reveal>

        <Reveal delay={240} className="mt-8 flex flex-col gap-3">
          {OPTIONS.map((o) => (
            <Stone
              key={o.key}
              label={o.label}
              aside={o.aside}
              selected={went === o.key}
              onSelect={() => setWent(o.key)}
            />
          ))}
        </Reveal>

        {went && (
          <Reveal delay={80} className="mt-6">
            <label htmlFor="outcome-note" className="label mb-3 block">
              Anything else
            </label>
            <textarea
              id="outcome-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="What they said, what you want to remember for next time."
              className="w-full resize-none rounded-[18px] border hair bg-clay px-5 py-4 text-[16.5px] leading-relaxed text-bone placeholder:text-dune"
            />
          </Reveal>
        )}

        <div className="flex-1" />

        <Reveal delay={400}>
          {error && (
            <p className="mb-3 text-center text-[14.5px] leading-relaxed text-[#e0c9c2]">{error}</p>
          )}
          <Action
            onClick={() =>
              start(async () => {
                if (!went) return;
                setError(null);
                try {
                  const result = await logAppointmentOutcome(id, went, note);
                  if ("error" in result && result.error) {
                    setError(result.error);
                    return;
                  }
                  setDone(true);
                } catch {
                  setError("Marlow couldn’t reach the server just then. Try again.");
                }
              })
            }
            disabled={!went || pending}
          >
            {pending ? "Saving…" : "Save"}
          </Action>
          <button
            type="button"
            onClick={() =>
              start(async () => {
                await dismissAppointmentPrompt(id);
                router.replace("/today");
              })
            }
            className="mt-4 w-full py-2 text-center text-[14px] text-dune underline underline-offset-4"
          >
            Don&rsquo;t ask about this one
          </button>
        </Reveal>
      </div>
    </Frame>
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
