// Vertical keys are part of the content contract. Keys are what the exporter
// writes; labels are what the site shows. The labels are the `vertical` values
// of the brand registry (email-scoreboard data/brands.json), in its order, so
// the exporter maps a registry vertical to its key with VERTICAL_KEY_FOR_LABEL.
export const VERTICALS = {
  apparel: 'Apparel & footwear',
  beauty: 'Beauty & personal care',
  home: 'Home & furnishings',
  outdoor: 'Outdoor & sporting goods',
  dept: 'Department & mass',
  jewelry: 'Jewelry',
  food: 'Food & meal kits',
  other: 'Other',
} as const;

export type VerticalKey = keyof typeof VERTICALS;

export const VERTICAL_KEYS = Object.keys(VERTICALS) as [VerticalKey, ...VerticalKey[]];

export function verticalLabel(key: VerticalKey): string {
  return VERTICALS[key];
}

/** Registry vertical label to content key. */
export const VERTICAL_KEY_FOR_LABEL: Record<string, VerticalKey> = Object.fromEntries(
  VERTICAL_KEYS.map((k) => [VERTICALS[k], k]),
);
