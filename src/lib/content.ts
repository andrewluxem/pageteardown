// Build-time access to content. Cross-file rules that a per-file Zod schema
// cannot express run here (src/lib/boards.ts) and throw, which fails the build.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { flatten, validateBoards, type FlatPage } from './boards';
import { fillSiteTokens } from './site-tokens';
import type { ScoreboardNight } from './schemas';

let cachedNights: ScoreboardNight[] | undefined;

/** Every board night, oldest first. Empty until the first real board lands. */
export async function getBoardNights(): Promise<ScoreboardNight[]> {
  cachedNights ??= validateBoards((await getCollection('scoreboard')).map((e) => ({ id: e.id, data: e.data })));
  return cachedNights;
}

/** True once a board file exists: the board replaces the holding page. */
export async function hasBoard(): Promise<boolean> {
  return (await getBoardNights()).length > 0;
}

export async function getLatestNight(): Promise<ScoreboardNight | undefined> {
  return (await getBoardNights()).at(-1);
}

export async function getAllPages(): Promise<FlatPage[]> {
  return flatten(await getBoardNights());
}

export async function getPage(id: string): Promise<CollectionEntry<'pages'>> {
  const entry = await getEntry('pages', id);
  if (!entry) throw new Error(`Page "${id}" not found in src/content/pages/`);
  return entry;
}

/** A markdown page's rendered HTML with site tokens ({contactEmail}, ...) filled from config. */
export async function getPageHtml(id: string): Promise<{ page: CollectionEntry<'pages'>; html: string }> {
  const page = await getPage(id);
  const html = page.rendered?.html;
  if (html === undefined) throw new Error(`Page "${id}" has no rendered HTML.`);
  return { page, html: fillSiteTokens(html) };
}
