import type { Milestone, MilestoneType, PlanningItem, PlanningItemStatus } from './types';

export const PLANNER_STORAGE_KEY = 'paper-roadmap:v1';
export const PLANNER_DOCUMENT_VERSION = 1 as const;

export interface PlannerDocument {
  version: typeof PLANNER_DOCUMENT_VERSION;
  items: PlanningItem[];
}

const STATUSES: PlanningItemStatus[] = ['planning', 'active', 'complete', 'blocked'];
const MILESTONE_TYPES: MilestoneType[] = ['deadline', 'launch', 'review', 'release'];
const isString = (value: unknown): value is string => typeof value === 'string';

const isMilestone = (value: unknown): value is Milestone => {
  if (!value || typeof value !== 'object') return false;
  const milestone = value as Partial<Milestone>;
  return isString(milestone.id)
    && isString(milestone.title)
    && isString(milestone.date)
    && MILESTONE_TYPES.includes(milestone.type as MilestoneType);
};

const isPlanningItem = (value: unknown): value is PlanningItem => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PlanningItem>;
  return isString(item.id)
    && isString(item.title)
    && isString(item.team)
    && isString(item.color)
    && isString(item.textColor)
    && isString(item.startDate)
    && isString(item.endDate)
    && typeof item.row === 'number'
    && (item.parentId === null || isString(item.parentId))
    && Array.isArray(item.dependencies) && item.dependencies.every(isString)
    && Array.isArray(item.milestones) && item.milestones.every(isMilestone)
    && STATUSES.includes(item.status as PlanningItemStatus)
    && isString(item.description)
    && isString(item.owner);
};

export function serialisePlanner(items: PlanningItem[]) {
  const document: PlannerDocument = { version: PLANNER_DOCUMENT_VERSION, items };
  return JSON.stringify(document, null, 2);
}

export function parsePlannerJson(text: string): PlanningItem[] {
  const parsed: unknown = JSON.parse(text);
  const candidateItems = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && (parsed as Partial<PlannerDocument>).version === PLANNER_DOCUMENT_VERSION
      ? (parsed as Partial<PlannerDocument>).items
      : null;

  if (!Array.isArray(candidateItems) || !candidateItems.every(isPlanningItem)) {
    throw new Error('This is not a valid Paper Roadmap data file.');
  }

  const ids = new Set(candidateItems.map(item => item.id));
  if (ids.size !== candidateItems.length) throw new Error('Planning item IDs must be unique.');

  return candidateItems.map((item, row) => ({
    ...item,
    row,
    dependencies: item.dependencies.filter(id => ids.has(id) && id !== item.id),
    parentId: item.parentId && ids.has(item.parentId) && item.parentId !== item.id ? item.parentId : null,
  }));
}
