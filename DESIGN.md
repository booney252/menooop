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

## Carried into the production build

The palette, type, signature device and voice are unchanged from the design
demo — that build won the aesthetic and this one does not drift from it. What
changed is what sits behind them.

**Today stayed a glance.** The insight card grew a supporting visual, so the
reasoning behind an insight moved to Patterns and the done-for-today card lost
its list of severity ratings. Playing five ratings back at her reads like an
audit, which is the one thing that screen must never do. It now reflects the
good thing back and stops.

**Nothing quantitative appears without a sentence.** Every strip, every
comparison bar, every mark has plain language next to it. Where there is too
little data, the sentence says so — "only four days logged so far, too few to
read anything into" — rather than drawing a shape out of nothing.

**Insight language is observational.** "Your logs show", "you have tended to",
never "you have". The engine tests assert this, along with the tone rules, so
the voice cannot quietly drift as rules get added.

**The appointment prompt is small enough to ignore.** One line and a link,
below the primary action, asked once per report and dismissible for good.

## The session player

The nightly habit, so it gets the most care: full screen, no tab bar, one thing
on it. Audio sessions are a single filling arc — the same mark the month arc is
drawn from, at the largest size it appears anywhere in the app. Text sessions
are one card at a time with a thin run of segments beneath, so the length is
visible without being a progress bar to grind through.

The outcome screen is the only place the app makes a claim about itself, so it
is the one place the numbers are set in the display face at full size. The
curve underneath is daily marks plus a mean line either side of a hairline
where the program began. Days she did not log are simply absent — the line is
never interpolated across a gap she did not fill, because the whole value of
the screen is that it is hers and it is true.

## Rules held throughout

- No photography of any kind, and no emoji as UI. Texture comes from a faint
  paper grain and soft light, nothing else.
- No red, no warning colours, no alarm states. A rough day is still warm.
- No streaks, badges or guilt. Miss a week and the app says nothing.
- No stat tiles, gradient hero cards or dashboard grids. Patterns speaks in
  sentences.
- The tab bar carries a hairline glyph over a letterspaced-caps label. Icons
  were left out at first on the grounds that icon tab bars are the template
  tell; they earn their place here by being drawn in the app's own language
  rather than pulled from an icon set — Patterns is a run of pigment marks on
  a baseline, the same mark the strips and the arc are made of.
- Anything centred with letterspacing needs the trailing space cancelled, or
  the glyphs sit visibly left of centre. Flex children take a negative
  `margin-right`; centred text takes a `text-indent` of the same size.
- Marlow never opens an answer with a paragraph of empathy before the point,
  never uses bullet lists unless asked for options, and never says journey,
  warrior, thrive, or "the change".
- No streaks, no badges, no guilt. A missed day gets silence; a return gets a
  soft welcome and no accounting of what was missed.
- Nothing quantitative ships without a plain-language sentence beside it, and
  no pattern is claimed that the thresholds do not support.
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
