// Where the board's nightly files come from. Real boards live in
// src/content/scoreboard/ (the only folder the nightly publisher may change).
// Fixture boards live in tests/fixtures/scoreboard/ and load instead of them
// only for `npm run dev:fixtures` (PT_FIXTURES=1) and Vercel preview builds.
// A production build never loads fixtures. Plain Node can import this file.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export const BOARD_DIR = 'src/content/scoreboard';
export const FIXTURE_DIR = 'tests/fixtures/scoreboard';

type Env = Record<string, string | undefined>;

/**
 * True for PT_FIXTURES=1 and for Vercel preview builds (VERCEL_ENV=preview),
 * unless PT_FIXTURES=0. Never in a Vercel production build: PT_FIXTURES=1
 * there throws, so a misset variable fails the deploy instead of shipping
 * fixtures.
 */
export function fixturesEnabled(env: Env = process.env): boolean {
  if (env.VERCEL_ENV === 'production') {
    if (env.PT_FIXTURES === '1') throw new Error('PT_FIXTURES=1 is not allowed in a production build (VERCEL_ENV=production)');
    return false;
  }
  if (env.PT_FIXTURES === '0') return false;
  return env.PT_FIXTURES === '1' || env.VERCEL_ENV === 'preview';
}

/** The folder the scoreboard collection loads, relative to the repo root. */
export function boardDir(env: Env = process.env): string {
  return fixturesEnabled(env) ? FIXTURE_DIR : BOARD_DIR;
}

/** Whether the folder the build loads holds at least one board file. */
export function hasBoardFiles(root: string, env: Env = process.env): boolean {
  try {
    return readdirSync(join(root, boardDir(env))).some((f) => f.endsWith('.md'));
  } catch {
    return false;
  }
}

/**
 * Board paths left out of the sitemap: filtered views always (they repeat the
 * board), and while the rubric is a draft, every page of a board that is
 * showing, since those pages are noindex.
 */
export function isUnlistedBoardPath(path: string, opts: { draft: boolean; boardShown: boolean }): boolean {
  if (path.startsWith('/board/')) return true;
  if (!opts.draft || !opts.boardShown) return false;
  return path === '/' || /^\/(page|brand|methodology)\//.test(path);
}
