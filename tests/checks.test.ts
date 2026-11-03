import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { BOARD_DIR } from '../src/config/board';
import { CHECK_PUBLIC_NAMES, PUBLIC_CHECK_NAMES, isPublicCheckName } from '../src/lib/checks';
import { ROOT, fixture, fixtureFiles } from './helpers';

/** Every check name in real boards and fixture boards. */
function boardCheckNames(): string[] {
  const real = readdirSync(join(ROOT, BOARD_DIR))
    .filter((f) => f.endsWith('.md'))
    .map((f) => parse(readFileSync(join(ROOT, BOARD_DIR, f), 'utf8').split(/^---$/m)[1] ?? ''));
  const all = [...real, ...fixtureFiles().map(fixture)] as { pages?: { checks?: { name: string }[] }[] }[];
  return [...new Set(all.flatMap((b) => (b.pages ?? []).flatMap((p) => (p.checks ?? []).map((c) => c.name))))];
}

describe('check names', () => {
  it('boards and fixtures use only public check names', () => {
    const names = boardCheckNames();
    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((n) => !isPublicCheckName(n))).toEqual([]);
  });
  it('rejects scorer check_ids and failure-style labels', () => {
    expect(isPublicCheckName('Main button link')).toBe(true);
    expect(isPublicCheckName('hp_cta_present')).toBe(false);
    expect(isPublicCheckName('Main button link is broken')).toBe(false);
  });
  it('names the codebook 1.0-draft.11 value, copy, relevance and help path checks (D-046)', () => {
    expect(CHECK_PUBLIC_NAMES).toMatchObject({
      hp_value_concrete_benefit: 'Concrete benefit',
      hp_value_brand_specific: 'Store-specific benefit',
      hp_value_offer_terms: 'Offer terms',
      hp_copy_own_words: 'Original wording',
      hp_copy_no_typos: 'Typos',
      hp_rel_no_account_assumed: 'Guest access',
      hp_rel_locale_match: 'Currency and region',
      hp_trust_help_path: 'Contact or help link',
    });
    // A terms link alone is not a help path, so the old name is gone.
    expect(isPublicCheckName('Contact, help or terms link')).toBe(false);
  });
  it('maps only homepage check_ids', () => {
    expect(Object.keys(CHECK_PUBLIC_NAMES).filter((id) => !/^hp_[a-z]+_[a-z0-9_]+$/.test(id))).toEqual([]);
  });
  // A name sits next to PASS and NOT VERIFIED too, so it may not describe a failure.
  it('has no public name that reads as a failure', () => {
    const failure = /\b(fails?|failed|broken|no|not|lacks?|missing|without|over|smaller|below|wider|unfilled|compete|blocks?)\b/i;
    expect(PUBLIC_CHECK_NAMES.filter((n) => failure.test(n))).toEqual([]);
  });
});
