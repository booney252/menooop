"use client";

import Link from "next/link";
import { AskIcon, PatternsIcon, ProgramsIcon, ReportIcon, TodayIcon } from "./TabIcons";

const TABS = [
  { id: "today", label: "Today", href: "/today", Icon: TodayIcon },
  { id: "programs", label: "Programs", href: "/programs", Icon: ProgramsIcon },
  { id: "ask", label: "Ask", href: "/ask", Icon: AskIcon },
  { id: "patterns", label: "Patterns", href: "/patterns", Icon: PatternsIcon },
  { id: "report", label: "Report", href: "/report", Icon: ReportIcon },
] as const;

/** the tracking on the labels, kept here because the centering depends on it */
const TRACKING = "0.1em";

export function TabBar({
  active,
  withFade = true,
}: {
  active: string;
  withFade?: boolean;
}) {
  return (
    <>
      {/* content settles into the ground before it reaches the bar */}
      {withFade ? (
        <div
          aria-hidden
          className="no-print pointer-events-none absolute inset-x-0 bottom-[70px] z-30 h-16 bg-gradient-to-t from-ink to-transparent"
        />
      ) : null}
      <nav
        className="no-print absolute inset-x-0 bottom-0 z-40 border-t hair bg-ink"
        aria-label="Sections"
      >
        <ul className="mx-auto flex max-w-[372px] items-stretch justify-between px-1 pt-1 pb-[max(14px,env(safe-area-inset-bottom))]">
          {TABS.map(({ id, label, href, Icon }) => {
            const on = id === active;
            return (
              <li key={id} className="flex-1">
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className="flex h-[52px] flex-col items-center justify-center gap-[5px] rounded-2xl transition-colors duration-500"
                  style={{ color: on ? "var(--color-bone)" : "var(--color-dune)" }}
                >
                  <Icon />
                  <span
                    className="text-[9.5px] uppercase"
                    style={{
                      letterSpacing: TRACKING,
                      fontWeight: on ? 600 : 500,
                      // letter-spacing adds a trailing space after the last
                      // letter, which pushes centred text visibly off to the
                      // left. Pull it back by the same amount.
                      marginRight: `-${TRACKING}`,
                    }}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
