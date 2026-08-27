"use client";

import { useId, useState } from "react";

/* Waitlist capture. There is no cart and no checkout anywhere on this
   page — the product has not shipped, so the only thing to ask for is
   an address. Static mockup: nothing is sent anywhere yet. */
export function Waitlist({
  id,
  tone = "cream",
  cta = "Join the waitlist",
  note = "First run is limited. No spam, one email when it’s ready.",
}: {
  id: string;
  tone?: "cream" | "paper";
  cta?: string;
  note?: string;
}) {
  const fieldId = useId();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setErr("That address doesn’t look right — could you check it?");
      return;
    }
    setErr("");
    setDone(true);
  }

  if (done) {
    return (
      <div id={id} className="max-w-md">
        <p className="d-sm text-[22px] sm:text-[26px]">You’re on the list.</p>
        <p className="fine mt-2">
          One email, when the first run is ready. Nothing before then.
        </p>
      </div>
    );
  }

  return (
    <form id={id} onSubmit={submit} noValidate className="max-w-md">
      <label htmlFor={fieldId} className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          id={fieldId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${fieldId}-err` : undefined}
          className="field w-full px-4 py-3 sm:flex-1"
          style={
            tone === "paper"
              ? undefined
              : { background: "color-mix(in srgb, var(--paper) 70%, transparent)" }
          }
        />
        <button type="submit" className="btn px-7 py-3 whitespace-nowrap">
          {cta}
        </button>
      </div>
      {err ? (
        <p id={`${fieldId}-err`} role="alert" className="fine mt-2.5">
          {err}
        </p>
      ) : (
        <p className="fine mt-3">{note}</p>
      )}
    </form>
  );
}
