"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Reveal } from "@/components/Reveal";
import { DISCLAIMER } from "@/lib/marlow-prompt";
import { clearChat } from "@/app/actions/chat";
import type { ChatMessage } from "@/lib/types";

type Turn = { id: string; role: "user" | "assistant"; content: string };

export function AskView({
  initial,
  starters,
  live,
}: {
  initial: ChatMessage[];
  starters: string[];
  live: boolean;
}) {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startClear] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;
      setDraft("");
      setBusy(true);

      const mine: Turn = { id: `u${Date.now()}`, role: "user", content: question };
      const hers: Turn = { id: `a${Date.now()}`, role: "assistant", content: "" };
      setTurns((t) => [...t, mine, hers]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: question }),
        });
        if (!res.body) throw new Error("no body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setTurns((t) => t.map((x) => (x.id === hers.id ? { ...x, content: acc } : x)));
        }
        if (!acc.trim()) {
          setTurns((t) =>
            t.map((x) =>
              x.id === hers.id
                ? { ...x, content: "I didn’t manage an answer there. Try asking again." }
                : x
            )
          );
        }
      } catch {
        setTurns((t) =>
          t.map((x) =>
            x.id === hers.id
              ? {
                  ...x,
                  content:
                    "I couldn’t reach my end just then. Check your connection and try again.",
                }
              : x
          )
        );
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  const empty = turns.length === 0;

  return (
    <AppShell
      tab="ask"
      footer={
        <Composer value={draft} onChange={setDraft} onSend={() => send(draft)} busy={busy} />
      }
    >
      <div className="flex min-h-full flex-col px-7 pt-14 pb-[196px]">
        <header className="flex items-center justify-between">
          <p className="label">Ask Marlow</p>
          {!empty && (
            <button
              type="button"
              onClick={() =>
                startClear(async () => {
                  setTurns([]);
                  await clearChat();
                  router.refresh();
                })
              }
              className="-my-3 py-3 text-[14px] text-dune underline underline-offset-4"
            >
              Clear
            </button>
          )}
        </header>

        {empty ? (
          <div className="flex flex-1 flex-col justify-center py-10">
            <Reveal delay={120}>
              <h1 className="display text-[32px] leading-[1.14] text-bone">
                What&rsquo;s on your mind?
              </h1>
              <p className="mt-5 max-w-[19rem] text-[16.5px] leading-[1.65] text-dune">
                Marlow has read your check-ins. Ask about what you&rsquo;re feeling, what might
                help, or what to say at your appointment.
              </p>
            </Reveal>

            <Reveal delay={340} className="mt-9">
              <ul className="flex flex-col gap-2.5">
                {starters.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => send(q)}
                      className="w-full rounded-[18px] border hair bg-clay px-5 py-4 text-left text-[16px] leading-snug text-[#e4d9e0]"
                      style={{ minHeight: 58 }}
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </Reveal>

            {!live && (
              <Reveal delay={520}>
                <p className="mt-8 text-[13px] leading-relaxed text-dune">
                  Marlow isn&rsquo;t connected to its language model right now, so it can&rsquo;t
                  answer. Your check-ins are still saving normally.
                </p>
              </Reveal>
            )}
          </div>
        ) : (
          <ol className="mt-9 flex flex-col gap-8">
            {turns.map((m) =>
              m.role === "user" ? (
                <li key={m.id} className="flex justify-end">
                  <p className="max-w-[84%] rounded-[18px] rounded-br-[6px] border hair bg-clay px-4 py-3 text-[16.5px] leading-[1.55] text-bone">
                    {m.content}
                  </p>
                </li>
              ) : (
                <li key={m.id}>
                  <span
                    aria-hidden
                    className="mb-3 block h-[6px] w-[6px] rounded-full"
                    style={{ background: "var(--color-figlift)" }}
                  />
                  {m.content ? (
                    <div className="flex flex-col gap-3.5">
                      {m.content.split(/\n{2,}/).map((para, i) => (
                        <p key={i} className="text-[17px] leading-[1.7] text-bone">
                          {para}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <Composing />
                  )}
                </li>
              )
            )}
          </ol>
        )}
        <div ref={endRef} />
      </div>
    </AppShell>
  );
}

function Composing() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-label="Marlow is writing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="breathe block h-[6px] w-[6px] rounded-full"
          style={{ background: "var(--color-figlift)", animationDelay: `${i * 220}ms` }}
        />
      ))}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 116)}px`;
  }, [value]);

  return (
    <div className="border-t hair bg-ink px-5 pt-3 pb-3">
      <div className="flex items-end gap-2.5">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          maxLength={2000}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask Marlow anything"
          className="flex-1 resize-none rounded-[20px] border hair bg-clay px-4 py-3 text-[16.5px] leading-[1.45] text-bone placeholder:text-dune"
          style={{ minHeight: 48 }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={busy || !value.trim()}
          aria-label="Send"
          className="flex shrink-0 items-center justify-center rounded-full transition-opacity duration-500 disabled:opacity-30"
          style={{ height: 48, width: 48, background: "var(--color-fig)" }}
        >
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M10 16V4M10 4L4.5 9.5M10 4l5.5 5.5"
              stroke="var(--color-bone)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-center text-[12px] text-dune">{DISCLAIMER}</p>
    </div>
  );
}
