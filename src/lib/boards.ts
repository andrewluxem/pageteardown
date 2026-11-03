// Rules across board files that a per-file schema cannot express, and the
// flattened view of every page. Pure, so Vitest can test them; content.ts
// runs them over the collection and a failure fails the build.
import type { Homepage, ScoreboardNight } from './schemas';

export interface BoardFile {
  /** Filename without .md, e.g. "2026-10-30". */
  id: string;
  data: ScoreboardNight;
}

/** Every cross-file problem, one message each naming the files. Empty means valid. */
export function boardFileProblems(files: BoardFile[]): string[] {
  const problems: string[] = [];
  const ids = new Map<string, string>();
  for (const f of files) {
    if (f.id !== f.data.date) {
      problems.push(`Scoreboard file "${f.id}.md" has date ${f.data.date}; the filename must match the date.`);
    }
    for (const p of f.data.pages) {
      const prev = ids.get(p.id);
      if (prev) problems.push(`Page id "${p.id}" appears in both ${prev}.md and ${f.id}.md; ids must be unique across all files.`);
      else ids.set(p.id, f.id);
    }
  }
  return problems;
}

/** Board nights oldest first, or throws listing every cross-file problem. */
export function validateBoards(files: BoardFile[]): ScoreboardNight[] {
  const problems = boardFileProblems(files);
  if (problems.length) throw new Error(problems.join('\n'));
  return files.map((f) => f.data).sort((a, b) => a.date.localeCompare(b.date));
}

export interface FlatPage extends Homepage {
  /** Date of the board file the page appeared on: the night it was captured. */
  night: string;
  rubricVersion: string;
}

export function flatten(nights: ScoreboardNight[]): FlatPage[] {
  return nights.flatMap((n) => n.pages.map((p) => ({ ...p, night: n.date, rubricVersion: n.rubric_version })));
}
