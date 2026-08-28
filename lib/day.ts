/**
 * Days are plain 'YYYY-MM-DD' strings throughout — the same shape Postgres
 * stores. Her local day is worked out once, from her profile timezone, and
 * after that there are no timezones to get wrong.
 */

export type Day = string;

const DAY_MS = 86_400_000;

/** today where she is, not where the server is */
export function todayIn(timezone: string, now: Date = new Date()): Day {
  try {
    // en-CA formats as YYYY-MM-DD, which is exactly what we want
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

export const isDay = (v: unknown): v is Day =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

const toUtc = (day: Day) => Date.parse(`${day}T00:00:00Z`);
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const shiftDay = (day: Day, delta: number): Day => fromUtc(toUtc(day) + delta * DAY_MS);

/** whole days from a to b; negative when b is earlier */
export const daysBetween = (a: Day, b: Day): number => Math.round((toUtc(b) - toUtc(a)) / DAY_MS);

/** oldest first, ending on `end` inclusive */
export function daysEnding(end: Day, count: number): Day[] {
  const out: Day[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(shiftDay(end, -i));
  return out;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const parts = (day: Day) => {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m, d };
};

export function longDay(day: Day): string {
  const { y, m, d } = parts(day);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function dayAndMonth(day: Day): string {
  const { m, d } = parts(day);
  return `${d} ${MONTHS[m - 1]}`;
}

export function shortDay(day: Day): string {
  const { m, d } = parts(day);
  return `${d} ${MONTHS[m - 1].slice(0, 3)}`;
}

export function weekdayOf(day: Day): string {
  return WEEKDAYS[new Date(toUtc(day)).getUTCDay()];
}

/** "29 June – 27 August 2026" — the year said once */
export function dayRange(from: Day, to: Day): string {
  const a = parts(from);
  const b = parts(to);
  const left = a.y === b.y ? `${a.d} ${MONTHS[a.m - 1]}` : longDay(from);
  return `${left} – ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
}
