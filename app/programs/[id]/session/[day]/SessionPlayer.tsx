"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { audioUrl, type ProgramId, type SessionContent } from "@/content/programs";
import { completeSession } from "@/app/actions/programs";

type Phase = "playing" | "rating" | "done";

const RATINGS = [
  { key: "helped", label: "That helped" },
  { key: "neutral", label: "Neutral" },
  { key: "not_for_me", label: "Not for me" },
] as const;

/**
 * The nightly habit, so it gets the most care. Full screen, no tab bar, one
 * thing on it. Audio sessions get a filling arc — the same mark the month arc
 * is drawn from; text sessions get one card at a time.
 */
export function SessionPlayer({
  programId,
  programName,
  enrollmentId,
  session,
  total,
  alreadyDone,
}: {
  programId: ProgramId;
  programName: string;
  enrollmentId: string;
  session: SessionContent;
  total: number;
  alreadyDone: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("playing");
  const [saving, setSaving] = useState(false);

  const finish = useCallback(() => setPhase("rating"), []);

  async function record(rating: string | null) {
    setSaving(true);
    try {
      await completeSession(enrollmentId, session.day, rating);
    } catch {
      // The session still happened. Losing the tick is not worth an error page.
    }
    setSaving(false);
    setPhase("done");
  }

  return (
    <div className="min-h-dvh bg-ink sm:flex sm:items-center sm:justify-center sm:p-10">
      <div className="relative w-full bg-ink sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(180,159,174,0.14)]">
        <div className="flex h-dvh flex-col overflow-y-auto px-7 pt-14 pb-10 sm:h-full">
          <header className="flex items-center justify-between">
            <Link
              href={`/programs/${programId}`}
              className="-ml-2 flex items-center px-2 text-[15px] text-dune"
              style={{ minHeight: 44 }}
            >
              Close
            </Link>
            <p className="label" style={{ textIndent: "0.22em" }}>
              {programName} · day {session.day} of {total}
            </p>
          </header>

          {phase === "playing" &&
            (session.kind === "audio" ? (
              <AudioSession programId={programId} session={session} onFinish={finish} />
            ) : (
              <TextSession session={session} onFinish={finish} />
            ))}

          {phase === "rating" && <Rating saving={saving} onPick={record} />}

          {phase === "done" && (
            <Done
              programId={programId}
              alreadyDone={alreadyDone}
              onBack={() => router.replace(`/programs/${programId}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── audio ───────────────────────────────────────────────────────────────────

function AudioSession({
  programId,
  session,
  onFinish,
}: {
  programId: ProgramId;
  session: SessionContent;
  onFinish: () => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [length, setLength] = useState(session.minutes * 60);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const tick = () => setElapsed(el.currentTime);
    const meta = () => setLength(el.duration || session.minutes * 60);
    const ended = () => {
      setPlaying(false);
      onFinish();
    };
    el.addEventListener("timeupdate", tick);
    el.addEventListener("loadedmetadata", meta);
    el.addEventListener("ended", ended);
    return () => {
      el.removeEventListener("timeupdate", tick);
      el.removeEventListener("loadedmetadata", meta);
      el.removeEventListener("ended", ended);
    };
  }, [onFinish, session.minutes]);

  const progress = length ? Math.min(1, elapsed / length) : 0;
  const remaining = Math.max(0, Math.round(length - elapsed));
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  function toggle() {
    const el = audio.current;
    if (!el || missing) return;
    if (el.paused) {
      void el.play().catch(() => setMissing(true));
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Reveal delay={80}>
        <h1 className="display mt-12 text-[30px] leading-[1.14] text-bone">{session.title}</h1>
        {session.intro && (
          <p className="mt-4 max-w-[19rem] text-[16px] leading-[1.65] text-dune">
            {session.intro}
          </p>
        )}
      </Reveal>

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <Reveal delay={240}>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="relative flex items-center justify-center"
            style={{ width: 220, height: 220 }}
          >
            <svg viewBox="0 0 220 220" width="220" height="220" aria-hidden>
              <circle cx="110" cy="110" r="96" fill="none" stroke="var(--color-wash)" strokeWidth="2" />
              <circle
                cx="110"
                cy="110"
                r="96"
                fill="none"
                stroke="var(--color-figlift)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 96}
                strokeDashoffset={2 * Math.PI * 96 * (1 - progress)}
                transform="rotate(-90 110 110)"
                style={{ transition: "stroke-dashoffset 0.4s linear" }}
              />
            </svg>
            <span className="absolute flex flex-col items-center">
              <span className="display text-[34px] leading-none text-bone">
                {playing ? "Pause" : "Play"}
              </span>
              <span className="mt-3 text-[14px] text-dune">
                {missing ? "—" : `${mm}:${ss} left`}
              </span>
            </span>
          </button>
        </Reveal>

        {missing && (
          <p className="mt-8 max-w-[17rem] text-center text-[14.5px] leading-relaxed text-dune">
            This session’s audio isn’t in yet. You can still mark it done, and it will be here
            next time.
          </p>
        )}
      </div>

      <audio
        ref={audio}
        src={audioUrl(programId, session.ref)}
        preload="metadata"
        onError={() => setMissing(true)}
      />

      <button
        type="button"
        onClick={onFinish}
        className="w-full py-3 text-center text-[15px] text-dune underline underline-offset-4"
      >
        {missing ? "Mark this done" : "I’ve finished this one"}
      </button>
    </div>
  );
}

// ── text ────────────────────────────────────────────────────────────────────

function TextSession({
  session,
  onFinish,
}: {
  session: SessionContent;
  onFinish: () => void;
}) {
  const cards = session.cards ?? [];
  const [index, setIndex] = useState(0);
  const last = index >= cards.length - 1;

  return (
    <div className="flex flex-1 flex-col">
      <Reveal delay={80}>
        <h1 className="display mt-12 text-[30px] leading-[1.14] text-bone">{session.title}</h1>
        {session.intro && (
          <p className="mt-4 max-w-[19rem] text-[16px] leading-[1.65] text-dune">
            {session.intro}
          </p>
        )}
      </Reveal>

      <div className="flex flex-1 items-center py-10">
        <Reveal key={index} delay={40}>
          <p className="text-[21px] leading-[1.6] text-bone">{cards[index]}</p>
        </Reveal>
      </div>

      <div className="mb-6 flex items-center gap-[7px]" aria-hidden>
        {cards.map((_, i) => (
          <span
            key={i}
            className="h-[5px] flex-1 rounded-full transition-colors duration-500"
            style={{
              background: i <= index ? "var(--color-figlift)" : "var(--color-wash)",
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => (last ? onFinish() : setIndex(index + 1))}
        className="w-full rounded-[16px] border border-fig bg-fig text-[17px] text-bone"
        style={{ minHeight: 56 }}
      >
        {last ? "That’s the session" : "Next"}
      </button>
    </div>
  );
}

// ── after ───────────────────────────────────────────────────────────────────

function Rating({
  saving,
  onPick,
}: {
  saving: boolean;
  onPick: (rating: string | null) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center py-10">
      <Reveal delay={80}>
        <h2 className="display text-[30px] leading-[1.14] text-bone">How was that?</h2>
        <p className="mt-4 text-[15.5px] leading-relaxed text-dune">
          One tap. It helps Marlow know which sessions are worth keeping.
        </p>
      </Reveal>

      <Reveal delay={260} className="mt-9 flex flex-col gap-3">
        {RATINGS.map((r) => (
          <button
            key={r.key}
            type="button"
            disabled={saving}
            onClick={() => onPick(r.key)}
            className="w-full rounded-[18px] border hair bg-clay px-5 text-left text-[17px] text-[#e4d9e0] disabled:opacity-40"
            style={{ minHeight: 62 }}
          >
            {r.label}
          </button>
        ))}
      </Reveal>

      <button
        type="button"
        disabled={saving}
        onClick={() => onPick(null)}
        className="mt-6 w-full py-3 text-center text-[15px] text-dune underline underline-offset-4"
      >
        Skip
      </button>
    </div>
  );
}

function Done({
  programId,
  alreadyDone,
  onBack,
}: {
  programId: ProgramId;
  alreadyDone: boolean;
  onBack: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onBack, 2600);
    return () => window.clearTimeout(t);
  }, [onBack]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <Reveal delay={100}>
        <p className="display text-[38px] leading-none text-bone">
          {alreadyDone ? "Again." : "Done."}
        </p>
      </Reveal>
      <Reveal delay={480}>
        <p className="mt-6 max-w-[17rem] text-[17px] leading-relaxed text-dune">
          {alreadyDone
            ? "Repeating one is allowed, and sometimes the point."
            : "That’s today’s. Nothing else is asked of you."}
        </p>
      </Reveal>
      <Reveal delay={1100}>
        <Link
          href={`/programs/${programId}`}
          className="mt-10 block text-[15px] text-dune underline underline-offset-4"
        >
          Back to the program
        </Link>
      </Reveal>
    </div>
  );
}
