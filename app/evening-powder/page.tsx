import Image from "next/image";

import { DoseLine } from "@/components/site/DoseLine";
import { Faq } from "@/components/site/Faq";
import { InView } from "@/components/site/InView";
import { Photo } from "@/components/site/Photo";
import { TrendChart } from "@/components/site/TrendChart";
import { Waitlist } from "@/components/site/Waitlist";
import { EXPECT, OMISSIONS } from "@/lib/powder";

const P = "/photos";
const wrap = "mx-auto w-full max-w-[1160px] px-6 sm:px-10";

function HeroCopy() {
  return (
    <div>
      <p className="eyebrow rise">Evening Powder</p>
      <h1 className="d rise mt-5 text-[36px] sm:text-[52px] lg:text-[52px] xl:text-[60px]">
        The evening ritual that actually does something.
      </h1>
      <p className="lede rise mt-6 max-w-[34ch]">
        Six ingredients, and every one of them at its clinical dose.
      </p>
      <div className="rise mt-8">
        <Waitlist id="waitlist-hero" />
      </div>
    </div>
  );
}

export default function EveningPowder() {
  return (
    <main>
      {/* ── masthead ─────────────────────────────────────────── */}
      <header className={`${wrap} flex items-center justify-between py-6 sm:py-8`}>
        <p className="wordmark text-[19px] sm:text-[21px]">Marlow</p>
        <a href="#waitlist" className="eyebrow underline-offset-[6px] hover:underline">
          Join the waitlist
        </a>
      </header>

      {/* ── 1. hero ──────────────────────────────────────────────
          On a phone the headline sits on cream above the photograph.
          The page ground and the photograph's backdrop are the same
          colour, so the type still reads as standing in the picture's
          negative space. Above 1024px it moves into that space for real,
          over a photograph cropped to a band that leaves the call to
          action above the fold on a laptop. */}
      <section>
        <div className="lg:hidden">
          <div className={`${wrap} pt-4 pb-12`}>
            <HeroCopy />
          </div>
          <Photo
            src={`${P}/hero-jar-and-box.jpg`}
            alt="A frosted lilac jar of Marlow Evening Powder beside its cream carton, on warm cream."
            ratio={4 / 5}
            priority
            className="[&_img]:object-[85%_center]"
          />
        </div>

        <div className="relative hidden lg:block">
          <div className="relative h-[min(82vh,820px)] w-full">
            <Image
              src={`${P}/hero-jar-and-box.jpg`}
              alt="A frosted lilac jar of Marlow Evening Powder beside its cream carton, on warm cream."
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_72%]"
            />
          </div>
          <div className="absolute inset-0 flex items-center">
            <div className={`${wrap}`}>
              <div className="w-[44%] max-w-[500px]">
                <HeroCopy />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. the problem, in her words ─────────────────────── */}
      <section className={`${wrap} py-24 sm:py-32`}>
        <InView className="max-w-[24ch] sm:max-w-[30ch]">
          <p className="eyebrow">You’re not imagining it</p>
          <p className="d mt-7 text-[30px] sm:text-[42px] lg:text-[48px]">
            Your bloodwork can come back normal and your body can still not feel
            like yours. Both are true at once.
          </p>
          <p className="lede mt-8 max-w-[42ch]">
            Sleep that breaks at three. A mood that arrives before you do. You
            are not looking for a miracle — you are looking for something that
            helps, made by people who will tell you the truth about it.
          </p>
        </InView>
      </section>

      {/* ── 3. what’s inside ─────────────────────────────────── */}
      <section className={`${wrap} pb-24 sm:pb-32`}>
        <InView>
          <Photo
            src={`${P}/ingredients-flat-lay.jpg`}
            alt="Five small ceramic dishes arranged around the open jar: saffron threads, ashwagandha root, and three white powders."
            ratio={1}
            sizes="(min-width: 1160px) 1080px, 100vw"
            className="lift"
          />
        </InView>

        <InView className="mt-14 sm:mt-20" delay={80}>
          <p className="eyebrow">What’s inside</p>
          <h2 className="d mt-5 max-w-[16ch] text-[34px] sm:text-[48px] lg:text-[56px]">
            Six ingredients. Every one at the clinical dose.
          </h2>
          <p className="lede mt-7 max-w-[46ch]">
            Not a proprietary blend, not a pinch of something for the label. The
            clinical dose is the dose that did the thing in the study, and it is
            the only number worth putting on a jar.
          </p>
        </InView>

        <InView className="mt-14 sm:mt-16" delay={120}>
          <DoseLine />
        </InView>
      </section>

      {/* ── break ────────────────────────────────────────────── */}
      <section className="pb-24 sm:pb-32">
        <div className={`${wrap} grid grid-cols-2 gap-3 sm:gap-6`}>
          <InView>
            <Photo
              src={`${P}/jar-open-top-down.jpg`}
              alt="The open jar from above, the pale lilac powder combed into a slow spiral."
              ratio={1}
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </InView>
          <InView delay={90}>
            <Photo
              src={`${P}/jar-open-with-scoop.jpg`}
              alt="The open jar with its plum scoop resting in the powder, next to the carton."
              ratio={1}
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </InView>
        </div>
      </section>

      {/* ── 4. what we left out ──────────────────────────────── */}
      <section className={`${wrap} py-4 pb-24 sm:pb-32`}>
        <InView className="max-w-[46ch]">
          <p className="eyebrow">The short list</p>
          <h2 className="d mt-5 text-[34px] sm:text-[48px] lg:text-[56px]">
            What’s not in it, and why.
          </h2>
          <p className="lede mt-7">
            Most of what gets put in an evening formula is there because it is
            cheap, familiar, or reads well on a label. Here is what we considered
            and left on the bench.
          </p>
        </InView>

        <InView className="mt-14 sm:mt-16" delay={80}>
          <ul>
            {OMISSIONS.map((o) => (
              <li
                key={o.name}
                className="rule border-t py-6 sm:grid sm:grid-cols-[minmax(0,20rem)_1fr] sm:gap-x-12 sm:py-8"
              >
                <h3
                  className="d-sm text-[22px] sm:text-[27px]"
                  style={{
                    textDecoration: "line-through",
                    textDecorationColor:
                      "color-mix(in srgb, var(--plum-lift) 55%, transparent)",
                    textDecorationThickness: "1px",
                  }}
                >
                  {o.name}
                </h3>
                <p className="mt-3 max-w-[52ch] text-[16.5px] leading-[1.68] sm:mt-0">
                  {o.why}
                </p>
              </li>
            ))}
          </ul>
          <div className="rule border-t pt-6">
            <p className="fine max-w-2xl">
              None of this makes any of them dangerous, and some of them may yet
              turn out to work. They are simply not good enough, yet, to take
              your money for.
            </p>
          </div>
        </InView>
      </section>

      {/* ── 5. the ritual ────────────────────────────────────── */}
      <section className={`${wrap} py-24 sm:py-32`}>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <InView>
            <Photo
              src={`${P}/hands-scooping.jpg`}
              alt="A scoop of the pale powder falling into a glass of water on a marble counter, a warm kitchen behind."
              ratio={3 / 4}
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </InView>
          <InView delay={90}>
            <Photo
              src={`${P}/bedside-table.jpg`}
              alt="The closed jar on a bedside table beside a lamp, a book, reading glasses and a drained glass."
              ratio={3 / 4}
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </InView>
        </div>

        <InView className="mt-14 sm:mt-20">
          <p className="eyebrow">The ritual</p>
          <h2 className="d mt-5 max-w-[15ch] text-[34px] sm:text-[48px] lg:text-[56px]">
            One scoop, and the day is closed.
          </h2>

          <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-10">
            {[
              {
                n: "One",
                h: "One scoop in water",
                p: "Stir it into a tall glass of cold water. It dissolves clean — faintly berry, barely sweet, no grit at the bottom.",
              },
              {
                n: "Two",
                h: "Thirty to sixty minutes before bed",
                p: "Early enough that the theanine has arrived by the time you do. Not something to swallow with the light already off.",
              },
              {
                n: "Three",
                h: "Every night",
                p: "This is the part most people skip. Four of the six ingredients only work because they are repeated.",
              },
            ].map((s) => (
              <li key={s.n} className="rule border-t pt-5">
                <p className="eyebrow">{s.n}</p>
                <h3 className="d-sm mt-3 text-[21px] sm:min-h-[2.5em] sm:text-[23px]">{s.h}</h3>
                <p className="fine mt-2.5">{s.p}</p>
              </li>
            ))}
          </ol>

          <p className="lede mt-14 max-w-[40ch]">
            Give it a fortnight and it stops being a supplement you remember to
            take. It becomes the door that closes the day.
          </p>
        </InView>
      </section>

      {/* ── full-bleed. A film goes here once we have one; until then
             the photograph holds the space at the same proportions. ── */}
      <section className="relative">
        <div className="sm:hidden">
          <Photo
            src={`${P}/woman-by-window.jpg`}
            alt="A woman in a cream sweater at a kitchen window in morning light, holding a glass, the open jar beside her."
            ratio={3 / 4}
          />
        </div>
        <div className="hidden sm:block">
          <Photo
            src={`${P}/woman-by-window.jpg`}
            alt="A woman in a cream sweater at a kitchen window in morning light, holding a glass, the open jar beside her."
            ratio={16 / 9}
            sizes="100vw"
            className="[&_img]:object-[center_78%]"
          />
        </div>
      </section>

      {/* ── 6. track that it’s working ───────────────────────── */}
      <section className={`${wrap} py-24 sm:py-32`}>
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
          <InView>
            <p className="eyebrow">The app</p>
            <h2 className="d mt-5 max-w-[14ch] text-[34px] sm:text-[48px] lg:text-[52px]">
              Don’t take our word for it. Watch your own data.
            </h2>
            <p className="lede mt-7 max-w-[44ch]">
              Marlow is also an app, and it is free. Thirty seconds each evening —
              how you slept, how you felt — and it keeps the record for you.
            </p>
            <p className="mt-5 max-w-[44ch] text-[16.5px] leading-[1.68]">
              Start the powder and the line simply keeps going. So four weeks in,
              when you are trying to remember whether anything actually changed,
              you do not have to remember. You can look.
            </p>
          </InView>
          <InView delay={100}>
            <TrendChart />
          </InView>
        </div>
      </section>

      {/* ── 7. honesty ───────────────────────────────────────── */}
      <section className={`${wrap} pb-24 sm:pb-32`}>
        <InView className="max-w-[42ch]">
          <p className="eyebrow">Plainly</p>
          <h2 className="d mt-5 text-[34px] sm:text-[46px]">
            What to expect, and when.
          </h2>
        </InView>

        <InView className="mt-12 sm:mt-14" delay={80}>
          <ul className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            {EXPECT.map((e) => (
              <li key={e.when} className="rule border-t pt-5">
                <h3 className="d-sm text-[21px] sm:text-[23px]">{e.when}</h3>
                <p className="fine mt-3">{e.what}</p>
              </li>
            ))}
          </ul>
          <p className="lede mt-12 max-w-[52ch]">
            This is gradual support, not a drug. It supports restful sleep, helps
            with everyday stress and supports a calm, steady mood — slowly, and
            alongside everything else you are doing. It is not a treatment for
            anything, and anyone promising you otherwise is selling something.
          </p>
        </InView>
      </section>

      {/* ── 8. FAQ ───────────────────────────────────────────── */}
      <section className={`${wrap} pb-24 sm:pb-32`}>
        <InView className="max-w-[42ch]">
          <p className="eyebrow">Questions</p>
          <h2 className="d mt-5 text-[34px] sm:text-[46px]">
            The things worth asking.
          </h2>
        </InView>
        <InView className="mt-12 sm:mt-14" delay={60}>
          <Faq />
        </InView>
      </section>

      {/* ── 9. waitlist and footer ───────────────────────────── */}
      <section
        id="waitlist"
        className="rule scroll-mt-8 border-t"
        style={{ background: "var(--paper)" }}
      >
        <div className={`${wrap} grid gap-14 py-24 sm:py-32 lg:grid-cols-2 lg:items-center lg:gap-20`}>
          <InView>
            <p className="eyebrow">The first run</p>
            <h2 className="d mt-5 max-w-[15ch] text-[34px] sm:text-[48px] lg:text-[54px]">
              We are making a small number of jars.
            </h2>
            <p className="lede mt-7 max-w-[42ch]">
              Doses this size are expensive to make and we would rather run out
              than cut them. Leave your address and you will hear from us once,
              when the first run is ready.
            </p>
            <div className="mt-9">
              <Waitlist id="waitlist-footer" tone="paper" />
            </div>
          </InView>
          <InView delay={100} className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-4">
            <Photo
              src={`${P}/three-jars.jpg`}
              alt="Three jars of Evening Powder in a row on a wooden surface, the middle one open."
              ratio={1}
              sizes="(min-width: 1160px) 460px, (min-width: 640px) 45vw, 100vw"
            />
            <Photo
              src={`${P}/unboxing.jpg`}
              alt="The jar nested in tissue inside its open box, with a plum card beside it."
              ratio={1}
              sizes="(min-width: 1160px) 460px, (min-width: 640px) 45vw, 100vw"
            />
          </InView>
        </div>
      </section>

      <footer className="rule border-t" style={{ background: "var(--paper)" }}>
        <div className={`${wrap} py-14`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-4">
            <p className="wordmark text-[19px]">Marlow</p>
            <p className="eyebrow">You’re not imagining it.</p>
          </div>
          <p className="fine mt-10 max-w-3xl text-[13.5px]">
            These statements have not been evaluated by the Food and Drug
            Administration. This product is not intended to diagnose, treat, cure,
            or prevent any disease.
          </p>
          <p className="fine mt-4 text-[13.5px]">
            Marlow Evening Powder is a dietary supplement. It is not a hormone and
            it is not a replacement for hormone therapy. Speak to your healthcare
            provider before starting anything new.
          </p>
          <p className="fine mt-8 text-[13.5px]">
            © {new Date().getFullYear()} Marlow
          </p>
        </div>
      </footer>
    </main>
  );
}
