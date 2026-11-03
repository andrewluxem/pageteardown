// Reads the rubric markdown (RUBRIC_DOC) at build time for the methodology
// page. Dimension questions and anchors, and the rules the page quotes, live
// only in that file: this module finds them by slug, label or table column and
// returns the text unchanged. Anything it cannot find throws, so a reworded or
// restructured rubric fails the build instead of publishing a stale page.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RUBRIC_DOC } from '../config/rubric';

export interface RubricDimension {
  slug: string;
  question: string;
  anchors: { 5: string; 3: string; 1: string };
}

export interface RubricCheck {
  check: string;
  dimension: string;
  effect: string;
  /** As written; pass through publicText before showing it. */
  notes: string;
}

/** Names the public page must never show (the judge model's internal name). */
const INTERNAL = /\bJev\b/;

function section(md: string, heading: string): string {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => /^#{2,3} /.test(l) && l.replace(/^#+ /, '').startsWith(heading));
  if (start < 0) throw new Error(`${RUBRIC_DOC}: no section "${heading}"`);
  const level = lines[start]!.match(/^#+/)![0].length;
  const end = lines.findIndex((l, i) => i > start && new RegExp(`^#{1,${level}} `).test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
}

function tableRows(text: string): string[][] {
  return text
    .split('\n')
    .filter((l) => l.startsWith('|'))
    .slice(2) // header and separator
    .map((l) => l.slice(1, -1).split('|').map((c) => c.trim()));
}

function bullets(text: string): string[] {
  return text
    .split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim());
}

export function publicText(s: string, where: string): string {
  if (INTERNAL.test(s)) throw new Error(`${RUBRIC_DOC}: ${where} names an internal tool and cannot be shown publicly: ${s}`);
  return s;
}

export interface Rubric {
  dimensions: RubricDimension[];
  /** The text after a bold label in a section's bullets, e.g. rule('Scoring rules', 'Bands'). */
  rule(sectionHeading: string, label: string): string;
  /** A section's bullets, as written. */
  bullets(sectionHeading: string): string[];
  /** Rows of the deterministic checks table. */
  checks: RubricCheck[];
  /** The sentence of a section that contains `phrase`. */
  sentence(sectionHeading: string, phrase: string): string;
}

export function parseRubric(md: string): Rubric {
  const dimensions = tableRows(section(md, 'The eight dimensions')).map((cells) => {
    const slug = cells[0]?.match(/\(`([a-z]+)`\)/)?.[1];
    if (!slug || cells.length < 5) throw new Error(`${RUBRIC_DOC}: unreadable dimension row: ${cells.join(' | ')}`);
    const [, question, a5, a3, a1] = cells as [string, string, string, string, string];
    return {
      slug,
      question: publicText(question, `${slug} question`),
      anchors: { 5: publicText(a5, `${slug} anchor 5`), 3: publicText(a3, `${slug} anchor 3`), 1: publicText(a1, `${slug} anchor 1`) },
    };
  });

  const checks = tableRows(section(md, 'Deterministic checks')).map(([check, dimension, effect, notes]) => ({
    check: check ?? '',
    dimension: dimension ?? '',
    effect: effect ?? '',
    notes: notes ?? '',
  }));

  return {
    dimensions,
    checks,
    rule(heading, label) {
      const hit = bullets(section(md, heading)).find((b) => b.startsWith(`**${label}`));
      if (!hit) throw new Error(`${RUBRIC_DOC}: no "**${label}" bullet under "${heading}"`);
      return publicText(hit.replace(/^\*\*[^*]+\*\*\s*/, ''), `${heading} / ${label}`);
    },
    bullets(heading) {
      return bullets(section(md, heading));
    },
    sentence(heading, phrase) {
      const text = section(md, heading).replace(/\s+/g, ' ');
      const hit = text.split(/(?<=[.!?])\s+(?=[A-Z])/).find((s) => s.includes(phrase));
      if (!hit) throw new Error(`${RUBRIC_DOC}: no sentence with "${phrase}" under "${heading}"`);
      return publicText(hit.trim(), `${heading} sentence`);
    },
  };
}

let cached: Rubric | undefined;

export function loadRubric(root: string = process.cwd()): Rubric {
  cached ??= parseRubric(readFileSync(join(root, RUBRIC_DOC), 'utf8'));
  return cached;
}

/** Strip markdown emphasis and code ticks for plain-text rendering. */
export function plain(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
}
