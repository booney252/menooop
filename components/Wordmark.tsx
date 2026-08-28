/**
 * The wordmark, set the way it is set on the packaging: the display face in
 * letterspaced caps, with the jar lilac as the full stop.
 */
export function Wordmark({ size = 15, paper = false }: { size?: number; paper?: boolean }) {
  return (
    <p
      className="display"
      style={{
        fontSize: size,
        fontWeight: 500,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: paper ? "#2b1a26" : "var(--color-bone)",
      }}
    >
      Marlow
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: "50%",
          marginLeft: size * 0.12,
          transform: `translateY(${-size * 0.06}px)`,
          background: paper ? "var(--color-fig)" : "var(--color-figlift)",
        }}
      />
    </p>
  );
}
