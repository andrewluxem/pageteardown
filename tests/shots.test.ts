import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { imageSize, thumbnailShot } from '../src/lib/shots';
import { ROOT } from './helpers';

const hex = (h: string) => Uint8Array.from(h.match(/../g)!.map((x) => parseInt(x, 16)));

describe('imageSize', () => {
  it('lossy WebP (VP8)', () => {
    expect(imageSize(hex('52494646fa2f05005745425056503820ee2f0500b08b0b9d012a770170173e6d'))).toEqual({ width: 375, height: 6000 });
  });
  it('extended WebP (VP8X)', () => {
    expect(imageSize(hex('52494646ca06000057454250565038580a00000010000000760100280900414c'))).toEqual({ width: 375, height: 2345 });
  });
  it('PNG', () => {
    expect(imageSize(hex('89504e470d0a1a0a0000000d49484452000001770000029b'))).toEqual({ width: 375, height: 667 });
  });
  it('anything else is null', () => {
    expect(imageSize(hex('ffd8ffe000104a46494600010100000100010000ffdb004300'))).toBeNull();
    expect(imageSize(new Uint8Array())).toBeNull();
  });
  it('reads the placeholder screenshots at both capture sizes', () => {
    const size = (f: string) => imageSize(new Uint8Array(readFileSync(join(ROOT, 'public/shots/fixtures', f))));
    expect(size('placeholder-1.png')).toEqual({ width: 750, height: 1334 });
    expect(size('placeholder-2.png')).toEqual({ width: 1125, height: 2001 });
    expect(size('placeholder-3.png')).toEqual({ width: 750, height: 1334 });
  });
});

describe('thumbnailShot', () => {
  it('uses the screen after the popup was closed when the page has one', () => {
    expect(thumbnailShot({ screenshot: '/shots/a.webp', screenshot_after_popup: '/shots/a-b.webp' })).toBe('/shots/a-b.webp');
  });
  it('else the first screen, or null', () => {
    expect(thumbnailShot({ screenshot: '/shots/a.webp' })).toBe('/shots/a.webp');
    expect(thumbnailShot({ screenshot: null })).toBeNull();
  });
});
