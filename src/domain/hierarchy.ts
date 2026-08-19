import type { PlanningItem } from './types';

export interface HierarchyLayoutItem {
  item: PlanningItem;
  depth: number;
  top: number;
  height: number;
  barHeight: number;
}

export function buildHierarchyLayout(
  items: PlanningItem[],
  collapsedIds: ReadonlySet<string>,
  rowHeightForDepth: (depth: number) => number,
  barHeightForDepth: (depth: number) => number,
) {
  const sorted = [...items].sort((a, b) => a.row - b.row);
  const ids = new Set(items.map(item => item.id));
  const byParent = new Map<string | null, PlanningItem[]>();

  for (const item of sorted) {
    const parentId = item.parentId && ids.has(item.parentId) ? item.parentId : null;
    const siblings = byParent.get(parentId) ?? [];
    siblings.push(item);
    byParent.set(parentId, siblings);
  }

  const visible: HierarchyLayoutItem[] = [];
  let top = 0;

  const walk = (parentId: string | null, depth: number) => {
    for (const item of byParent.get(parentId) ?? []) {
      const height = rowHeightForDepth(depth);
      const barHeight = barHeightForDepth(depth);
      visible.push({ item, depth, top, height, barHeight });
      top += height;
      if (!collapsedIds.has(item.id)) walk(item.id, depth + 1);
    }
  };

  walk(null, 0);
  return { items: visible, totalHeight: top };
}

export function getDescendantIds(items: PlanningItem[], rootId: string) {
  const descendants = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of items) {
      if (item.parentId && (item.parentId === rootId || descendants.has(item.parentId)) && !descendants.has(item.id)) {
        descendants.add(item.id);
        changed = true;
      }
    }
  }
  return descendants;
}
