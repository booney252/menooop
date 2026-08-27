/* ─────────────────────────────────────────────────────────────
   The app section's chart. Drawn in code, in the page palette —
   deliberately not a mocked-up screenshot of an interface, because
   a fake screenshot of an app that exists would be the one dishonest
   thing on an otherwise honest page.

   Same plum stroke and lilac wash as the dose line, so the two
   quantitative moments on the page speak the same language.
   ───────────────────────────────────────────────────────────── */

const W = 640;
const H = 210;
const PAD_L = 6;
const PAD_R = 12;
const START = 0.34; // where the powder starts, as a fraction of the width

/* A fixed sequence, so the server and the client draw the same curve. */
function noise(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function series(seed: number, before: number, after: number, wobble: number) {
  const rnd = noise(seed);
  const n = 56;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // flat before the start, then a slow climb that flattens off
    const climb =
      t <= START ? 0 : Math.min(1, (t - START) / (1 - START)) ** 0.62;
    const level = before + (after - before) * climb;
    const jitter = (rnd() - 0.5) * wobble * (t <= START ? 1 : 0.62);
    pts.push([PAD_L + t * (W - PAD_L - PAD_R), level + jitter]);
  }
  return pts;
}

/* Catmull-Rom through the points, so the line is soft rather than spiky. */
function path(pts: [number, number][]) {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const sleep = series(7, 148, 62, 26);
const mood = series(23, 160, 92, 22);
const sleepPath = path(sleep);
const moodPath = path(mood);
const fill = `${sleepPath} L ${W - PAD_R} ${H} L ${PAD_L} ${H} Z`;
const x0 = PAD_L + START * (W - PAD_L - PAD_R);

export function TrendChart() {
  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="An illustration of the app's chart: sleep and mood sit flat and uneven for the first weeks, then climb steadily and settle after the powder begins."
      >
        <defs>
          <linearGradient id="mw-under" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lilac)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--lilac)" stopOpacity="0" />
          </linearGradient>
          <clipPath id="mw-after">
            <rect x={x0} y="0" width={W - x0 - PAD_R + 2} height={H} />
          </clipPath>
        </defs>

        <text
          x={PAD_L}
          y="16"
          fill="var(--taupe)"
          fontSize="11"
          letterSpacing="2"
          style={{ textTransform: "uppercase" }}
        >
          Better
        </text>

        {/* the wash only exists after she starts — same device as the dose line */}
        <path d={fill} fill="url(#mw-under)" clipPath="url(#mw-after)" />

        <line
          x1="0"
          y1={H - 1}
          x2={W}
          y2={H - 1}
          stroke="var(--line)"
          strokeWidth="1"
        />
        <line
          x1={x0}
          y1="8"
          x2={x0}
          y2={H - 1}
          stroke="var(--plum)"
          strokeWidth="1"
          strokeDasharray="2 5"
          opacity="0.45"
        />

        <path
          d={moodPath}
          fill="none"
          stroke="var(--plum)"
          strokeOpacity="0.42"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d={sleepPath}
          fill="none"
          stroke="var(--plum)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        <circle
          cx={sleep[sleep.length - 1][0]}
          cy={sleep[sleep.length - 1][1]}
          r="4.5"
          fill="var(--plum)"
        />
      </svg>

      <div className="relative mt-3 h-4">
        <p
          className="eyebrow absolute top-0 whitespace-nowrap"
          style={{ left: `${(x0 / W) * 100}%`, transform: "translateX(-4px)" }}
        >
          First scoop
        </p>
        <p className="eyebrow absolute top-0 right-0">Sleep · Mood</p>
      </div>
      <figcaption className="fine mt-3">
        An illustration, not a customer. Your chart is your own.
      </figcaption>
    </figure>
  );
}
