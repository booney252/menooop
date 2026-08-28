"use client";

/** A full-width choice. Tactile, quiet, 60px tall — thumb-sized on purpose. */
export function Stone({
  label,
  aside,
  selected,
  onSelect,
}: {
  label: string;
  aside?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="flex w-full items-center gap-4 rounded-[18px] border px-5 py-4 text-left transition-[background-color,border-color] duration-500"
      style={{
        minHeight: 62,
        background: selected
          ? "color-mix(in srgb, var(--color-figlift) 24%, var(--color-clay))"
          : "var(--color-clay)",
        borderColor: selected ? "var(--color-figlift)" : "var(--hair)",
      }}
    >
      <span className="flex-1">
        <span
          className="block text-[17px] leading-tight"
          style={{ color: selected ? "var(--color-bone)" : "#e4d9e0" }}
        >
          {label}
        </span>
        {aside ? (
          <span className="mt-1 block text-[13.5px] leading-snug text-dune">{aside}</span>
        ) : null}
      </span>
      <span
        aria-hidden
        className="h-[7px] w-[7px] shrink-0 rounded-full transition-all duration-500"
        style={{
          background: selected ? "var(--color-figlift)" : "var(--color-wash)",
          transform: selected ? "scale(1)" : "scale(0.7)",
        }}
      />
    </button>
  );
}

/** A chip in a cloud. Same material, smaller. */
export function Chip({
  label,
  selected,
  onSelect,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      disabled={disabled}
      className="rounded-full border px-4 text-[15.5px] transition-[background-color,border-color,color] duration-500"
      style={{
        minHeight: 46,
        background: selected
          ? "color-mix(in srgb, var(--color-figlift) 24%, var(--color-clay))"
          : "var(--color-clay)",
        borderColor: selected
          ? "var(--color-figlift)"
          : disabled
            ? "transparent"
            : "var(--hair)",
        color: selected ? "var(--color-bone)" : disabled ? "var(--color-dune)" : "#dcd0d8",
      }}
    >
      {label}
    </button>
  );
}

/** The one primary action. There is never a second one on the same screen. */
export function Action({
  children,
  onClick,
  disabled = false,
  tone = "solid",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "solid" | "quiet";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[16px] text-[17px] transition-opacity duration-500 disabled:opacity-30"
      style={{
        minHeight: 56,
        background: tone === "solid" ? "var(--color-fig)" : "transparent",
        border: tone === "solid" ? "1px solid var(--color-fig)" : "1px solid var(--hair)",
        color: tone === "solid" ? "var(--color-bone)" : "#e4d9e0",
      }}
    >
      {children}
    </button>
  );
}

export function Dots({ total, index }: { total: number; index: number }) {
  return (
    <div className="flex items-center gap-[7px]" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-[6px] w-[6px] rounded-full transition-all duration-700"
          style={{
            background:
              i === index
                ? "var(--color-figlift)"
                : i < index
                  ? "color-mix(in srgb, var(--color-figlift) 45%, var(--color-wash))"
                  : "var(--color-wash)",
          }}
        />
      ))}
    </div>
  );
}
