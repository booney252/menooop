import { chromium } from 'playwright';

const OUT = process.argv[2];
const base = 'http://localhost:3100';

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const p = await ctx.newPage();

async function shot(name, url, fn) {
  await p.goto(base + url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  if (fn) await fn(p);
  await p.waitForTimeout(1900);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
}

// fresh: onboarding
await shot('01-onboarding-door', '/onboarding');
await shot('02-onboarding-stage', '/onboarding', async (p) => {
  await p.getByRole('button', { name: 'Begin' }).click();
});
await shot('03-onboarding-symptoms', '/onboarding', async (p) => {
  await p.getByRole('button', { name: 'Begin' }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Unpredictable/ }).first().click();
  await p.waitForTimeout(700);
  for (const s of ['Waking at 3am', 'Anxiety', 'Brain fog', 'Hot flushes', 'Flat energy']) {
    await p.getByRole('button', { name: s, exact: true }).click();
    await p.waitForTimeout(120);
  }
});
await shot('04-onboarding-taking', '/onboarding', async (p) => {
  await p.getByRole('button', { name: 'Begin' }).click();
  await p.waitForTimeout(900);
  await p.getByRole('button', { name: /Unpredictable/ }).first().click();
  await p.waitForTimeout(700);
  for (const s of ['Waking at 3am', 'Anxiety', 'Brain fog']) {
    await p.getByRole('button', { name: s, exact: true }).click();
    await p.waitForTimeout(100);
  }
  await p.getByRole('button', { name: /Continue with/ }).click();
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: /considering/ }).click();
  await p.getByRole('button', { name: 'Magnesium glycinate' }).click();
});

await shot('05-today', '/today');
await shot('06-checkin', '/check-in');
await shot('07-checkin-note', '/check-in', async (p) => {
  for (let i = 0; i < 5; i++) {
    await p.getByRole('button', { name: /Barely there|Noticeable/ }).first().click();
    await p.waitForTimeout(560);
  }
});
await shot('08-checkin-saved', '/check-in', async (p) => {
  for (let i = 0; i < 5; i++) {
    await p.getByRole('button', { name: /Noticeable/ }).first().click();
    await p.waitForTimeout(560);
  }
  await p.getByRole('button', { name: 'Save today' }).click();
});
await shot('09-today-done', '/today');
await shot('10-patterns', '/patterns');
await shot('11-report-cover', '/report');
await shot('12-report-paper', '/report', async (p) => {
  await p.getByRole('button', { name: 'Prepare the report' }).click();
});
// the scroll lives in an inner element, so release it before a full-length shot
const unroll = () =>
  p.evaluate(() => {
    document.querySelectorAll('*').forEach((el) => {
      const s = getComputedStyle(el);
      if (s.overflowY === 'auto' || s.overflowY === 'scroll') {
        el.style.height = 'auto';
        el.style.overflow = 'visible';
      }
    });
  });

await p.goto(base + '/report', { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
await p.getByRole('button', { name: 'Prepare the report' }).click();
await p.waitForTimeout(2600);
await unroll();
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/13-report-full.png`, fullPage: true });

await p.goto(base + '/patterns', { waitUntil: 'networkidle' });
await p.waitForTimeout(2600);
await unroll();
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/14-patterns-full.png`, fullPage: true });

await b.close();
