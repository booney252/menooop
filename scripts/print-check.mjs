import { chromium } from 'playwright';
const b = await chromium.launch();
// A4 at 96dpi minus 14mm side margins
const p = await b.newPage({ viewport: { width: 741, height: 1000 } });
await p.goto('http://localhost:3100/preview/report-paper', { waitUntil: 'networkidle' });
await p.waitForTimeout(2600);
await p.emulateMedia({ media: 'print' });
await p.waitForTimeout(400);
const h = await p.evaluate(() => document.documentElement.scrollHeight);
console.log('print height px (A4 page ≈ 1046px tall inside margins):', h);
await p.screenshot({ path: process.argv[2], fullPage: true });
await b.close();
