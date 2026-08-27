# Marlow — design notes

## The name

Short, warm, grown-up. It reads like a surname, so it can sit on her home
screen without announcing anything about her body to anyone who glances at her
phone. No "meno", no "pause", nothing clinical.

## Who it's for

A woman between 42 and 55 whose sleep broke, whose moods frighten her, who is
gaining weight doing nothing differently, and whose labs came back normal. She
is busy, successful, and has taste. The emotional job of every screen is to
make her feel seen, calm and in control — she should exhale when she opens it.

## Palette — stoneware and ink

Six tokens; everything else is derived.

| token | hex | role |
| --- | --- | --- |
| `ink` | `#201c1a` | the ground — warm near-black, a dark glaze |
| `clay` | `#2b2521` | raised surfaces |
| `bone` | `#f2ebe1` | text on the dark; and the report's paper |
| `dune` | `#a2948a` | secondary text, hairlines |
| `fig` | `#6b3e48` | the one accent — slabs, rules, the letterhead |
| `wash` | `#38302e` | the lowest pigment step, inactive fills |

`--color-figlift` (`#875d62`) is the same accent lifted a shade, used only for
small marks on the dark ground where fig itself sinks into it.

Why fig: terracotta on cream is the house style of every generated wellness
app, teal reads clinical, lavender is the femtech default, and red is banned
outright. Fig is a wine-list colour — feminine without being pink, adult, and
it gives a natural intensity ramp within one hue, so severity is never a
traffic light.

## Type

- **Newsreader** — display. Editorial serif with real character; its italic
  carries the daily insight. Deliberately not Playfair, Cormorant or Fraunces.
- **Instrument Sans** — body. Humanist, warm, highly legible. Not Inter.

No third face. Small-caps labels are the body face at 11px with wide tracking.
Body floor is 17px at 1.65 line height, because she may be reading at 2am
without her glasses.

## The signature element — pigment depth

One device, carried everywhere: anything quantitative is rendered as how much
fig pigment has soaked into the surface.

- The check-in scale is four large stones that fill deeper as she taps.
- Her month is a soft arc of thirty dots, one a day, tinted by that day's load.
- Patterns and the report use sixty-mark strips, where each mark carries the
  day's weight twice — in height and in pigment.
- The report **inverts the material**: bone paper, a fig hairline letterhead,
  the same marks. It's the app's only light surface, so the hero feature reads
  as a printed document from the same house.

All the boldness is spent there. Everything else stays quiet.

## Ask

Marlow speaks in the page; she types in a slab. Her messages sit in a clay
bubble on the right; Marlow's answers are set as flowing body text with a
single fig mark above them, like a paragraph sign in a letter. That asymmetry
is deliberate — a two-column bubble chat would have dragged the whole app into
generic-messenger territory, and Marlow reading as a letter keeps her closer to
the report than to a support widget.

The empty state offers three openers drawn from her own record rather than
generic prompts, so the first thing she sees is that this thing has read her.
The disclaimer sits under the composer permanently, small and calm, because it
is the one line that has to be there every time.

## Rules held throughout

- No photography of any kind, and no emoji as UI. Texture comes from a faint
  paper grain and soft light, nothing else.
- No red, no warning colours, no alarm states. A rough day is still warm.
- No streaks, badges or guilt. Miss a week and the app says nothing.
- No stat tiles, gradient hero cards or dashboard grids. Patterns speaks in
  sentences.
- Text-only tab bar with a single fig dot for the active section — icon tab
  bars are the template tell.
- Marlow never opens an answer with a paragraph of empathy before the point,
  never uses bullet lists unless asked for options, and never says journey,
  warrior, thrive, or "the change".
- One primary action per screen. If there are two, one gets cut.
- Motion is slow settles and fades only, and it respects `prefers-reduced-motion`.
- Tap targets are 44px minimum, focus is always visible, and every colour pair
  used for text clears 4.5:1 against its own background.

## Self-critique, and what changed because of it

"Warm dark neutral, serif display, one accent" is what anyone would produce
for a generic wellness app, so the plan only earns its keep on specifics. Two
things were cut for being template: icon tab bars, and any stat block with a
big number over a small label. Two were pushed harder: the pigment device was
made total rather than decorative, and the report was given a different
material entirely.

One thing changed during the build. The sixty-day strips were pigment-only at
first and read as a flat barcode at phone scale — technically pure, practically
useless. Marks now carry height as well as tone. It is the same language, said
loudly enough to be read.

---

# Marlow Evening Powder — the website

The app is warm dark stoneware. The website is the same brand with the lights
on. Everything below is scoped under `.daylight` in `app/site.css`, so none of
it can reach the app.

## Palette — sampled off the photographs

| token | hex | where it comes from |
| --- | --- | --- |
| `cream` | `#f2e4cc` | the sweep behind the jar in the hero |
| `paper` | `#faf4e9` | the carton and the tissue |
| `plum` | `#4c1b2c` | the lid, taken one step deeper for body ink |
| `plum-lift` | `#6b2740` | the wordmark itself — rules, marks, the button |
| `lilac` | `#d9c6de` | the frosted glass |
| `blush` | `#e9d2da` | the powder |
| `taupe` | `#6f5847` | shadow on the wood — secondary text |

Same hue family as the app's `fig`, lifted into daylight. Every text pair
clears 4.5:1 on its own ground.

## Type

- **Bodoni Moda** — display. The wordmark on the jar is a high-contrast modern
  serif with hairline serifs and a straight-legged R, and this is the honest
  match for it. The optical-size axis keeps the thins hairline at 60px and
  readable at 19px.
- **Instrument Sans** — body, carried over from the app so the two products
  read as one house. Floor is 16.5px at 1.68.

## The signature element — the dose line

The six-ingredient section is not a table with a photograph above it. It is one
chart. A single time axis runs across it — Tonight, Week 1, Week 4, Week 12, on
a square-root scale so the first fortnight gets the room it deserves instead of
being crushed against the left edge by twelve weeks of creatine — and every
ingredient hangs on that same axis. One set of verticals is drawn once behind
all six rows on the same grid the rows use, which is what makes it read as a
chart rather than six decorated table cells.

Read the left column and it is a menu: name, hairline leader, dose. Read the
right and it is a schedule: a plum dot on the night she feels it, and a lilac
wash from the dot to the far edge meaning *from here, and it keeps going*. Rows
are ordered by onset rather than by size, so the dots descend the page as a
staircase — theanine tonight, magnesium and glycine within days, ashwagandha at
a fortnight, saffron at week four, creatine at twelve.

It is the daylight cousin of the app's pigment device: same plum, but position
in time instead of depth. The wash and the stroke come back once more, in the
app section's chart, so the two quantitative moments on the page speak the same
language.

## Self-critique, and what changed because of it

Three things looked generic on the first pass and were changed before the build.

- A small bar beside each ingredient row is exactly what supplement pages do,
  where the bar means "potency" and means nothing. It became *time*, on one
  axis shared by all six rows.
- Bodoni on cream with centred headlines is the 2024 DTC beauty template, so
  nothing on the page is centred. The hero sets flush-left into the
  photograph's negative space and every section hangs off a left rule.
- "What we left out" as a framed manifesto was going to end up a grey box.
  Instead the six excluded names are struck through in large Bodoni with one
  honest line beneath each — no border, the strikethrough doing all the work.

Cut outright: benefit grids, icon rows, trust badges, star ratings, countdowns,
gradient buttons, and any stat block with a big number over a small label.

Two things changed during the build, from reading the screenshots.

- The desktop hero was a full 3:2 photograph with the headline absolutely
  positioned over it, which put the call to action below the fold on a laptop
  and ran the headline into the jar. The photograph is now a band of
  `min(82vh, 820px)` and the text column is held to 44%, so the type stays in
  the cream and the button stays on screen.
- The time axis carried four labels, and on a 390px phone "Tonight" and
  "Week 1" collided into one phrase. The phone gets three; the staircase still
  reads.
- The photographs came in at 4:3 and 3:4 rather than the 3:2 and 4:5 the
  layout had assumed, so the declared ratios were corrected to the real ones
  and only two crops were kept. `--cream` was then resampled off the hero
  photograph's own backdrop (`#f7e4cf`), because the hero is full-bleed and any
  gap between the page ground and the picture shows as a seam under the
  masthead.
- The film slot could not hold the whole portrait on a wide screen. Rather
  than crop her face off centre, the desktop band sits at 78% and lands on the
  hands, the glass and the jar; the phone keeps the full portrait, face
  included. The two crops carry different halves of the same photograph on
  purpose.

## Rules held

- Photography is the product photography and nothing else. No stock, no
  invented people, no fabricated reviews — there are no customers yet.
- Claims stay structure/function. Supports restful sleep, helps with everyday
  stress, supports a calm mood. Never a treatment, never a substitute for HRT.
- The FDA disclaimer is in the footer, small but readable, at 13.5px.
- The app's trend chart is drawn in code and captioned as an illustration. A
  fake screenshot of an app that actually exists would have been the one
  dishonest thing on the page.
- Motion is a single slow rise on entry, and under `prefers-reduced-motion`
  nothing is hidden pending a scroll at all — the page is simply there.
