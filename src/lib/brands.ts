// Brand pages are derived, never authored: every board night is read and
// grouped by brand_slug. A brand is published from its first scored night;
// its page shows the 30 nights ending on the newest board.
import type { VerticalKey } from '../config/verticals';
import { addDays, dateRange } from './dates';
import { flatten, type FlatPage } from './boards';
import type { ScoreboardNight } from './schemas';
import { score, type Scored } from './scoring';

export const WINDOW_NIGHTS = 30;

export type Night =
  | { date: string; state: 'scored'; scored: Scored<FlatPage> }
  | { date: string; state: 'not_captured'; reason: string }
  /** A board was published that night without this brand on it. */
  | { date: string; state: 'absent' }
  /** No board was published that night. */
  | { date: string; state: 'no_board' };

export interface BrandSummary {
  slug: string;
  name: string;
  vertical: VerticalKey;
  firstNight: string;
  windowStart: string;
  windowEnd: string;
  /** Nights in the window with a published score. */
  nightsScored: number;
  /** Every night from the later of the first night and the window start, to the window end, oldest first. */
  nights: Night[];
  latest: Scored<FlatPage>;
}

export function windowEnd(nights: Pick<ScoreboardNight, 'date'>[]): string {
  const latest = nights.map((n) => n.date).sort().at(-1);
  if (!latest) throw new Error('No board nights');
  return latest;
}

export function windowStart(end: string, windowNights = WINDOW_NIGHTS): string {
  return addDays(end, -(windowNights - 1));
}

export function brandSlugs(nights: ScoreboardNight[]): string[] {
  return [...new Set(flatten(nights).map((p) => p.brand_slug))].sort();
}

export function summarizeBrand(nights: ScoreboardNight[], slug: string, windowNights = WINDOW_NIGHTS): BrandSummary | undefined {
  const mine = flatten(nights).filter((p) => p.brand_slug === slug);
  if (!mine.length) return undefined;
  const byNight = new Map(nights.map((n) => [n.date, n]));
  const end = windowEnd(nights);
  const start = windowStart(end, windowNights);
  const firstNight = mine.map((p) => p.night).sort()[0]!;
  const latest = score(mine.reduce((a, b) => (b.night > a.night ? b : a)));

  const strip: Night[] = dateRange(firstNight > start ? firstNight : start, end).map((date) => {
    const board = byNight.get(date);
    if (!board) return { date, state: 'no_board' };
    const page = mine.find((p) => p.night === date);
    if (page) return { date, state: 'scored', scored: score(page) };
    const missed = board.not_captured.find((n) => n.brand_slug === slug);
    return missed ? { date, state: 'not_captured', reason: missed.reason } : { date, state: 'absent' };
  });

  return {
    slug,
    name: latest.page.brand,
    vertical: latest.page.vertical,
    firstNight,
    windowStart: start,
    windowEnd: end,
    nightsScored: strip.filter((n) => n.state === 'scored').length,
    nights: strip,
    latest,
  };
}

/** Every brand with at least one scored night, by slug. */
export function brandPages(nights: ScoreboardNight[]): BrandSummary[] {
  return brandSlugs(nights)
    .map((slug) => summarizeBrand(nights, slug))
    .filter((b): b is BrandSummary => b !== undefined);
}
