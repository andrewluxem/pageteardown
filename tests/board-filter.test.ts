import { describe, expect, it } from 'vitest';
import { ALL, boardHref, boardStats, missedMatches, rowMatches } from '../src/lib/board-filter';

describe('board filters', () => {
  it('links All and All to /, every other filter to its built page', () => {
    expect(boardHref({ vertical: ALL, kind: ALL })).toBe('/');
    expect(boardHref({ vertical: 'apparel', kind: ALL })).toBe('/board/apparel/all/');
    expect(boardHref({ vertical: ALL, kind: 'editorial' })).toBe('/board/all/editorial/');
    expect(boardHref({ vertical: 'home', kind: 'product' })).toBe('/board/home/product/');
  });
  it('matches rows on vertical and kind', () => {
    const row = { vertical: 'home', kind: 'product' };
    expect(rowMatches(row, { vertical: ALL, kind: ALL })).toBe(true);
    expect(rowMatches(row, { vertical: 'home', kind: ALL })).toBe(true);
    expect(rowMatches(row, { vertical: 'home', kind: 'storefront' })).toBe(false);
    expect(rowMatches(row, { vertical: 'beauty', kind: 'product' })).toBe(false);
  });
  it('matches not-captured brands on vertical only', () => {
    expect(missedMatches('home', { vertical: ALL, kind: 'product' })).toBe(true);
    expect(missedMatches('home', { vertical: 'beauty', kind: ALL })).toBe(false);
  });
  it('recomputes the four stats from the rows shown', () => {
    expect(boardStats([{ total: 30, capped: false }, { total: 23, capped: true }], 2)).toEqual({ count: 2, avg: '26.5', fails: 1, missed: 2 });
    expect(boardStats([], 0)).toEqual({ count: 0, avg: '0.0', fails: 0, missed: 0 });
  });
});
