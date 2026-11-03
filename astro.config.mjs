// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'node:url';
import { SITE } from './src/config/site.ts';
import { hasBoardFiles, isUnlistedBoardPath } from './src/config/board.ts';
import { RUBRIC_IS_DRAFT } from './src/config/rubric.ts';

// Noindex pages stay out of the sitemap: the utility pages, filtered board
// views, and every board page while the rubric is a draft.
const hidden = ['/signups-soon/', '/signed-up/'];
const boardShown = hasBoardFiles(fileURLToPath(new URL('.', import.meta.url)));
const isHidden = (/** @type {string} */ path) =>
  hidden.includes(path) || isUnlistedBoardPath(path, { draft: RUBRIC_IS_DRAFT, boardShown });

export default defineConfig({
  site: SITE.siteUrl,
  output: 'static',
  // Every page is prerendered; the adapter writes Vercel's Build Output and
  // vercel.json still sets the headers.
  adapter: vercel(),
  trailingSlash: 'always',
  vite: {
    // OG image tooling runs only at build time; let Node load it as-is
    // (resvg ships a native addon and satori relies on CommonJS globals).
    ssr: { external: ['satori', '@resvg/resvg-js'] },
  },
  integrations: [
    sitemap({
      filter: (page) => !isHidden(new URL(page).pathname),
    }),
  ],
});
