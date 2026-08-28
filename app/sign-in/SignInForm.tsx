"use client";

import { useActionState } from "react";
import { Reveal } from "@/components/Reveal";
import { sendMagicLink, type SignInState } from "@/app/actions/auth";

export function SignInForm({ next, problem }: { next: string; problem: string | null }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(sendMagicLink, {});

  return (
    <div className="min-h-dvh bg-[#170c13] sm:flex sm:items-center sm:justify-center sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 hidden sm:block"
        style={{
          background:
            "radial-gradient(60rem 40rem at 28% 18%, rgba(109,37,68,0.30), transparent 62%)",
        }}
      />
      <div className="relative w-full bg-ink sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(180,159,174,0.14)]">
        <div className="flex h-dvh flex-col overflow-y-auto px-7 pt-16 pb-12 sm:h-full">
          <Reveal delay={80}>
            <p className="display text-[19px] tracking-[0.02em] text-bone">
              Marlow
              <span
                aria-hidden
                className="ml-[6px] inline-block h-[5px] w-[5px] translate-y-[-3px] rounded-full"
                style={{ background: "var(--color-figlift)" }}
              />
            </p>
          </Reveal>

          {state.sent ? (
            <Sent email={state.sent} />
          ) : (
            <>
              <div className="flex flex-1 flex-col justify-center py-12">
                <Reveal delay={240}>
                  <h1 className="display text-[38px] leading-[1.1] text-bone">
                    You&rsquo;re not
                    <br />
                    imagining it.
                  </h1>
                </Reveal>
                <Reveal delay={500}>
                  <p className="mt-7 max-w-[19rem] text-[17px] leading-[1.7] text-[#dcd0d8]">
                    Normal bloodwork and a body that no longer feels like yours can both be true
                    at once.
                  </p>
                </Reveal>
                <Reveal delay={660}>
                  <p className="mt-4 max-w-[19rem] text-[17px] leading-[1.7] text-dune">
                    Marlow keeps the record. So the next time someone asks how you&rsquo;ve
                    actually been, you have an answer instead of a guess.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={860}>
                <form action={action}>
                  <input type="hidden" name="next" value={next} />
                  <label htmlFor="email" className="label mb-3 block">
                    Your email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-[16px] border hair bg-clay px-5 text-[17px] text-bone placeholder:text-dune"
                    style={{ minHeight: 56 }}
                  />
                  {(state.error || problem) && (
                    <p className="mt-3 text-[14.5px] leading-relaxed text-[#ebccda]">
                      {state.error ?? problem}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-3.5 w-full rounded-[16px] border border-fig bg-fig text-[17px] text-bone transition-opacity duration-500 disabled:opacity-40"
                    style={{ minHeight: 56 }}
                  >
                    {pending ? "Sending…" : "Send me a link"}
                  </button>
                  <p className="mt-4 text-center text-[14px] leading-relaxed text-dune">
                    No password to remember. The link signs you straight in.
                  </p>
                </form>
              </Reveal>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Sent({ email }: { email: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center py-12">
      <Reveal delay={120}>
        <h1 className="display text-[34px] leading-[1.12] text-bone">Check your email.</h1>
      </Reveal>
      <Reveal delay={380}>
        <p className="mt-7 max-w-[19rem] text-[17px] leading-[1.7] text-[#dcd0d8]">
          We&rsquo;ve sent a link to <span className="text-bone">{email}</span>. Open it on this
          device and you&rsquo;re in.
        </p>
      </Reveal>
      <Reveal delay={540}>
        <p className="mt-4 max-w-[19rem] text-[17px] leading-[1.7] text-dune">
          If it hasn&rsquo;t arrived in a minute or two, check your spam folder — it sometimes
          lands there the first time.
        </p>
      </Reveal>
    </div>
  );
}
