// Renders the app icons from the wordmark, so they match the brand rather
// than being a placeholder. Run once: node scripts/make-icons.mjs
import { chromium } from "playwright";
import fs from "node:fs";

const html = (size, maskable) => `
<html><head>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;padding:0}
  .tile{width:${size}px;height:${size}px;background:#201c1a;display:flex;
        align-items:center;justify-content:center;position:relative}
  .m{font-family:Newsreader,Georgia,serif;color:#f2ebe1;font-size:${size * (maskable ? 0.4 : 0.52)}px;
     line-height:1;letter-spacing:-0.02em}
  .dot{position:absolute;width:${size * 0.075}px;height:${size * 0.075}px;border-radius:50%;
       background:#875d62;left:${size * (maskable ? 0.635 : 0.70)}px;top:${size * (maskable ? 0.355 : 0.325)}px}
</style></head>
<body><div class="tile"><span class="m">M</span><span class="dot"></span></div></body></html>`;

const browser = await chromium.launch();
for (const [name, size, maskable] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable.png", 512, true],
  ["apple-icon.png", 180, false],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html(size, maskable), { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const buf = await page.screenshot({ omitBackground: false });
  fs.writeFileSync(`public/icons/${name}`, buf);
  console.log("wrote", name, size);
  await page.close();
}
await browser.close();
