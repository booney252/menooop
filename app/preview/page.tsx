import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";

export const dynamic = "force-dynamic";

const SCREENS: { path: string; label: string; note: string }[] = [
  { path: "/sign-in", label: "Sign in", note: "The door. Needs Supabase keys to render." },
  { path: "/preview/onboarding", label: "Onboarding", note: "Three steps. Tappable." },
  { path: "/preview/today", label: "Today", note: "Before she has checked in." },
  { path: "/preview/today-done", label: "Today, done", note: "The up-note reflected back." },
  { path: "/preview/today-appointment", label: "Today, after a report", note: "The soft appointment ask." },
  { path: "/preview/check-in", label: "Check-in", note: "The whole flow works — tap through it." },
  { path: "/preview/today-suggestion", label: "Today, with a suggestion", note: "The quiet program card." },
  { path: "/preview/today-program", label: "Today, mid-program", note: "The nightly row." },
  { path: "/preview/programs", label: "Programs", note: "Browse and self-enroll." },
  { path: "/preview/program-enroll", label: "Cool, before starting", note: "Evidence, limits, disclosure." },
  { path: "/preview/program-running", label: "Cool, running", note: "Progress and the weekly note." },
  { path: "/preview/session-audio", label: "Session, audio", note: "The arc. Audio isn’t in yet." },
  { path: "/preview/session-text", label: "Session, text", note: "Paced cards — tap through." },
  { path: "/preview/outcome", label: "Outcome, it worked", note: "The centrepiece." },
  { path: "/preview/outcome-null", label: "Outcome, it didn’t", note: "The honest null result." },
  { path: "/preview/patterns", label: "Patterns", note: "Insight feed and sixty days of marks." },
  { path: "/preview/report", label: "Report", note: "The cover, before generating." },
  { path: "/preview/report-paper", label: "Report, the document", note: "Try printing it." },
  { path: "/preview/ask", label: "Ask Marlow", note: "Sending needs an account." },
  { path: "/preview/settings", label: "Settings", note: "Buttons need an account." },
  { path: "/privacy", label: "Privacy note", note: "Plain words about her data." },
];

/**
 * An index of the design preview, so the screens can be clicked through
 * without a database. Same two gates as the screens themselves.
 */
export default function PreviewIndex() {
  if (process.env.MARLOW_PREVIEW !== "1" || process.env.VERCEL_ENV === "production") notFound();

  return (
    <div className="min-h-dvh bg-ink px-7 py-16">
      <div className="mx-auto max-w-[34rem]">
        <Wordmark />
        <h1 className="display mt-9 text-[31px] leading-[1.15] text-bone">Design preview</h1>
        <p className="mt-4 text-[16px] leading-[1.7] text-dune">
          Every screen rendered from fixtures, with no database behind it. Narrow the window to
          390px, or open it on a phone, to see it the way it is designed.
        </p>
        <p className="mt-4 text-[15px] leading-[1.7] text-dune">
          Anything that writes — saving a check-in, sending a message, changing a setting — needs a
          real account and will do nothing here.
        </p>

        <ul className="mt-10 flex flex-col">
          {SCREENS.map((s, i) => (
            <li key={s.path} className={i === 0 ? "" : "border-t hair"}>
              <Link href={s.path} className="flex items-baseline gap-4 py-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] text-bone">{s.label}</span>
                  <span className="mt-0.5 block text-[14px] text-dune">{s.note}</span>
                </span>
                <span aria-hidden className="text-[15px] text-dune">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
