// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { SITE } from './src/config/site.ts';

// Noindex utility pages stay out of the sitemap.
const hidden = ['/signups-soon/', '/signed-up/'];
const isHidden = (/** @type {string} */ path) => hidden.includes(path);

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
