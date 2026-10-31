// The placeholder screenshots the fixture boards point at: grey phone-shaped
// blocks that say PLACEHOLDER, at the two capture sizes (375x667 at 2x and
// 3x). Real screenshots never go into git. Regenerate with:
//   node scripts/fixture-shots.ts
// Node runs this TypeScript directly (type stripping, Node 22.18+).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const requireCjs = createRequire(import.meta.url);
const satori = requireCjs('satori').default;
const { Resvg } = requireCjs('@resvg/resvg-js');
const font = (spec: string) => readFileSync(requireCjs.resolve(spec));

const OUT = new URL('../public/shots/fixtures/', import.meta.url).pathname;
const SHOTS = [
  { file: 'placeholder-1.png', width: 750, height: 1334, ground: '#D9DCE2' },
  { file: 'placeholder-2.png', width: 1125, height: 2001, ground: '#C9CDD6' },
  { file: 'placeholder-3.png', width: 750, height: 1334, ground: '#E3E5EA' },
];

const fonts = [
  { name: 'Barlow Condensed', data: font('@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff'), weight: 800, style: 'normal' },
  { name: 'IBM Plex Mono', data: font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff'), weight: 500, style: 'normal' },
];

mkdirSync(OUT, { recursive: true });
for (const s of SHOTS) {
  const unit = s.width / 375;
  const tree = {
    type: 'div',
    props: {
      style: { width: s.width, height: s.height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: s.ground, color: '#33384A' },
      children: [
        { type: 'div', props: { style: { fontFamily: 'Barlow Condensed', fontWeight: 800, fontSize: 64 * unit, letterSpacing: 1 * unit }, children: 'PLACEHOLDER' } },
        { type: 'div', props: { style: { fontFamily: 'IBM Plex Mono', fontSize: 14 * unit, marginTop: 8 * unit }, children: `Fixture screenshot, ${s.width} x ${s.height}` } },
      ],
    },
  };
  const svg = await satori(tree, { width: s.width, height: s.height, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: s.width } }).render().asPng();
  writeFileSync(join(OUT, s.file), png);
  console.log(`${s.file} ${s.width}x${s.height} ${png.length} bytes`);
}
