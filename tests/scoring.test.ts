import { describe, expect, it } from 'vitest';
import { band, bandFor, bestAndWorst, cappingDimension, isCapped, lowestDimension, rank, total } from '../src/lib/scoring';
import { dims, makePage } from './helpers';

describe('total', () => {
  it('is the sum of the 8 dimension scores', () => {
    expect(total({ dimensions: dims(3) })).toBe(24);
    expect(total({ dimensions: dims(5) })).toBe(40);
    expect(total({ dimensions: dims(1) })).toBe(8);
    expect(total({ dimensions: dims(4, { headline: 2, hygiene: 1 }) })).toBe(27);
  });
});

describe('isCapped', () => {
  it('caps when trust is 1', () => {
    expect(isCapped({ dimensions: dims(5, { trust: 1 }) })).toBe(true);
  });
  it('caps when hygiene is 1', () => {
    expect(isCapped({ dimensions: dims(5, { hygiene: 1 }) })).toBe(true);
  });
  it('does not cap when trust and hygiene are both 2 or higher', () => {
    expect(isCapped({ dimensions: dims(2) })).toBe(false);
    expect(isCapped({ dimensions: dims(5, { trust: 2, hygiene: 2 }) })).toBe(false);
  });
  it('does not cap for a 1 on any other dimension', () => {
    expect(isCapped({ dimensions: dims(4, { headline: 1, value: 1, hierarchy: 1, copy: 1, cta: 1, relevance: 1 }) })).toBe(false);
  });
  it('names trust before hygiene when both are 1', () => {
    expect(cappingDimension({ dimensions: dims(4, { trust: 1, hygiene: 1 }) })).toBe('trust');
    expect(cappingDimension({ dimensions: dims(4, { hygiene: 1 }) })).toBe('hygiene');
    expect(cappingDimension({ dimensions: dims(4) })).toBeUndefined();
  });
});

describe('band thresholds', () => {
  it('23 is weak, 24 is solid', () => {
    expect(bandFor(23, false)).toBe('weak');
    expect(bandFor(24, false)).toBe('solid');
  });
  it('32 is solid, 33 is strong', () => {
    expect(bandFor(32, false)).toBe('solid');
    expect(bandFor(33, false)).toBe('strong');
  });
  it('capped overrides any total', () => {
    expect(bandFor(39, true)).toBe('capped');
    expect(band({ dimensions: dims(5, { trust: 1 }) })).toBe('capped');
  });
  it('derives band from real dimension totals', () => {
    expect(band({ dimensions: dims(3, { cta: 2 }) })).toBe('weak'); // 23
    expect(band({ dimensions: dims(3) })).toBe('solid'); // 24
    expect(band({ dimensions: dims(4) })).toBe('solid'); // 32
    expect(band({ dimensions: dims(4, { cta: 5 }) })).toBe('strong'); // 33
  });
});

describe('rank', () => {
  it('puts every capped page after every uncapped page', () => {
    const highCapped = makePage({ dimensions: dims(5, { hygiene: 1 }) }); // 36, capped
    const low = makePage({ dimensions: dims(2) }); // 16
    const mid = makePage({ dimensions: dims(3) }); // 24
    const lowCapped = makePage({ dimensions: dims(3, { trust: 1 }) }); // 22, capped
    expect(rank([highCapped, low, lowCapped, mid]).map((s) => s.page.id)).toEqual([mid.id, low.id, highCapped.id, lowCapped.id]);
  });
  it('orders by total descending within each group', () => {
    expect(rank([makePage({ dimensions: dims(4) }), makePage({ dimensions: dims(5) })]).map((s) => s.total)).toEqual([40, 32]);
  });
  it('breaks ties by brand, then id', () => {
    const b = makePage({ brand: 'Brand B', dimensions: dims(3) });
    const a2 = makePage({ brand: 'Brand A', id: '2026-10-30-z-home', dimensions: dims(3) });
    const a1 = makePage({ brand: 'Brand A', id: '2026-10-30-a-home', dimensions: dims(3) });
    expect(rank([b, a2, a1]).map((s) => s.page.id)).toEqual([a1.id, a2.id, b.id]);
  });
});

describe('bestAndWorst', () => {
  it('considers every captured page, whatever its kind', () => {
    const editorial = makePage({ homepage_kind: 'editorial', dimensions: dims(5) });
    const storefront = makePage({ homepage_kind: 'storefront', dimensions: dims(4) });
    const r = bestAndWorst([storefront, editorial]);
    expect(r.best?.page.id).toBe(editorial.id);
    expect(r.worst?.page.id).toBe(storefront.id);
  });
  it('best is the top uncapped page; worst is the first capped page', () => {
    const best = makePage({ dimensions: dims(4) });
    const lowCap = makePage({ dimensions: dims(2, { trust: 1 }) });
    const highCap = makePage({ dimensions: dims(5, { hygiene: 1 }) });
    const r = bestAndWorst([lowCap, best, highCap]);
    expect(r.best?.page.id).toBe(best.id);
    expect(r.worst?.page.id).toBe(highCap.id);
    expect(r.worstIsCap).toBe(true);
  });
  it('falls back to the lowest uncapped page when nothing is capped', () => {
    const hi = makePage({ dimensions: dims(4) });
    const lo = makePage({ dimensions: dims(2) });
    const r = bestAndWorst([lo, hi]);
    expect(r.worst?.page.id).toBe(lo.id);
    expect(r.worstIsCap).toBe(false);
  });
  it('has no worst when there is a single uncapped page and no cap', () => {
    const only = makePage({ dimensions: dims(4) });
    expect(bestAndWorst([only])).toEqual({ best: expect.objectContaining({ page: only }), worst: undefined, worstIsCap: false });
  });
  it('has no best when every page is capped', () => {
    const r = bestAndWorst([makePage({ dimensions: dims(4, { trust: 1 }) })]);
    expect(r.best).toBeUndefined();
    expect(r.worstIsCap).toBe(true);
  });
});

describe('lowestDimension', () => {
  it('returns the lowest-scoring dimension, ties in rubric order', () => {
    expect(lowestDimension({ dimensions: dims(4, { cta: 2 }) })).toBe('cta');
    expect(lowestDimension({ dimensions: dims(3) })).toBe('headline');
    expect(lowestDimension({ dimensions: dims(4, { relevance: 2, hygiene: 2 }) })).toBe('relevance');
  });
});
