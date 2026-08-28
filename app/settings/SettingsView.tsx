"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Action, Chip } from "@/components/Choice";
import { Reveal } from "@/components/Reveal";
import { INTERVENTION_SUGGESTIONS, SYMPTOMS, type SymptomKey } from "@/lib/symptoms";
import { longDay } from "@/lib/day";
import {
  addIntervention,
  endIntervention,
  removeIntervention,
  updateProfileDetails,
  updateSymptoms,
} from "@/app/actions/profile";
import { signOut } from "@/app/actions/auth";
import { deleteAccount } from "@/app/actions/account";
import type { Intervention, Profile } from "@/lib/types";

export function SettingsView({
  profile,
  interventions,
}: {
  profile: Profile;
  interventions: Intervention[];
}) {
  return (
    <div className="min-h-dvh bg-ink sm:flex sm:items-center sm:justify-center sm:p-10">
      <div className="relative w-full bg-ink sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(162,148,138,0.12)]">
        <div className="h-dvh overflow-y-auto px-7 pt-14 pb-16 sm:h-full">
          <Reveal delay={40}>
            <div className="flex items-baseline justify-between">
              <h1 className="display text-[28px] text-bone">Settings</h1>
              <Link href="/today" className="py-2 text-[14px] text-dune underline underline-offset-4">
                Done
              </Link>
            </div>
          </Reveal>

          <SymptomsSection current={profile.symptoms} />
          <InterventionsSection interventions={interventions} />
          <NudgeSection profile={profile} />
          <DataSection />
          <DangerSection />
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-11">
      <h2 className="label mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SymptomsSection({ current }: { current: SymptomKey[] }) {
  const [chosen, setChosen] = useState<SymptomKey[]>(current);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const changed = chosen.join() !== current.join();

  return (
    <Card title="What Marlow asks you">
      <div className="flex flex-wrap gap-2.5">
        {SYMPTOMS.map((s) => {
          const on = chosen.includes(s.key);
          return (
            <Chip
              key={s.key}
              label={s.label}
              selected={on}
              disabled={!on && chosen.length >= 6}
              onSelect={() =>
                setChosen((list) => (on ? list.filter((k) => k !== s.key) : [...list, s.key]))
              }
            />
          );
        })}
      </div>
      <p className="mt-4 text-[13.5px] leading-relaxed text-dune">
        Three to six. Changing these does not touch anything you have already logged.
      </p>
      {changed && (
        <div className="mt-4">
          <Action
            onClick={() =>
              start(async () => {
                try {
                  const r = await updateSymptoms(chosen);
                  setMessage("error" in r && r.error ? r.error : "Saved.");
                } catch {
                  setMessage("Couldn’t reach the server. Try again.");
                }
              })
            }
            disabled={pending || chosen.length < 3}
          >
            {pending ? "Saving…" : "Save these"}
          </Action>
        </div>
      )}
      {message && <p className="mt-3 text-[14px] text-dune">{message}</p>}
    </Card>
  );
}

function InterventionsSection({ interventions }: { interventions: Intervention[] }) {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const active = interventions.filter((i) => !i.ended_on);
  const past = interventions.filter((i) => i.ended_on);

  return (
    <Card title="What you're trying">
      {active.length === 0 && past.length === 0 && (
        <p className="text-[15px] leading-relaxed text-dune">
          Nothing logged yet. Adding something here is what lets Marlow compare before and after.
        </p>
      )}

      <ul className="flex flex-col gap-2.5">
        {active.map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-3 rounded-[16px] border hair bg-clay px-4 py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] text-[#ded3c7]">{i.name}</span>
              <span className="block text-[13px] text-dune">Since {longDay(i.started_on)}</span>
            </span>
            <button
              type="button"
              onClick={() => start(() => void endIntervention(i.id))}
              className="shrink-0 px-2 py-2 text-[13.5px] text-dune underline underline-offset-4"
            >
              I’ve stopped
            </button>
          </li>
        ))}
        {past.map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-3 rounded-[16px] border hair px-4 py-3 opacity-70"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] text-dune">{i.name}</span>
              <span className="block text-[13px] text-dune">
                {longDay(i.started_on)} to {longDay(i.ended_on!)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => start(() => void removeIntervention(i.id))}
              className="shrink-0 px-2 py-2 text-[13.5px] text-dune underline underline-offset-4"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {INTERVENTION_SUGGESTIONS.filter(
          (s) => !interventions.some((i) => i.name.toLowerCase() === s.toLowerCase())
        ).map((s) => (
          <Chip key={s} label={s} selected={false} onSelect={() => start(() => void addIntervention(s))} />
        ))}
      </div>

      <div className="mt-4 flex gap-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Something else"
          className="min-w-0 flex-1 rounded-[16px] border hair bg-clay px-4 text-[16px] text-bone placeholder:text-dune"
          style={{ minHeight: 48 }}
        />
        <button
          type="button"
          disabled={!name.trim() || pending}
          onClick={() =>
            start(async () => {
              await addIntervention(name);
              setName("");
            })
          }
          className="shrink-0 rounded-[16px] border hair px-5 text-[15px] text-[#ded3c7] disabled:opacity-40"
          style={{ minHeight: 48 }}
        >
          Add
        </button>
      </div>
    </Card>
  );
}

function NudgeSection({ profile }: { profile: Profile }) {
  const [enabled, setEnabled] = useState(profile.nudge_enabled);
  const [hour, setHour] = useState(profile.nudge_hour ?? 20);
  const [, start] = useTransition();

  const save = (next: { nudge_enabled?: boolean; nudge_hour?: number }) =>
    start(() => void updateProfileDetails(next));

  return (
    <Card title="A reminder, if you want one">
      <button
        type="button"
        onClick={() => {
          const next = !enabled;
          setEnabled(next);
          save({ nudge_enabled: next, nudge_hour: hour });
        }}
        aria-pressed={enabled}
        className="flex w-full items-center gap-3.5 rounded-[16px] border px-5 py-3.5 text-left transition-colors duration-500"
        style={{
          minHeight: 54,
          background: enabled
            ? "color-mix(in srgb, var(--color-figlift) 24%, var(--color-clay))"
            : "var(--color-clay)",
          borderColor: enabled ? "var(--color-figlift)" : "var(--hair)",
        }}
      >
        <span
          aria-hidden
          className="h-[7px] w-[7px] shrink-0 rounded-full"
          style={{ background: enabled ? "var(--color-figlift)" : "var(--color-wash)" }}
        />
        <span className="text-[16px] text-[#ded3c7]">One email a day, at most</span>
      </button>

      {enabled && (
        <div className="mt-4">
          <label htmlFor="hour" className="label mb-2 block">
            Around what time
          </label>
          <select
            id="hour"
            value={hour}
            onChange={(e) => {
              const h = Number(e.target.value);
              setHour(h);
              save({ nudge_hour: h });
            }}
            className="w-full rounded-[16px] border hair bg-clay px-4 text-[16px] text-bone"
            style={{ minHeight: 48 }}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
      )}
      <p className="mt-4 text-[13.5px] leading-relaxed text-dune">
        No streaks, no nagging. If you ignore it, it will not mention it.
      </p>
    </Card>
  );
}

function DataSection() {
  return (
    <Card title="Your data">
      <a
        href="/api/export"
        className="flex w-full items-center justify-center rounded-[16px] border hair text-[16px] text-[#ded3c7]"
        style={{ minHeight: 52 }}
      >
        Download everything
      </a>
      <p className="mt-3 text-[13.5px] leading-relaxed text-dune">
        A JSON file with every check-in, note, insight and conversation.
      </p>
      <Link
        href="/privacy"
        className="mt-5 inline-block py-2 text-[15px] text-dune underline underline-offset-4"
      >
        What Marlow does with your data
      </Link>
    </Card>
  );
}

function DangerSection() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card title="Leaving">
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-[16px] border hair text-[16px] text-[#ded3c7]"
          style={{ minHeight: 52 }}
        >
          Sign out
        </button>
      </form>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 py-2 text-[15px] text-dune underline underline-offset-4"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-5 rounded-[18px] border hair bg-clay px-5 py-5">
          <p className="display text-[19px] leading-snug text-bone">
            This deletes everything, for good.
          </p>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-dune">
            Every check-in, note, insight, report and conversation is removed from the database.
            We cannot get it back for you. Download your data first if you want to keep it.
          </p>
          <label htmlFor="confirm" className="label mt-5 mb-2 block">
            Type delete to confirm
          </label>
          <input
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoCapitalize="none"
            className="w-full rounded-[14px] border hair bg-ink px-4 text-[16px] text-bone"
            style={{ minHeight: 48 }}
          />
          {error && <p className="mt-3 text-[14px] leading-relaxed text-[#e0c9c2]">{error}</p>}
          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              className="flex-1 rounded-[14px] border hair text-[15px] text-[#ded3c7]"
              style={{ minHeight: 48 }}
            >
              Keep it
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  try {
                    const r = await deleteAccount(confirm);
                    if (r && "error" in r && r.error) {
                      setError(r.error);
                      return;
                    }
                    window.location.href = "/sign-in?deleted=1";
                  } catch {
                    setError("Marlow couldn’t reach the server just then. Try again.");
                  }
                })
              }
              className="flex-1 rounded-[14px] border border-fig bg-fig text-[15px] text-bone disabled:opacity-40"
              style={{ minHeight: 48 }}
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
