import { chromium } from 'playwright';
const OUT = process.argv[2];
const base = 'http://localhost:3100';
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
const p = await ctx.newPage();

await p.goto(base + '/ask', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await p.screenshot({ path: `${OUT}/20-ask-empty.png` });
console.log('shot empty');

await p.getByRole('button', { name: /driving my/ }).click();
await p.waitForTimeout(9000);
await p.screenshot({ path: `${OUT}/21-ask-answer.png` });
console.log('shot answer');

await p.getByPlaceholder('Ask Marlow anything').fill('what should I say to my doctor?');
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/22-ask-composer.png` });
console.log('shot composer');

await b.close();
