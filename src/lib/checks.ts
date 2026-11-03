// The check names a board may carry: neutral public names, shown as is next
// to PASS / FAIL / NOT VERIFIED. Each names what was checked, never a failure,
// so it reads right next to any result; what went wrong is in the check's
// detail and the dimension's note. The exporter writes the name, never the
// scorer's check_id. tests/checks.test.ts holds boards and fixtures to this list.

/**
 * Public names for page-scoreboard check_ids (codebook/v1-draft.yaml,
 * codebook_version 1.0-draft.11, page_type home). Ids missing here have no
 * public name yet; docs/CONTENT-CONTRACT.md lists them and why. The exporter
 * drops their results until they get one.
 */
export const CHECK_PUBLIC_NAMES: Readonly<Record<string, string>> = {
  hp_val_clear_category: 'Product category in view',
  hp_val_h1_present: 'Page heading',
  hp_msg_hero_headline: 'Live hero text',
  hp_msg_commercial_intent: 'Hero offer',
  hp_hier_h1_in_fold: 'Heading in first screen',
  hp_hier_small_text_share: 'Text size',
  hp_hier_focal_point: 'Single focal point',
  hp_cta_present: 'Main button in first screen',
  hp_cta_action_verb: 'Main button label',
  hp_find_search_present: 'Search in first screen',
  hp_find_nav_present: 'Menu button',
  hp_find_search_open_input: 'Open search box',
  hp_trust_https_valid: 'HTTPS certificate',
  hp_trust_no_failed_images: 'Image loading',
  hp_trust_logo_visible: 'Logo in header',
  hp_intr_no_full_overlay: 'Overlay size',
  hp_intr_unobstructed_fold: 'First screen unobstructed',
  hp_perf_http_ok: 'Page load',
  hp_value_concrete_benefit: 'Concrete benefit',
  hp_value_brand_specific: 'Store-specific benefit',
  hp_value_offer_terms: 'Offer terms',
  hp_copy_own_words: 'Original wording',
  hp_copy_no_typos: 'Typos',
  hp_rel_no_account_assumed: 'Guest access',
  hp_rel_locale_match: 'Currency and region',
  // A terms link alone is not a help path (page-scoreboard D-041).
  hp_trust_help_path: 'Contact or help link',
};

/**
 * Public names for the rows of rubric v1's deterministic checks table that
 * have no check_id in page-scoreboard yet. When the scorer gives them ids,
 * they move into CHECK_PUBLIC_NAMES under those ids.
 */
export const RUBRIC_CHECK_NAMES = [
  'Page load',
  'Main button link',
  'Headline matches landing page',
  'Other links',
  'Live hero text',
  'Image alt text',
  'Phone width',
  'Key copy unobstructed',
  'Link domains',
] as const;

export const PUBLIC_CHECK_NAMES: readonly string[] = [
  ...new Set([...Object.values(CHECK_PUBLIC_NAMES), ...RUBRIC_CHECK_NAMES]),
];

const PUBLIC = new Set<string>(PUBLIC_CHECK_NAMES);

export function isPublicCheckName(name: string): boolean {
  return PUBLIC.has(name);
}
