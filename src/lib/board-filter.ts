// The board's filters, shared by the server render and the browser script
// (src/scripts/scoreboard-filter.ts), so a filtered page built for JS-off
// readers and the same filter applied in place agree on rows, ranks and stats.
// Every vertical and kind combination is a built page: / is All and All, every
// other combination is /board/<vertical>/<kind>/. No DOM or Node imports here.

export const ALL = 'all';

export interface Filter {
  vertical: string;
  kind: string;
}

export function boardHref(f: Filter): string {
  return f.vertical === ALL && f.kind === ALL ? '/' : `/board/${f.vertical}/${f.kind}/`;
}

/** A ranked row matches on vertical and kind. */
export function rowMatches(row: Filter, f: Filter): boolean {
  return (f.vertical === ALL || row.vertical === f.vertical) && (f.kind === ALL || row.kind === f.kind);
}

/** A not-captured brand has no kind, so only the vertical filter applies to it. */
export function missedMatches(vertical: string, f: Filter): boolean {
  return f.vertical === ALL || vertical === f.vertical;
}

export interface BoardStats {
  count: number;
  /** Average total of the rows shown, to one decimal place. */
  avg: string;
  fails: number;
  missed: number;
}

export function boardStats(rows: { total: number; capped: boolean }[], missed: number): BoardStats {
  const sum = rows.reduce((a, r) => a + r.total, 0);
  return {
    count: rows.length,
    avg: rows.length ? (sum / rows.length).toFixed(1) : '0.0',
    fails: rows.filter((r) => r.capped).length,
    missed,
  };
}
