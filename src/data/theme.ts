import type { MilestoneType, PlanningItemStatus } from '../domain/types';

export const MONTH_BAND_COLORS = [
  '#EAE6F5', '#F5E6EB', '#E6F2EB', '#F5EDE3', '#E3EDF5', '#F5F2DC',
  '#F5E3ED', '#E3F0E8', '#E6EAF5', '#F5E9DC', '#DCF0F5', '#F2EDD8',
];

export const WASHI_PALETTE: Array<{ bg: string; text: string }> = [
  { bg: '#B8D4B8', text: '#1A3A1A' }, { bg: '#E8A8B4', text: '#5A1C26' },
  { bg: '#A8BEE0', text: '#182A52' }, { bg: '#E8B090', text: '#5A260E' },
  { bg: '#C4B2E0', text: '#2A1A52' }, { bg: '#8CCCC0', text: '#0A2E26' },
  { bg: '#F0C898', text: '#5A360E' }, { bg: '#B8C0E8', text: '#181E4E' },
  { bg: '#C8CE8A', text: '#282E0E' }, { bg: '#D4A8BC', text: '#481636' },
];

export const MILESTONE_COLORS: Record<MilestoneType, string> = {
  deadline: '#CC5555', launch: '#5A9E6A', review: '#8A5EBE', release: '#B87820',
};

export const STATUS_STYLES: Record<PlanningItemStatus, { bg: string; text: string; label: string }> = {
  planning: { bg: '#EAE6F5', text: '#2A1A52', label: 'Planning' },
  active: { bg: '#E6F2EB', text: '#1A3A1A', label: 'Active' },
  complete: { bg: '#ECEAE6', text: '#4A3A2A', label: 'Complete' },
  blocked: { bg: '#F5E6EB', text: '#5A1C26', label: 'Blocked' },
};

export const PLANNER_VISUALS = {
  rowHeights: [78, 54, 38, 30] as const,
  barHeights: [34, 24, 14, 8] as const,
  resizeHandleWidth: 9,
  rowIndentBase: 10,
  rowIndentStep: 17,
  milestoneStickerSize: 30,
  milestoneEdgeInset: 3,
  externalDependencyStickerWidth: 32,
  externalDependencyStickerHeight: 23,
  externalDependencyTopInset: 7,
} as const;

export const rowHeightForDepth = (depth: number) => PLANNER_VISUALS.rowHeights[Math.min(depth, PLANNER_VISUALS.rowHeights.length - 1)];
export const barHeightForDepth = (depth: number) => PLANNER_VISUALS.barHeights[Math.min(depth, PLANNER_VISUALS.barHeights.length - 1)];

export const newId = () => Math.random().toString(36).slice(2, 9);
