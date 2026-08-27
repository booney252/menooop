import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] || "./screenshots/site";
const URL = `http://localhost:${process.env.PORT_SITE ?? 3200}/evening-powder`;
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();

async function run(label, viewport, opts = {}) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2, ...opts });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle" });
  // let every InView fire, then settle
  await p.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${OUT}/${label}-full.png`, fullPage: true });

  // section-by-section, the way it will be screen-recorded
  const marks = await p.$$("main > section, main > footer, main > header");
  for (let i = 0; i < marks.length; i++) {
    await marks[i].scrollIntoViewIfNeeded();
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/${label}-${String(i).padStart(2, "0")}.png` });
  }
  console.log(label, "→", marks.length + 1, "shots");
  await ctx.close();
}

await run("m", { width: 390, height: 844 }, { isMobile: true, hasTouch: true });
await run("d", { width: 1440, height: 900 });
await b.close();
