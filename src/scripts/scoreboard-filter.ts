// Progressive enhancement for the board. Without JS the filter chips are plain
// links to built pages (/board/<vertical>/<kind>/), each already filtered.
// With JS a plain click filters in place instead: rows, held and not-captured
// brands are shown or hidden via `hidden`, ranks and the four stats are
// recomputed, the chips' links and current state follow, and the address bar
// is updated to the built page for the same filter.
import { ALL, boardHref, boardStats, missedMatches, rowMatches, type Filter } from '../lib/board-filter';

export function initScoreboardFilters(root: ParentNode = document): void {
  const board = root.querySelector<HTMLElement>('[data-board]');
  if (!board) return;
  const rows = [...board.querySelectorAll<HTMLElement>('[data-row]')];
  const missed = [...board.querySelectorAll<HTMLElement>('[data-missed]')];
  const missedSection = board.querySelector<HTMLElement>('[data-missed-section]');
  const held = [...board.querySelectorAll<HTMLElement>('[data-held]')];
  const heldSection = board.querySelector<HTMLElement>('[data-held-section]');
  const chips = [...board.querySelectorAll<HTMLAnchorElement>('a[data-filter]')];
  const empty = board.querySelector<HTMLElement>('[data-empty]');
  const stat = (name: string) => document.querySelector<HTMLElement>(`[data-stat="${name}"]`);

  const filter: Filter = { vertical: board.dataset.vertical ?? ALL, kind: board.dataset.kind ?? ALL };

  function apply(): void {
    const shown: { total: number; capped: boolean }[] = [];
    for (const row of rows) {
      const visible = rowMatches({ vertical: row.dataset.vertical ?? '', kind: row.dataset.kind ?? '' }, filter);
      row.hidden = !visible;
      if (!visible) continue;
      shown.push({ total: Number(row.dataset.total), capped: row.dataset.capped === 'true' });
      const rank = row.querySelector('[data-rank]');
      if (rank) rank.textContent = String(shown.length);
    }
    let missedShown = 0;
    for (const m of missed) {
      m.hidden = !missedMatches(m.dataset.vertical ?? '', filter);
      if (!m.hidden) missedShown++;
    }
    if (missedSection) missedSection.hidden = missedShown === 0;
    let heldShown = 0;
    for (const h of held) {
      h.hidden = !missedMatches(h.dataset.vertical ?? '', filter);
      if (!h.hidden) heldShown++;
    }
    if (heldSection) heldSection.hidden = heldShown === 0;
    if (empty) empty.hidden = shown.length > 0;

    const s = boardStats(shown, missedShown);
    for (const [name, value] of Object.entries(s)) {
      const el = stat(name);
      if (el) el.textContent = String(value);
    }
    for (const chip of chips) {
      const group = chip.dataset.filter as keyof Filter;
      const value = chip.dataset.value ?? ALL;
      chip.href = boardHref({ ...filter, [group]: value });
      if (filter[group] === value) chip.setAttribute('aria-current', 'true');
      else chip.removeAttribute('aria-current');
    }
  }

  for (const chip of chips) {
    chip.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      filter[chip.dataset.filter as keyof Filter] = chip.dataset.value ?? ALL;
      apply();
      history.replaceState(null, '', boardHref(filter));
    });
  }
  apply();
}
