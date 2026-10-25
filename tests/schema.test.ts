import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIMENSION_KEYS } from '../src/config/rubric';
import { scoreboardSchema } from '../src/lib/schemas';
import { frontmatter } from './helpers';

// A valid board in the email contract the schemas still describe; the tests
// below patch one field at a time. src/content/ holds no boards yet.
const good = {
  date: '2026-10-06',
  generated_at: '2026-10-06T13:00:00Z',
  rubric_version: '1.0',
  emails: [
    {
      id: '2026-10-05-fixture-brand-1',
      brand: 'Fixture Brand',
      brand_slug: 'fixture-brand',
      industry: 'other',
      kind: 'campaign',
      sent_at: '2026-10-05T18:00:00Z',
      subject: 'Subject',
      dimensions: Object.fromEntries(DIMENSION_KEYS.map((k) => [k, { score: 3, note: 'n', source: 'judgment' }])),
      checks: [],
    } as Record<string, unknown>,
  ],
};
const withEmail = (patch: Record<string, unknown>) => ({ ...good, emails: [{ ...good.emails[0], ...patch }] });

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }): string[] {
  return (result.error?.issues ?? []).map((i) => i.path.join('.'));
}

describe('the base fixture', () => {
  it('passes', () => {
    expect(scoreboardSchema.safeParse(good).error?.issues ?? []).toEqual([]);
  });
});

describe('content schemas reject a malformed scoreboard', () => {
  const bad = frontmatter(join(import.meta.dirname, 'fixtures/malformed-scoreboard.md'));
  const result = scoreboardSchema.safeParse(bad);
  const paths = issuePaths(result);

  it('fails validation', () => {
    expect(result.success).toBe(false);
  });
  it('flags the missing eighth dimension', () => {
    expect(paths).toContain('emails.0.dimensions.technical_hygiene');
  });
  it('flags a score of 6', () => {
    expect(paths).toContain('emails.0.dimensions.cta.score');
  });
  it('flags an unknown industry', () => {
    expect(paths).toContain('emails.0.industry');
  });
});

describe('content schemas reject other contract violations', () => {
  it('rejects a non-integer score', () => {
    const e = good.emails[0] as { dimensions: Record<string, Record<string, unknown>> };
    const r = scoreboardSchema.safeParse(withEmail({ dimensions: { ...e.dimensions, cta: { ...e.dimensions.cta, score: 3.5 } } }));
    expect(r.success).toBe(false);
  });
  it('rejects an unknown dimension key', () => {
    const e = good.emails[0] as { dimensions: Record<string, unknown> };
    const r = scoreboardSchema.safeParse(withEmail({ dimensions: { ...e.dimensions, vibes: e.dimensions.cta } }));
    expect(r.success).toBe(false);
  });
  it('rejects a non URL-safe id', () => {
    expect(scoreboardSchema.safeParse(withEmail({ id: 'Has Spaces' })).success).toBe(false);
  });
  it('rejects an unknown kind', () => {
    expect(scoreboardSchema.safeParse(withEmail({ kind: 'newsletter' })).success).toBe(false);
  });
  it('accepts a correction note and rejects a malformed one', () => {
    expect(scoreboardSchema.safeParse(withEmail({ correction: { date: '2026-10-08', note: 'CTA link was fixed before send.' } })).success).toBe(true);
    expect(scoreboardSchema.safeParse(withEmail({ correction: { date: 'yesterday', note: '' } })).success).toBe(false);
  });
  it('rejects duplicate ids within a file', () => {
    expect(scoreboardSchema.safeParse({ ...good, emails: [good.emails[0], good.emails[0]] }).success).toBe(false);
  });
  it('rejects a check result outside pass, fail, unverified', () => {
    expect(scoreboardSchema.safeParse(withEmail({ checks: [{ name: 'Links resolve', result: 'warn' }] })).success).toBe(false);
  });
  it.each([
    'http://example.com/a.png',
    'https://example.com/a.png',
    'https://shots.example.com/x.png',
    'http://abc.public.blob.vercel-storage.com/x.webp',
    'https://public.blob.vercel-storage.com/x.webp',
    'https://abc.public.blob.vercel-storage.com.evil.example/x.webp',
    'https://u@abc.public.blob.vercel-storage.com/x.webp',
    'https://abc.public.blob.vercel-storage.com:8443/x.webp',
    'https://abc.public.blob.vercel-storage.com/',
    'https://abc.blob.vercel-storage.com/x.webp',
    'shots/2026-10-05/a.webp',
    '/shots/',
    '',
  ])('rejects the screenshot %j', (screenshot) => {
    expect(scoreboardSchema.safeParse(withEmail({ screenshot })).success).toBe(false);
  });
});

describe('rubric v1 contract additions', () => {
  it('accepts an unverified check', () => {
    const r = scoreboardSchema.safeParse(
      withEmail({ checks: [{ name: 'Secondary links resolve', result: 'unverified', detail: 'HTTP 403 twice' }] }),
    );
    expect(r.error?.issues ?? []).toEqual([]);
  });
  it.each([
    'https://shots.public.blob.vercel-storage.com/2026-10-06-gap-1.png',
    'https://abc123.public.blob.vercel-storage.com/shots/2026-10-14/2026-10-14-fixture-brand-1.webp',
    '/shots/2026-10-05/cinder-kitchen-1.png',
    null,
  ])('accepts the screenshot %j', (screenshot) => {
    const r = scoreboardSchema.safeParse(withEmail({ screenshot }));
    expect(r.error?.issues ?? []).toEqual([]);
  });
  it('rejects a cap with no failed check behind it', () => {
    const e = good.emails[0] as { dimensions: Record<string, Record<string, unknown>> };
    const r = scoreboardSchema.safeParse(
      withEmail({
        dimensions: { ...e.dimensions, trust: { ...e.dimensions.trust, score: 1 } },
        checks: [{ name: 'Unsubscribe present', result: 'pass' }],
      }),
    );
    expect(r.success).toBe(false);
  });
  it('accepts a cap backed by a failed check with evidence', () => {
    const e = good.emails[0] as { dimensions: Record<string, Record<string, unknown>> };
    const r = scoreboardSchema.safeParse(
      withEmail({
        dimensions: { ...e.dimensions, technical_hygiene: { ...e.dimensions.technical_hygiene, score: 1 } },
        checks: [{ name: 'Primary CTA resolves', result: 'fail', detail: 'HTTP 404 twice, browser UA' }],
      }),
    );
    expect(r.error?.issues ?? []).toEqual([]);
  });
});
