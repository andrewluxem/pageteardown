import { describe, expect, it } from 'vitest';
import { brandPages, summarizeBrand, windowEnd } from '../src/lib/brands';
import { scoreboardSchema } from '../src/lib/schemas';
import { dims, fixture, fixtureFiles, makePage, night } from './helpers';

const a = (score: number) => makePage({ brand: 'Brand A', brand_slug: 'brand-a', vertical: 'apparel', dimensions: dims(score) });
const b = makePage({ brand: 'Brand B', brand_slug: 'brand-b', dimensions: dims(3) });
const missedA = { brand: 'Brand A', brand_slug: 'brand-a', vertical: 'apparel' as const, reason: 'The site blocked our capture browser.' };

describe('brand summaries', () => {
  const nights = [
    night('2026-10-26', [a(3), b]),
    night('2026-10-27', [b], [missedA]),
    night('2026-10-28', [b]),
    // 2026-10-29: no board published
    night('2026-10-30', [a(4), b]),
  ];
  const s = summarizeBrand(nights, 'brand-a')!;

  it('ends the window on the newest board', () => {
    expect(windowEnd(nights)).toBe('2026-10-30');
    expect(s.windowEnd).toBe('2026-10-30');
  });
  it('counts scored nights in the window', () => {
    expect(s.nightsScored).toBe(2);
  });
  it('shows every night from the first one, with gaps and their reasons', () => {
    expect(s.nights.map((n) => [n.date, n.state])).toEqual([
      ['2026-10-26', 'scored'],
      ['2026-10-27', 'not_captured'],
      ['2026-10-28', 'absent'],
      ['2026-10-29', 'no_board'],
      ['2026-10-30', 'scored'],
    ]);
    const gap = s.nights[1]!;
    expect(gap.state === 'not_captured' && gap.reason).toBe('The site blocked our capture browser.');
  });
  it('summarizes the latest scored night', () => {
    expect(s.latest.page.night).toBe('2026-10-30');
    expect(s.latest.total).toBe(32);
    expect(s.firstNight).toBe('2026-10-26');
  });
  it('limits the strip to 30 nights', () => {
    const long = Array.from({ length: 40 }, (_, i) => night(new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10), [a(3)]));
    const l = summarizeBrand(long, 'brand-a')!;
    expect(l.nights).toHaveLength(30);
    expect(l.nightsScored).toBe(30);
    expect(l.firstNight).toBe('2026-09-01');
  });
  it('publishes only brands with a scored night', () => {
    expect(brandPages(nights).map((p) => p.slug)).toEqual(['brand-a', 'brand-b']);
    expect(summarizeBrand(nights, 'brand-q')).toBeUndefined();
  });
});

describe('the fixture boards cover the cases the board shows', () => {
  const nights = fixtureFiles().map((f) => scoreboardSchema.parse(fixture(f)));
  const latest = nights.at(-1)!;
  const pages = nights.flatMap((n) => n.pages);

  it('16 placeholder brands A to P on the latest night and 4 not captured, Q to T', () => {
    expect(latest.pages.map((p) => p.brand)).toEqual('ABCDEFGHIJKLMNOP'.split('').map((c) => `Brand ${c} (placeholder)`));
    expect(latest.not_captured.map((n) => n.brand_slug)).toEqual(['brand-q', 'brand-r', 'brand-s', 'brand-t']);
  });
  it('every vertical and every kind', () => {
    expect(new Set(latest.pages.map((p) => p.vertical)).size).toBe(8);
    expect(new Set(latest.pages.map((p) => p.homepage_kind)).size).toBe(4);
  });
  it('a cap on hygiene from a 404 main link, and a cap on trust from a contradicted headline', () => {
    const j = latest.pages.find((p) => p.brand_slug === 'brand-j')!;
    expect(j.dimensions.hygiene.score).toBe(1);
    expect(j.checks.find((c) => c.name === 'Main button link')?.detail).toMatch(/404/);
    const d = latest.pages.find((p) => p.brand_slug === 'brand-d')!;
    expect(d.dimensions.trust.score).toBe(1);
    expect(d.checks.find((c) => c.name === 'Headline matches landing page')?.result).toBe('fail');
  });
  it('a popup over the hero, an image-only headline, a correction and unverified checks', () => {
    expect(latest.pages.find((p) => p.brand_slug === 'brand-e')!.checks.find((c) => c.name === 'Key copy unobstructed')?.result).toBe('fail');
    expect(latest.pages.find((p) => p.brand_slug === 'brand-k')!.hero_headline).toBeNull();
    expect(pages.filter((p) => p.correction)).toHaveLength(1);
    expect(latest.pages.flatMap((p) => p.checks).filter((c) => c.result === 'unverified').length).toBeGreaterThan(0);
  });
  it('a brand missing one night', () => {
    expect(summarizeBrand(nights, 'brand-o')!.nights.map((n) => n.state)).toEqual(['scored', 'not_captured', 'scored']);
    expect(summarizeBrand(nights, 'brand-p')!.firstNight).toBe('2026-10-29');
  });
});
