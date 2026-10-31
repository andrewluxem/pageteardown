import { describe, expect, it } from 'vitest';
import { boardFileProblems, flatten, validateBoards } from '../src/lib/boards';
import { dims, makePage, night } from './helpers';

describe('cross-file rules', () => {
  const a = makePage({ brand_slug: 'brand-a', dimensions: dims(3) });
  const n28 = night('2026-10-28', [a]);
  const n29 = night('2026-10-29', [a]);

  it('passes distinct nights whose filenames equal their dates', () => {
    expect(boardFileProblems([{ id: '2026-10-28', data: n28 }, { id: '2026-10-29', data: n29 }])).toEqual([]);
  });
  it('fails a filename that differs from the date', () => {
    expect(boardFileProblems([{ id: '2026-10-27', data: n28 }])).toEqual([
      'Scoreboard file "2026-10-27.md" has date 2026-10-28; the filename must match the date.',
    ]);
  });
  it('fails a page id that appears in two files', () => {
    const dup = { ...n29, pages: n28.pages };
    expect(boardFileProblems([{ id: '2026-10-28', data: n28 }, { id: '2026-10-29', data: dup }])).toContainEqual(
      'Page id "2026-10-28-brand-a-home" appears in both 2026-10-28.md and 2026-10-29.md; ids must be unique across all files.',
    );
  });
  it('validateBoards throws on any problem and sorts nights oldest first', () => {
    expect(() => validateBoards([{ id: 'x', data: n28 }])).toThrow(/filename must match/);
    expect(validateBoards([{ id: '2026-10-29', data: n29 }, { id: '2026-10-28', data: n28 }]).map((n) => n.date)).toEqual(['2026-10-28', '2026-10-29']);
  });
  it('flatten carries the night and rubric version onto each page', () => {
    const [p] = flatten([n28]);
    expect(p!.night).toBe('2026-10-28');
    expect(p!.rubricVersion).toBe('1.0-draft');
  });
});
