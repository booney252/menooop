# Product photography

The Evening Powder page reads these nine files. Drop them in here with these
exact names and the page wires itself up — nothing else to change.

| file | ratio | the shot |
| --- | --- | --- |
| `hero-jar-and-box.jpg` | 4:3 | jar and carton on cream, product right, negative space left |
| `ingredients-flat-lay.jpg` | 1:1 | six dishes arranged around the open jar |
| `jar-open-with-scoop.jpg` | 1:1 | open jar with the scoop resting in it, carton beside |
| `jar-open-top-down.jpg` | 1:1 | the powder from above, combed into a spiral |
| `three-jars.jpg` | 1:1 | three jars in a row, the middle one open |
| `unboxing.jpg` | 1:1 | jar in tissue inside the open box, card beside it |
| `hands-scooping.jpg` | 3:4 | a scoop going into a glass of water |
| `bedside-table.jpg` | 3:4 | the closed jar on a bedside table under lamplight |
| `woman-by-window.jpg` | 3:4 | kitchen window, morning light — the stand-in for the film slot |

The hero and the window shot are the two the layout crops. The hero goes to 4:5
on a phone, held at 85% across so the carton's edge stays in frame, and to a
band of `min(82vh, 820px)` above 1024px so the call to action stays above the
fold on a laptop. The window shot keeps its full portrait on a phone — that is
the only crop her face is in — and becomes a 16:9 band above 640px, positioned
at 78% so it lands on the hands, the glass and the jar. Everything else is used
at its native ratio, uncropped.

Files here are ~1280px on the long edge and 100–375KB each, which is sized for
the page rather than for print. If you ever swap in the full-resolution
masters, keep the same nine names and the layout will not need touching.

There is deliberately no back-of-pack or supplement-facts image. The dose table
is built in code — see `components/site/DoseLine.tsx`.
