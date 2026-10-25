# Page Teardown brand assets

Sister property to Inbox Teardown. Same system: bold condensed uppercase wordmark, orange slash as the divider.

## Typeface
Barlow Condensed ExtraBold (800), Google Fonts, OFL licensed.
All SVGs here are outlined (text converted to paths), so no font dependency when embedding.
For live text on the site: `font-family: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif; font-weight: 800; letter-spacing: -0.01em; text-transform: uppercase;`

## Colors
| Token  | Hex     | Use                      |
|--------|---------|--------------------------|
| ink    | #F2F2F0 | wordmark on dark ground  |
| ground | #121316 | dark background          |
| accent | #D8622E | the slash, never the words |
| ink-lt | #121316 | wordmark on light ground |

## Files
- `page-teardown-wordmark-dark.svg/.png` (880x360) - primary
- `page-teardown-wordmark-light.svg/.png` - for white backgrounds
- `page-teardown-wordmark-white-transparent.svg/.png` - header overlay on dark
- `page-teardown-wordmark-black-transparent.svg/.png` - header overlay on light
- `page-teardown-mark-dark.svg/.png`, `page-teardown-mark-light.svg/.png` (320x320) - square P/T mark for avatars
- `favicon-16/32/180/512.png` - from the dark mark; 180 is apple-touch-icon, 512 is the PWA/manifest icon

## Rules
- Slash is always accent orange; words are never orange.
- Minimum clear space: height of the P on all sides.
- Do not stretch, outline, or add effects. Dark version is the default.

Editable source: Claude Design canvas, https://claude.ai/artifact/R4pYYx26Fpp9EzHfCVw35A

## On the site
- Header: `wordmark-on-dark.svg`; footer: `wordmark-on-light.svg`. These are the white- and black-transparent wordmarks with the viewBox cropped to the letters plus a 10-unit margin, so they size correctly at header height. Paths are unchanged.
- `public/favicon.svg` is the dark mark; `favicon.ico` is built from favicon-16/32; `apple-touch-icon.png` is favicon-180.
- `og-default.svg` is the master for `public/og-default.png` (rendered with `src/lib/og.ts`).
- Barlow Condensed is self-hosted through @fontsource; license in `BarlowCondensed-OFL.txt`.
