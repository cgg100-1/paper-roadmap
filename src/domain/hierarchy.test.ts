import { describe, expect, it } from 'vitest';
import { buildHierarchyLayout, getDescendantIds } from './hierarchy';
import type { PlanningItem } from './types';

const item = (id: string, parentId: string | null, row: number): PlanningItem => ({
  id,
  parentId,
  row,
  title: id,
  team: '',
  color: '#fff',
  textColor: '#000',
  startDate: '2026-01-01',
  endDate: '2026-02-01',
  dependencies: [],
  externalDependencies: [],
  milestones: [],
  status: 'planning',
  description: '',
  owner: '',
});

describe('hierarchy', () => {
  const items = [item('parent', null, 0), item('child', 'parent', 1), item('grandchild', 'child', 2), item('other', null, 3)];

  it('lays descendants out beneath their parent', () => {
    const layout = buildHierarchyLayout(items, new Set(), () => 10, () => 4);
    expect(layout.items.map(entry => [entry.item.id, entry.depth])).toEqual([
      ['parent', 0], ['child', 1], ['grandchild', 2], ['other', 0],
    ]);
    expect(layout.totalHeight).toBe(40);
  });

  it('hides descendants of collapsed items', () => {
    const layout = buildHierarchyLayout(items, new Set(['parent']), () => 10, () => 4);
    expect(layout.items.map(entry => entry.item.id)).toEqual(['parent', 'other']);
  });

  it('finds all descendants for safe deletion', () => {
    expect([...getDescendantIds(items, 'parent')]).toEqual(['child', 'grandchild']);
  });
});
