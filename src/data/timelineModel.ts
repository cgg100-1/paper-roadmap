import {
  INITIAL_INITIATIVES as LEGACY_INITIATIVES,
  MONTHS,
  YEAR,
  type InitiativeStatus,
  type MilestoneType,
} from './planningData';

export interface Milestone {
  id: string;
  title: string;
  date: string;
  type: MilestoneType;
}

export interface Initiative {
  id: string;
  title: string;
  team: string;
  color: string;
  textColor: string;
  startDate: string;
  endDate: string;
  row: number;
  parentId: string | null;
  dependencies: string[];
  milestones: Milestone[];
  status: InitiativeStatus;
  description: string;
  owner: string;
}

export const TIMELINE_START = `${YEAR}-01-01`;
export const TIMELINE_END = `${YEAR + 1}-01-01`;
const DAY_MS = 86_400_000;

const toUtcMs = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

export const fromUtcMs = (value: number) => new Date(value).toISOString().slice(0, 10);
export const addDays = (date: string, days: number) => fromUtcMs(toUtcMs(date) + days * DAY_MS);
export const daysBetween = (from: string, to: string) => Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
export const dateToDayOffset = (date: string) => daysBetween(TIMELINE_START, date);
export const TIMELINE_DAYS = daysBetween(TIMELINE_START, TIMELINE_END);

const clampTimelineDate = (date: string) => {
  if (date < TIMELINE_START) return TIMELINE_START;
  if (date > TIMELINE_END) return TIMELINE_END;
  return date;
};

const isMonday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay() === 1;

const SNAP_POINTS = (() => {
  const candidates = new Set<string>([TIMELINE_START, TIMELINE_END]);
  for (let month = 0; month < 12; month += 1) {
    candidates.add(`${YEAR}-${String(month + 1).padStart(2, '0')}-01`);
  }
  for (let day = 0; day <= TIMELINE_DAYS; day += 1) {
    const candidate = addDays(TIMELINE_START, day);
    if (isMonday(candidate)) candidates.add(candidate);
  }
  return [...candidates].sort();
})();

export const snapDateToGrid = (date: string) => {
  const target = clampTimelineDate(date);
  return SNAP_POINTS.reduce((best, candidate) =>
    Math.abs(daysBetween(target, candidate)) < Math.abs(daysBetween(target, best)) ? candidate : best,
  TIMELINE_START);
};

export interface TimelineSegment {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  days: number;
  monthIndex?: number;
}

export const MONTH_SEGMENTS: TimelineSegment[] = MONTHS.map((label, monthIndex) => {
  const startDate = `${YEAR}-${String(monthIndex + 1).padStart(2, '0')}-01`;
  const endDate = monthIndex === 11 ? TIMELINE_END : `${YEAR}-${String(monthIndex + 2).padStart(2, '0')}-01`;
  return { key: `month-${monthIndex}`, label, startDate, endDate, days: daysBetween(startDate, endDate), monthIndex };
});

const isoWeek = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / DAY_MS) + 1) / 7);
};

export const WEEK_SEGMENTS: TimelineSegment[] = (() => {
  const segments: TimelineSegment[] = [];
  let cursor = TIMELINE_START;
  while (cursor < TIMELINE_END) {
    const cursorDay = new Date(`${cursor}T00:00:00Z`).getUTCDay();
    const daysToMonday = cursorDay === 1 ? 7 : ((8 - cursorDay) % 7 || 7);
    const span = Math.min(daysToMonday, daysBetween(cursor, TIMELINE_END));
    const endDate = addDays(cursor, span);
    segments.push({ key: `week-${cursor}`, label: `W${isoWeek(cursor)}`, startDate: cursor, endDate, days: span });
    cursor = endDate;
  }
  return segments;
})();

export const formatDateShort = (date: string) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
}).format(new Date(`${date}T00:00:00Z`));

const monthStart = (month: number) => `${YEAR}-${String(month + 1).padStart(2, '0')}-01`;
const monthAfter = (month: number) => month === 11 ? TIMELINE_END : `${YEAR}-${String(month + 2).padStart(2, '0')}-01`;
const monthMiddle = (month: number) => `${YEAR}-${String(month + 1).padStart(2, '0')}-15`;

export const INITIAL_TIMELINE_INITIATIVES: Initiative[] = LEGACY_INITIATIVES.map(initiative => ({
  id: initiative.id,
  title: initiative.title,
  team: initiative.team,
  color: initiative.color,
  textColor: initiative.textColor,
  startDate: monthStart(initiative.startMonth),
  endDate: monthAfter(initiative.endMonth),
  row: initiative.row,
  parentId: null,
  dependencies: [...initiative.dependencies],
  milestones: initiative.milestones.map(milestone => ({
    id: milestone.id,
    title: milestone.title,
    date: monthMiddle(milestone.month),
    type: milestone.type,
  })),
  status: initiative.status,
  description: initiative.description,
  owner: initiative.owner,
}));
