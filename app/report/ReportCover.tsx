"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Action } from "@/components/Choice";
import { Reveal } from "@/components/Reveal";
import { generateReport } from "@/app/actions/report";

const WINDOWS = [30, 60, 90] as const;

export function ReportCover({ loggedDays }: { loggedDays: number }) {
  const [span, setSpan] = useState<(typeof WINDOWS)[number]>(60);
  const [say, setSay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const make = () =>
    start(async () => {
      setError(null);
      try {
        const result = await generateReport(span, say);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        router.push(`/report/${result.id}`);
      } catch {
        setError("Marlow couldn’t reach the server. Check your connection and try again.");
      }
    });

  const thin = loggedDays < 7;

  return (
    <AppShell tab="report">
      <div className="flex min-h-dvh flex-col px-7 pt-16 pb-36 sm:min-h-[844px]">
        <Reveal delay={80}>
          <p className="label">For your appointment</p>
          <h1 className="display mt-7 text-[33px] leading-[1.14] text-bone">
            One page to take
            <br />
            into the room.
          </h1>
        </Reveal>

        <Reveal delay={320}>
          <p className="mt-7 max-w-[19rem] text-[17px] leading-[1.7] text-[#dcd0d8]">
            {thin
              ? "There isn’t much to put on a page yet. A week or two of check-ins and this becomes worth printing."
              : "Your check-ins, set out so a doctor can read them in twenty seconds. How often, how heavy, what you’ve already tried."}
          </p>
        </Reveal>

        {!thin && (
          <>
            <Reveal delay={460} className="mt-9">
              <p className="label mb-3">How far back</p>
              <div className="flex gap-2">
                {WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSpan(w)}
                    aria-pressed={span === w}
                    className="flex-1 rounded-[14px] border text-[15px] transition-colors duration-500"
                    style={{
                      minHeight: 48,
                      borderColor: span === w ? "var(--color-figlift)" : "var(--hair)",
                      background:
                        span === w
                          ? "color-mix(in srgb, var(--color-figlift) 24%, var(--color-clay))"
                          : "var(--color-clay)",
                      color: span === w ? "var(--color-bone)" : "#dcd0d8",
                    }}
                  >
                    {w} days
                  </button>
                ))}
              </div>
            </Reveal>

            <Reveal delay={560} className="mt-8">
              <label htmlFor="say" className="label mb-3 block">
                What you want to say
              </label>
              <textarea
                id="say"
                value={say}
                onChange={(e) => setSay(e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="The thing you’re afraid you’ll forget once you’re in there."
                className="w-full resize-none rounded-[18px] border hair bg-clay px-5 py-4 text-[16.5px] leading-relaxed text-bone placeholder:text-dune"
              />
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-dune">
                It prints at the top, in your words.
              </p>
            </Reveal>
          </>
        )}

        <div className="flex-1" />

        <Reveal delay={720}>
          {error && (
            <p className="mb-3 text-center text-[14.5px] leading-relaxed text-[#ebccda]">{error}</p>
          )}
          <Action onClick={make} disabled={pending || thin}>
            {pending ? "Putting it together…" : "Prepare the report"}
          </Action>
          <p className="mt-4 text-center text-[14px] text-dune">
            {thin ? "Keep checking in — it will be here." : "Print it, or save it as a PDF."}
          </p>
        </Reveal>
      </div>
    </AppShell>
  );
}
