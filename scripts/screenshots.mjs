import { chromium } from "playwright";
import fs from "node:fs";

const OUT = process.argv[2] ?? "./screenshots";
const base = process.env.SHOT_BASE ?? "http://localhost:3100";
fs.mkdirSync(OUT, { recursive: true });

const SCREENS = [
  ["01-sign-in", "/sign-in"],
  ["02-onboarding", "/preview/onboarding"],
  ["03-today", "/preview/today"],
  ["04-today-done", "/preview/today-done"],
  ["05-today-appointment", "/preview/today-appointment"],
  ["06-check-in", "/preview/check-in"],
  ["07-patterns", "/preview/patterns"],
  ["08-report-cover", "/preview/report"],
  ["09-report-paper", "/preview/report-paper"],
  ["10-ask", "/preview/ask"],
  ["11-settings", "/preview/settings"],
  ["12-privacy", "/privacy"],
];

const FULL = new Set(["07-patterns", "09-report-paper", "11-settings", "12-privacy"]);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

const unroll = () =>
  page.evaluate(() => {
    document.querySelectorAll("*").forEach((el) => {
      const s = getComputedStyle(el);
      if (s.overflowY === "auto" || s.overflowY === "scroll") {
        el.style.height = "auto";
        el.style.overflow = "visible";
      }
    });
  });

for (const [name, path] of SCREENS) {
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  if (FULL.has(name)) {
    await unroll();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: FULL.has(name) });
  console.log("shot", name);
}

await browser.close();
