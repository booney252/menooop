"use client";

import Link from "next/link";

const TABS = [
  { id: "today", label: "Today", href: "/today" },
  { id: "patterns", label: "Patterns", href: "/patterns" },
  { id: "report", label: "Report", href: "/report" },
] as const;

export function TabBar({ active }: { active: string }) {
  return (
    <>
      {/* content settles into the ground before it reaches the bar */}
      <div
        aria-hidden
        className="no-print pointer-events-none absolute inset-x-0 bottom-[70px] z-30 h-16 bg-gradient-to-t from-ink to-transparent"
      />
      <nav
        className="no-print absolute inset-x-0 bottom-0 z-40 border-t hair bg-ink"
        aria-label="Sections"
      >
        <ul className="mx-auto flex max-w-[330px] items-stretch justify-between px-2 pt-1 pb-[max(14px,env(safe-area-inset-bottom))]">
          {TABS.map((t) => {
            const on = t.id === active;
            return (
              <li key={t.id} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className="flex h-[52px] flex-col items-center justify-center gap-[7px] rounded-2xl"
                >
                  <span
                    className="text-[13px] tracking-[0.06em] transition-colors duration-500"
                    style={{ color: on ? "var(--color-bone)" : "var(--color-dune)" }}
                  >
                    {t.label}
                  </span>
                  <span
                    aria-hidden
                    className="h-[5px] w-[5px] rounded-full transition-all duration-500"
                    style={{
                      background: on ? "var(--color-figlift)" : "transparent",
                      transform: on ? "scale(1)" : "scale(0.4)",
                    }}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
