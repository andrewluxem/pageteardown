import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOARD_DIR, FIXTURE_DIR, boardDir, fixturesEnabled, hasBoardFiles, isUnlistedBoardPath } from '../src/config/board';

describe('fixture switch', () => {
  it('is off by default, so a plain build loads src/content/scoreboard/', () => {
    expect(fixturesEnabled({})).toBe(false);
    expect(boardDir({})).toBe(BOARD_DIR);
  });
  it('is on for PT_FIXTURES=1 (npm run dev:fixtures) and for Vercel preview builds', () => {
    expect(fixturesEnabled({ PT_FIXTURES: '1' })).toBe(true);
    expect(fixturesEnabled({ VERCEL_ENV: 'preview' })).toBe(true);
    expect(boardDir({ PT_FIXTURES: '1' })).toBe(FIXTURE_DIR);
  });
  it('can be turned off on a preview with PT_FIXTURES=0', () => {
    expect(fixturesEnabled({ VERCEL_ENV: 'preview', PT_FIXTURES: '0' })).toBe(false);
  });
  it('is never on in a Vercel production build', () => {
    expect(fixturesEnabled({ VERCEL_ENV: 'production' })).toBe(false);
    expect(() => fixturesEnabled({ VERCEL_ENV: 'production', PT_FIXTURES: '1' })).toThrow(/not allowed in a production build/);
  });
  it('package.json dev:fixtures sets PT_FIXTURES=1', async () => {
    const pkg = (await import('../package.json', { with: { type: 'json' } })).default as { scripts: Record<string, string> };
    expect(pkg.scripts['dev:fixtures']).toBe('PT_FIXTURES=1 astro dev');
    expect(pkg.scripts.build).toBe('astro build');
  });
  it('reads the content collection from the switched folder', async () => {
    const config = await import('node:fs').then((fs) => fs.readFileSync(join(import.meta.dirname, '../src/content.config.ts'), 'utf8'));
    expect(config).toContain('base: `./${boardDir()}`');
  });
});

describe('hasBoardFiles', () => {
  const root = mkdtempSync(join(tmpdir(), 'board-'));
  mkdirSync(join(root, BOARD_DIR), { recursive: true });
  mkdirSync(join(root, FIXTURE_DIR), { recursive: true });
  writeFileSync(join(root, BOARD_DIR, '.gitkeep'), '');
  writeFileSync(join(root, FIXTURE_DIR, '2026-10-30.md'), '---\n---\n');

  it('is false with no real board file, so / stays the holding page', () => {
    expect(hasBoardFiles(root, {})).toBe(false);
  });
  it('is true for the fixture folder when fixtures are on', () => {
    expect(hasBoardFiles(root, { PT_FIXTURES: '1' })).toBe(true);
  });
  it('is true once a real board file exists', () => {
    writeFileSync(join(root, BOARD_DIR, '2026-11-02.md'), '---\n---\n');
    expect(hasBoardFiles(root, {})).toBe(true);
  });
  it('is false for a missing folder', () => {
    expect(hasBoardFiles(join(root, 'nowhere'), {})).toBe(false);
  });
});

describe('sitemap', () => {
  it('always leaves out filtered board views', () => {
    expect(isUnlistedBoardPath('/board/apparel/all/', { draft: false, boardShown: true })).toBe(true);
  });
  it('leaves out every board page while the rubric is a draft and a board is showing', () => {
    for (const p of ['/', '/page/2026-10-30-brand-a-home/', '/brand/brand-a/', '/methodology/']) {
      expect(isUnlistedBoardPath(p, { draft: true, boardShown: true }), p).toBe(true);
      expect(isUnlistedBoardPath(p, { draft: false, boardShown: true }), p).toBe(false);
    }
  });
  it('keeps the holding page at / when no board is showing', () => {
    expect(isUnlistedBoardPath('/', { draft: true, boardShown: false })).toBe(false);
    expect(isUnlistedBoardPath('/watchlist/', { draft: true, boardShown: true })).toBe(false);
  });
});
