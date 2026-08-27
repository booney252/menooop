import { at, AXIS, DOSE_NOTE, INGREDIENTS } from "@/lib/powder";

/* ─────────────────────────────────────────────────────────────
   The dose line — the signature element of this page.

   Six ingredients hung on one shared time axis. Read the left
   column and it is a menu: name, hairline leader, dose. Read the
   right column and it is a schedule: a plum dot on the night she
   will feel it, and a lilac wash running from the dot to the far
   edge, meaning from here, and it keeps going.

   Rows are ordered by onset rather than by size, so the dots
   descend the page as a staircase.
   ───────────────────────────────────────────────────────────── */

const PHONE_AXIS = AXIS.filter((t) => t.label !== "Week 1");

const COLS = "sm:grid sm:grid-cols-[1fr_minmax(230px,40%)] sm:gap-x-10";

/* Percentages are taken against the track minus the dot's own width, so
   a dot at week 12 sits inside the axis rather than half off the end. */
const dotLeft = (days: number) => `calc(${at(days)} * (100% - 9px))`;
const washFrom = (days: number) => `calc(${at(days)} * (100% - 9px) + 4.5px)`;

/* Four ticks fit above 640px. On a phone "Tonight" and "Week 1" collide,
   so the phone gets three and the staircase still reads. */
function Axis({
  ticks = AXIS,
  className = "",
}: {
  ticks?: typeof AXIS;
  className?: string;
}) {
  return (
    <div className={`relative h-4 ${className}`} aria-hidden>
      {ticks.map((t, i) => {
        const last = i === ticks.length - 1;
        return (
          <span
            key={t.label}
            className="eyebrow absolute top-0 whitespace-nowrap"
            style={{
              left: washFrom(t.days),
              marginLeft: i === 0 ? "-4.5px" : undefined,
              transform: i === 0 ? "none" : last ? "translateX(-100%)" : "translateX(-50%)",
            }}
          >
            {t.label}
          </span>
        );
      })}
    </div>
  );
}

export function DoseLine() {
  return (
    <div>
      {/* the axis: over the whole list on a phone, over its own column above */}
      <Axis ticks={PHONE_AXIS} className="sm:hidden" />
      <div className={`hidden ${COLS}`}>
        <div />
        <Axis />
      </div>

      <div className="relative mt-2">
        {/* One set of verticals behind all six rows, laid out on the same
            grid as the rows, which is what makes this read as one chart
            rather than six decorated table cells. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 hidden ${COLS}`}
        >
          <div />
          <div className="relative">
            {AXIS.map((t, i) => (
              <span
                key={t.label}
                className="absolute inset-y-0 w-px"
                style={{
                  left: `calc(${at(t.days)} * (100% - 9px) + 4px)`,
                  background:
                    i === 0 || i === AXIS.length - 1
                      ? "var(--line-soft)"
                      : "color-mix(in srgb, var(--plum) 6%, transparent)",
                }}
              />
            ))}
          </div>
        </div>

        <ul>
          {INGREDIENTS.map((ing, i) => (
            <li
              key={ing.name}
              className={`rule border-t py-5 sm:items-center sm:py-7 ${COLS}`}
            >
              <div>
                <div className="flex items-baseline gap-3">
                  <h3 className="d-sm text-[19px] sm:text-[25px]">{ing.name}</h3>
                  <span
                    aria-hidden
                    className="h-px flex-1 -translate-y-[3px]"
                    style={{ background: "var(--line-soft)" }}
                  />
                  <span className="d-sm text-[19px] sm:text-[25px]">{ing.dose}</span>
                </div>
                <p className="fine mt-1.5">
                  {ing.does}{" "}
                  <span className="sm:hidden" style={{ color: "var(--plum-lift)" }}>
                    {ing.onset}.
                  </span>
                </p>
              </div>

              <div className="mt-4 sm:mt-0">
                <div className="relative h-[10px] w-full">
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
                    style={{ background: "var(--line)" }}
                  />
                  <span
                    aria-hidden
                    className="draw absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                    style={{
                      left: washFrom(ing.days),
                      right: 0,
                      background: "var(--lilac)",
                      animationDelay: `${i * 90 + 120}ms`,
                    }}
                  />
                  <span
                    aria-hidden
                    className="fadein absolute top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full"
                    style={{
                      left: dotLeft(ing.days),
                      background: "var(--plum)",
                      animationDelay: `${i * 90 + 420}ms`,
                    }}
                  />
                </div>
                <p
                  className="mt-2.5 hidden text-[13px] leading-snug sm:block"
                  style={{ color: "var(--plum-lift)" }}
                >
                  {ing.onset}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rule mt-0 border-t pt-6">
        <p className="fine max-w-2xl">
          Every ingredient at the dose that worked in human studies. Nothing sprinkled
          in for the label. {DOSE_NOTE}
        </p>
      </div>
    </div>
  );
}
