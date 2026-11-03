import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { boardDir } from './config/board';
import { pageSchema, scoreboardSchema } from './lib/schemas';

export const collections = {
  // src/content/scoreboard/, or the fixture boards when fixtures are on
  // (src/config/board.ts).
  scoreboard: defineCollection({
    loader: glob({ pattern: '*.md', base: `./${boardDir()}` }),
    schema: scoreboardSchema,
  }),
  pages: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/pages' }),
    schema: pageSchema,
  }),
};
