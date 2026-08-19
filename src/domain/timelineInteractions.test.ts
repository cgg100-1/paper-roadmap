import { describe, expect, it } from 'vitest';
import { movePlanningItem } from './timelineInteractions';
import type { PlanningItem } from './types';

const base: PlanningItem = {
  id: 'item', title: 'Item', team: '', color: '#fff', textColor: '#000',
  startDate: '2026-02-02', endDate: '2026-03-02', row: 0, parentId: null,
  dependencies: [], milestones: [], status: 'planning', description: '', owner: '',
};

describe('timeline interactions', () => {
  it('preserves duration when dragging', () => {
    const moved = movePlanningItem(base, 14, 'drag');
    expect(moved.startDate).toBe('2026-02-16');
    expect(moved.endDate).toBe('2026-03-16');
  });

  it('prevents resize from inverting an item', () => {
    expect(movePlanningItem(base, 40, 'resize-left')).toEqual(base);
  });

  it('keeps items inside the configured timeline', () => {
    const moved = movePlanningItem(base, -1000, 'drag');
    expect(moved.startDate).toBe('2026-01-01');
  });
});
