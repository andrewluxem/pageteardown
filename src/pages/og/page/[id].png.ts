import type { GetStaticPaths } from 'astro';
import { BANDS, TOTAL_MAX } from '../../../config/rubric';
import type { FlatPage } from '../../../lib/boards';
import { getAllPages } from '../../../lib/content';
import { formatLong } from '../../../lib/dates';
import { pngResponse, renderOgPng } from '../../../lib/og';
import { score } from '../../../lib/scoring';

export const getStaticPaths = (async () => {
  return (await getAllPages()).map((page) => ({ params: { id: page.id }, props: { page } }));
}) satisfies GetStaticPaths;

export async function GET({ props }: { props: { page: FlatPage } }) {
  const s = score(props.page);
  return pngResponse(
    await renderOgPng({
      eyebrow: `Homepage scorecard · ${formatLong(props.page.night)}`,
      headline: [{ text: props.page.brand }],
      stat: `${s.total}/${TOTAL_MAX} · ${BANDS[s.band].label}`,
    }),
  );
}
