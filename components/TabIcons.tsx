/**
 * Tab glyphs. Hairline, 18px, drawn in currentColor so the active state comes
 * from the parent. Patterns deliberately uses the app's own mark language —
 * a run of pigment marks on a baseline — rather than a generic bar chart.
 */
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.35,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function TodayIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="4.75" width="14" height="12.25" rx="2.25" />
      <path d="M3 8.5h14M6.75 2.9v3M13.25 2.9v3" />
    </svg>
  );
}

export function AskIcon() {
  return (
    <svg {...base}>
      <path d="M3.75 6.5A2.25 2.25 0 0 1 6 4.25h8A2.25 2.25 0 0 1 16.25 6.5v4.75A2.25 2.25 0 0 1 14 13.5H8.6l-3.35 2.6a.5.5 0 0 1-.8-.4V6.5Z" />
    </svg>
  );
}

export function PatternsIcon() {
  return (
    <svg {...base}>
      <path d="M3 15.5h14" />
      <path d="M5.6 12.6v-2.1M9 12.6V6.9M12.4 12.6V9.2M15.8 12.6V4.6" />
    </svg>
  );
}

export function ReportIcon() {
  return (
    <svg {...base}>
      <path d="M5 3.25h7.25L16 7v9.75H5z" />
      <path d="M12 3.25V7h4M7.75 11h5M7.75 13.6h3.25" />
    </svg>
  );
}

/** a run of sessions, ticked off left to right */
export function ProgramsIcon() {
  return (
    <svg {...base}>
      <circle cx="5" cy="10" r="2.1" />
      <circle cx="10" cy="10" r="2.1" />
      <circle cx="15" cy="10" r="2.1" />
      <path d="M7.1 10h.8M12.1 10h.8" />
    </svg>
  );
}
