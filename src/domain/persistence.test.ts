import { describe, expect, it } from 'vitest';
import { parsePlannerJson, serialisePlanner } from './persistence';
import type { PlanningItem } from './types';

const item: PlanningItem = {
  id: 'a', title: 'Example', team: '', owner: '', description: '', color: '#fff', textColor: '#000',
  startDate: '2026-01-01', endDate: '2026-02-01', row: 4, parentId: null,
  dependencies: [], externalDependencies: [{ id: 'x1', title: 'Agency asset', date: '2026-01-19' }], milestones: [], status: 'planning',
};

describe('planner persistence', () => {
  it('round-trips the canonical planning items', () => {
    expect(parsePlannerJson(serialisePlanner([item]))).toEqual([{ ...item, row: 0 }]);
  });

  it('migrates older saved items that have no external dependency field', () => {
    const { externalDependencies: _externalDependencies, ...legacyItem } = item;
    expect(parsePlannerJson(JSON.stringify([legacyItem]))[0].externalDependencies).toEqual([]);
  });

  it('accepts a plain item array for easy imports', () => {
    expect(parsePlannerJson(JSON.stringify([item]))[0].title).toBe('Example');
  });

  it('rejects malformed files', () => {
    expect(() => parsePlannerJson('{"hello":"world"}')).toThrow('valid Paper Roadmap');
  });
});
