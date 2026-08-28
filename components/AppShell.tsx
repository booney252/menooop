"use client";

import { TabBar } from "./TabBar";

export function AppShell({
  children,
  tab,
  footer,
}: {
  children: React.ReactNode;
  tab?: "today" | "ask" | "patterns" | "report";
  /** pinned above the tab bar — used by Ask for its composer */
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#170c13] sm:flex sm:items-center sm:justify-center sm:p-10">
      {/* quiet backdrop — a single warm light source, well off to one side */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 hidden sm:block"
        style={{
          background:
            "radial-gradient(60rem 40rem at 28% 18%, rgba(109,37,68,0.30), transparent 62%), radial-gradient(50rem 40rem at 82% 88%, rgba(194,163,196,0.08), transparent 60%)",
        }}
      />
      <div className="relative w-full bg-ink sm:h-[844px] sm:max-h-[calc(100dvh-5rem)] sm:w-[390px] sm:overflow-hidden sm:rounded-[42px] sm:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(180,159,174,0.14)]">
        <div className="h-dvh overflow-y-auto overscroll-contain sm:h-full">
          {children}
        </div>
        {footer ? (
          <div className="absolute inset-x-0 bottom-[71px] z-40">{footer}</div>
        ) : null}
        {tab ? <TabBar active={tab} withFade={!footer} /> : null}
      </div>
    </div>
  );
}
