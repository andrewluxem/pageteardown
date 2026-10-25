// Build-time access to the markdown pages in src/content/pages/.
import { getEntry, type CollectionEntry } from 'astro:content';
import { fillSiteTokens } from './site-tokens';

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
