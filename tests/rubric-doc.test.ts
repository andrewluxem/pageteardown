import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BANDS, CAPPING_DIMENSIONS, DIMENSIONS, DIMENSION_KEYS, RUBRIC_DOC, RUBRIC_TAG } from '../src/config/rubric';
import { loadRubric, parseRubric, publicText } from '../src/lib/rubric-doc';
import { ROOT } from './helpers';

const md = readFileSync(join(ROOT, RUBRIC_DOC), 'utf8');
const rubric = loadRubric(ROOT);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

describe('the rubric markdown', () => {
  it('has the eight dimensions in the config order, by slug', () => {
    expect(rubric.dimensions.map((d) => d.slug)).toEqual(DIMENSION_KEYS);
  });
  it('gives each a question and 5, 3 and 1 anchors', () => {
    for (const d of rubric.dimensions) {
      expect(d.question, d.slug).toMatch(/\?$/);
      for (const n of [5, 3, 1] as const) expect(d.anchors[n].length, `${d.slug} ${n}`).toBeGreaterThan(5);
    }
  });
  it('states the same bands as the config', () => {
    const bands = rubric.rule('Scoring rules', 'Bands');
    expect(bands).toContain(`Strong ${BANDS.strong.min} to 40`);
    expect(bands).toContain(`Solid ${BANDS.solid.min} to ${BANDS.strong.min - 1}`);
    expect(bands).toContain(`Weak 8 to ${BANDS.solid.min - 1}`);
  });
  it('caps on the same dimensions as the config, through three forced checks', () => {
    const rule = rubric.rule('Scoring rules', 'Hard fail');
    for (const k of CAPPING_DIMENSIONS) expect(rule.toLowerCase()).toContain(DIMENSIONS[k].toLowerCase());
    expect(rubric.checks.filter((c) => c.effect === 'Forces 1').map((c) => c.dimension)).toEqual(['Hygiene', 'Hygiene', 'Trust']);
  });
  it('names the label the board shows (RUBRIC_TAG)', () => {
    expect(md).toContain(`"${RUBRIC_TAG}"`);
  });
  it('commits to the correction times the scorecard states', () => {
    const corrections = rubric.rule('Board and methodology page', 'Corrections');
    expect(corrections).toContain('within 2 business days');
    expect(corrections).toContain('within 7 days');
  });
});

describe('rubric text lives only in the markdown', () => {
  const texts = rubric.dimensions.flatMap((d) => [d.question, d.anchors[5], d.anchors[3], d.anchors[1]]);
  const files = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'scripts'))].filter((f) => /\.(astro|ts|mjs|md|css)$/.test(f));
  it.each(files.map((f) => f.slice(ROOT.length + 1)))('%s quotes no question or anchor', (f) => {
    const src = readFileSync(join(ROOT, f), 'utf8');
    expect(texts.filter((t) => src.includes(t))).toEqual([]);
  });
});

describe('the parser', () => {
  it('fails loudly on a missing section or label', () => {
    expect(() => parseRubric('# Nothing here\n').dimensions).toThrow(/no section "The eight dimensions"/);
    expect(() => rubric.rule('Scoring rules', 'Nope')).toThrow(/no "\*\*Nope" bullet/);
  });
  it('refuses to show text that names the internal judge', () => {
    expect(() => publicText('Jev confirms', 'x')).toThrow(/internal tool/);
    const leaked = md.replace('Distinct voice, concrete claims, no filler', 'Jev likes it');
    expect(() => parseRubric(leaked)).toThrow(/copy anchor 5 names an internal tool/);
  });
});
