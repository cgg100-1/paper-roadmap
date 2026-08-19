import type { PlanningItemStatus } from './types';

export const EDITABLE_TABLE_COLUMNS = ['title', 'parent', 'startDate', 'endDate', 'team', 'owner', 'status'] as const;
export type EditableTableColumn = typeof EDITABLE_TABLE_COLUMNS[number];

const HEADER_ALIASES: Record<string, EditableTableColumn> = {
  item: 'title',
  title: 'title',
  name: 'title',
  parent: 'parent',
  start: 'startDate',
  'start date': 'startDate',
  end: 'endDate',
  'end date': 'endDate',
  team: 'team',
  owner: 'owner',
  status: 'status',
};

const STATUSES: PlanningItemStatus[] = ['planning', 'active', 'complete', 'blocked'];

export function parseClipboardGrid(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(row => row.split('\t').map(cell => cell.trim()))
    .filter(row => row.some(cell => cell.length > 0));
}

export function isRecognisedHeaderRow(row: string[]) {
  if (row.length < 2) return false;
  const recognised = row.filter(cell => HEADER_ALIASES[cell.trim().toLowerCase()]).length;
  return recognised >= Math.min(2, row.length);
}

export function normalisePastedDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const uk = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (!uk) return null;
  const [, day, month, year] = uk;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function normalisePastedStatus(value: string): PlanningItemStatus | null {
  const candidate = value.trim().toLowerCase() as PlanningItemStatus;
  return STATUSES.includes(candidate) ? candidate : null;
}
