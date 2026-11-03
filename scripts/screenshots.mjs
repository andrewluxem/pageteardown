// Full-page screenshots of key routes at desktop and phone widths, for PR
// review. Run after a build: `npm run screenshots`. The board routes exist
// only in a build with a board, so build with fixtures for them
// (`PT_FIXTURES=1 npm run build`); routes the build lacks are skipped.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const PORT = 4329;
const BASE = `http://localhost:${PORT}`;
const OUT = new URL('../docs/screenshots/', import.meta.url);
const WIDTHS = [1280, 375];
const PAGES = [
  ['board', '/'],
  ['board-apparel', '/board/apparel/all/'],
  ['page-normal', '/page/2026-10-30-brand-a-home/'],
  ['page-hygiene-capped', '/page/2026-10-30-brand-j-home/'],
  ['page-image-headline', '/page/2026-10-30-brand-k-home/'],
  ['brand', '/brand/brand-o/'],
  ['methodology', '/methodology/'],
];

const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'ignore' });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview server did not start');
}

try {
  await waitForServer();
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    for (const [name, path] of PAGES) {
      const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
      if (!res?.ok()) {
        console.log('skipped', path, `(HTTP ${res?.status()})`);
        continue;
      }
      await page.evaluate(() => document.fonts.ready);
      const file = new URL(`${name}-${width}.png`, OUT);
      await page.screenshot({ path: file.pathname, fullPage: true });
      console.log('saved', file.pathname);
    }
    await page.close();
  }
  await browser.close();
} finally {
  server.kill();
}
