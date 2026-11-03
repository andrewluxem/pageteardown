import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIMENSION_KEYS } from '../src/config/rubric';
import { boardFileProblems } from '../src/lib/boards';
import { isPublicReason, scoreboardSchema, type ScoreboardNight } from '../src/lib/schemas';
import { fixture, fixtureFiles, frontmatter } from './helpers';

// A valid night in the page contract; the tests below patch one field at a time.
const good = {
  date: '2026-10-30',
  generated_at: '2026-10-31T13:00:00Z',
  rubric_version: '1.0-draft',
  pages: [
    {
      id: '2026-10-30-brand-a-home',
      brand: 'Brand A (placeholder)',
      brand_slug: 'brand-a',
      vertical: 'apparel',
      homepage_kind: 'storefront',
      url: 'https://www.brand-a.example/',
      captured_at: '2026-10-31T04:20:00Z',
      hero_headline: 'New season denim',
      primary_cta: { text: 'Shop denim', href: '/collections/denim' },
      dimensions: Object.fromEntries(DIMENSION_KEYS.map((k) => [k, { score: 3, note: 'n', source: 'judgment' }])),
      checks: [],
    } as Record<string, unknown>,
  ],
  not_captured: [] as Record<string, unknown>[],
};
const page0 = good.pages[0] as { dimensions: Record<string, Record<string, unknown>> } & Record<string, unknown>;
const withPage = (patch: Record<string, unknown>) => ({ ...good, pages: [{ ...page0, ...patch }] });
const withDims = (patch: Record<string, unknown>) => withPage({ dimensions: { ...page0.dimensions, ...patch } });
const missed = (brand_slug: string, reason = 'The site blocked our capture browser.') => ({ brand: 'Brand Q (placeholder)', brand_slug, vertical: 'home', reason });

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }): string[] {
  return (result.error?.issues ?? []).map((i) => i.path.join('.'));
}
const ok = (v: unknown) => scoreboardSchema.safeParse(v).error?.issues ?? [];

describe('the base night', () => {
  it('passes', () => {
    expect(ok(good)).toEqual([]);
  });
});

describe('the fixture boards', () => {
  it('are three nights', () => {
    expect(fixtureFiles()).toEqual(['2026-10-28.md', '2026-10-29.md', '2026-10-30.md']);
  });
  it.each(fixtureFiles())('%s passes the schema', (f) => {
    expect(ok(fixture(f))).toEqual([]);
  });
  it('pass the cross-file rules', () => {
    const files = fixtureFiles().map((f) => ({ id: f.replace(/\.md$/, ''), data: scoreboardSchema.parse(fixture(f)) }));
    expect(boardFileProblems(files)).toEqual([]);
  });
});

describe('a malformed board', () => {
  const result = scoreboardSchema.safeParse(frontmatter(join(import.meta.dirname, 'fixtures/malformed-scoreboard.md')));
  const paths = issuePaths(result);
  it('fails validation', () => expect(result.success).toBe(false));
  it('flags the missing eighth dimension', () => expect(paths).toContain('pages.0.dimensions.hygiene'));
  it('flags a score of 6', () => expect(paths).toContain('pages.0.dimensions.cta.score'));
  it('flags an unknown vertical', () => expect(paths).toContain('pages.0.vertical'));
  it('flags an unquoted rubric_version', () => expect(paths).toContain('rubric_version'));
  it('flags an unknown key', () => expect(result.error?.issues.some((i) => i.path.join('.') === 'pages.0' && /subject/.test(i.message))).toBe(true));
});

describe('strict dimensions', () => {
  it('rejects a missing dimension', () => {
    const { hygiene: _, ...seven } = page0.dimensions;
    expect(scoreboardSchema.safeParse(withPage({ dimensions: seven })).success).toBe(false);
  });
  it('rejects an unknown dimension, including an email key', () => {
    expect(scoreboardSchema.safeParse(withDims({ vibes: page0.dimensions.cta })).success).toBe(false);
    expect(scoreboardSchema.safeParse(withDims({ subject_preheader: page0.dimensions.cta })).success).toBe(false);
  });
  it('rejects a non-integer or out-of-range score and an unknown source', () => {
    expect(scoreboardSchema.safeParse(withDims({ cta: { score: 3.5, note: 'n', source: 'judgment' } })).success).toBe(false);
    expect(scoreboardSchema.safeParse(withDims({ cta: { score: 0, note: 'n', source: 'judgment' } })).success).toBe(false);
    expect(scoreboardSchema.safeParse(withDims({ cta: { score: 3, note: 'n', source: 'model' } })).success).toBe(false);
  });
  it('rejects an empty note', () => {
    expect(scoreboardSchema.safeParse(withDims({ cta: { score: 3, note: '', source: 'judgment' } })).success).toBe(false);
  });
});

describe('unknown keys', () => {
  it('fail on a page, a dimension, a check, the night and a not-captured brand', () => {
    expect(scoreboardSchema.safeParse(withPage({ subject: 'Email-era field' })).success).toBe(false);
    expect(scoreboardSchema.safeParse(withPage({ kind: 'campaign' })).success).toBe(false);
    expect(scoreboardSchema.safeParse(withDims({ cta: { score: 3, note: 'n', source: 'judgment', ceiling: 3 } })).success).toBe(false);
    expect(scoreboardSchema.safeParse(withPage({ checks: [{ name: 'Typos', result: 'pass', check_id: 'x' }] })).success).toBe(false);
    expect(scoreboardSchema.safeParse({ ...good, emails: [] }).success).toBe(false);
    expect(scoreboardSchema.safeParse({ ...good, not_captured: [{ ...missed('brand-q'), code: 'bot_wall' }] }).success).toBe(false);
  });
});

describe('page fields', () => {
  it('accepts a null hero_headline (headline baked into an image)', () => {
    expect(ok(withPage({ hero_headline: null }))).toEqual([]);
  });
  it('requires hero_headline to be stated, and non-empty when it is a string', () => {
    const { hero_headline: _, ...rest } = page0;
    expect(scoreboardSchema.safeParse({ ...good, pages: [rest] }).success).toBe(false);
    expect(scoreboardSchema.safeParse(withPage({ hero_headline: '' })).success).toBe(false);
  });
  it('accepts an optional subhead and a CTA with or without href, or no CTA', () => {
    expect(ok(withPage({ hero_subhead: 'Free returns' }))).toEqual([]);
    expect(ok(withPage({ primary_cta: { text: 'Shop' } }))).toEqual([]);
    expect(ok(withPage({ primary_cta: null }))).toEqual([]);
    expect(scoreboardSchema.safeParse(withPage({ primary_cta: { href: '/x' } })).success).toBe(false);
  });
  it('rejects an unknown homepage kind, including the email kinds', () => {
    for (const k of ['campaign', 'welcome', 'transactional', 'landing']) {
      expect(scoreboardSchema.safeParse(withPage({ homepage_kind: k })).success, k).toBe(false);
    }
  });
  it('requires an https homepage url', () => {
    expect(scoreboardSchema.safeParse(withPage({ url: 'http://www.brand-a.example/' })).success).toBe(false);
    expect(scoreboardSchema.safeParse(withPage({ url: 'brand-a.example' })).success).toBe(false);
  });
  it('rejects an id that is not <date>-<brand_slug>-home', () => {
    for (const id of ['2026-10-29-brand-a-home', '2026-10-30-brand-b-home', '2026-10-30-brand-a-pdp', 'Brand A']) {
      expect(scoreboardSchema.safeParse(withPage({ id })).success, id).toBe(false);
    }
  });
  it('accepts a correction and rejects a malformed one', () => {
    expect(ok(withPage({ correction: { date: '2026-10-31', note: 'Copy & voice raised from 2 to 3.' } }))).toEqual([]);
    expect(scoreboardSchema.safeParse(withPage({ correction: { date: 'yesterday', note: '' } })).success).toBe(false);
  });
  it('accepts an unverified check and rejects other results', () => {
    expect(ok(withPage({ checks: [{ name: 'Other links', result: 'unverified', detail: 'HTTP 403 twice' }] }))).toEqual([]);
    expect(scoreboardSchema.safeParse(withPage({ checks: [{ name: 'Other links', result: 'warn' }] })).success).toBe(false);
  });
  it.each([
    'http://example.com/a.png',
    'https://example.com/a.png',
    'https://abc.public.blob.vercel-storage.com.evil.example/x.webp',
    'https://u@abc.public.blob.vercel-storage.com/x.webp',
    'https://abc.public.blob.vercel-storage.com:8443/x.webp',
    'https://abc.public.blob.vercel-storage.com/',
    'https://abc123.public.blob.vercel-storage.com/shots/2026-10-30/brand-a-home.webp',
    'http://jvx7f1mxqao2jbqs.public.blob.vercel-storage.com/shots/2026-10-30/brand-a-home.webp',
    'https://x.jvx7f1mxqao2jbqs.public.blob.vercel-storage.com/shots/2026-10-30/brand-a-home.webp',
    'https://jvx7f1mxqao2jbqs.public.blob.vercel-storage.com/',
    'shots/2026-10-30/a.webp',
    '/shots/',
    '',
  ])('rejects the screenshot %j', (screenshot) => {
    expect(scoreboardSchema.safeParse(withPage({ screenshot })).success).toBe(false);
  });
  it.each(['https://jvx7f1mxqao2jbqs.public.blob.vercel-storage.com/shots/2026-10-30/brand-a-home.webp', '/shots/fixtures/placeholder-1.png', null])(
    'accepts the screenshot %j',
    (screenshot) => {
      expect(ok(withPage({ screenshot }))).toEqual([]);
    },
  );
});

describe('night fields', () => {
  it('requires at least one page', () => {
    expect(scoreboardSchema.safeParse({ ...good, pages: [] }).success).toBe(false);
  });
  it('requires rubric_version as a string', () => {
    expect(scoreboardSchema.safeParse({ ...good, rubric_version: 1.0 }).success).toBe(false);
  });
  it('defaults not_captured to []', () => {
    const { not_captured: _, ...rest } = good;
    expect((scoreboardSchema.parse(rest) as ScoreboardNight).not_captured).toEqual([]);
  });
  it('rejects duplicate ids within a night', () => {
    expect(scoreboardSchema.safeParse({ ...good, pages: [page0, page0] }).success).toBe(false);
  });
});

describe('not captured', () => {
  it('accepts a brand with a public reason', () => {
    expect(ok({ ...good, not_captured: [missed('brand-q')] })).toEqual([]);
  });
  it('rejects a brand that is in both pages and not_captured on the same night', () => {
    const r = scoreboardSchema.safeParse({ ...good, not_captured: [missed('brand-a')] });
    expect(issuePaths(r)).toEqual(['not_captured.0.brand_slug']);
  });
  it('rejects the same brand twice', () => {
    expect(scoreboardSchema.safeParse({ ...good, not_captured: [missed('brand-q'), missed('brand-q')] }).success).toBe(false);
  });
  it.each(['bot_wall', 'HTTP_403', 'timeout', 'Blocked.', 'the site blocked our capture browser.', 'The site blocked our capture browser'])(
    'rejects the internal-looking reason %j',
    (reason) => {
      expect(isPublicReason(reason)).toBe(false);
      expect(scoreboardSchema.safeParse({ ...good, not_captured: [missed('brand-q', reason)] }).success).toBe(false);
    },
  );
});

describe('hard-fail evidence gate', () => {
  it('rejects a 1 on trust or hygiene with no failed check behind it', () => {
    for (const k of ['trust', 'hygiene']) {
      const r = scoreboardSchema.safeParse(
        withPage({ dimensions: { ...page0.dimensions, [k]: { score: 1, note: 'n', source: 'check' } }, checks: [{ name: 'Page load', result: 'pass' }] }),
      );
      expect(issuePaths(r), k).toEqual([`pages.0.dimensions.${k}.score`]);
    }
  });
  it('rejects a failed check with no detail, or an unverified one', () => {
    const dimensions = { ...page0.dimensions, hygiene: { score: 1, note: 'n', source: 'check' } };
    expect(scoreboardSchema.safeParse(withPage({ dimensions, checks: [{ name: 'Main button link', result: 'fail' }] })).success).toBe(false);
    expect(scoreboardSchema.safeParse(withPage({ dimensions, checks: [{ name: 'Main button link', result: 'unverified', detail: 'HTTP 403' }] })).success).toBe(false);
  });
  it('accepts a cap backed by a failed check with evidence', () => {
    const dimensions = { ...page0.dimensions, hygiene: { score: 1, note: 'n', source: 'check' } };
    expect(ok(withPage({ dimensions, checks: [{ name: 'Main button link', result: 'fail', detail: '/sale returns HTTP 404 twice' }] }))).toEqual([]);
  });
  it('does not apply to a 1 on any other dimension', () => {
    expect(ok(withDims({ headline: { score: 1, note: 'n', source: 'judgment' } }))).toEqual([]);
  });
});
