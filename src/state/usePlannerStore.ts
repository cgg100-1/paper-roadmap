import { useEffect, useState } from 'react';
import { DEMO_PLANNING_ITEMS } from '../data/demoData';
import type { PlanningItem } from '../domain/types';
import { parsePlannerJson, PLANNER_STORAGE_KEY, serialisePlanner } from '../domain/persistence';

const cloneDemo = () => DEMO_PLANNING_ITEMS.map(item => ({
  ...item,
  dependencies: [...item.dependencies],
  milestones: item.milestones.map(milestone => ({ ...milestone })),
}));

const loadInitialItems = (): PlanningItem[] => {
  if (typeof window === 'undefined') return cloneDemo();
  try {
    const saved = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    return saved ? parsePlannerJson(saved) : cloneDemo();
  } catch {
    return cloneDemo();
  }
};

export function usePlannerStore() {
  const [items, setItems] = useState<PlanningItem[]>(loadInitialItems);

  useEffect(() => {
    try {
      window.localStorage.setItem(PLANNER_STORAGE_KEY, serialisePlanner(items));
    } catch {
      // Local storage can be unavailable in private/restricted browser contexts.
    }
  }, [items]);

  const replaceFromJson = (text: string) => setItems(parsePlannerJson(text));
  const resetToDemo = () => setItems(cloneDemo());

  return { items, setItems, replaceFromJson, resetToDemo, exportJson: () => serialisePlanner(items) };
}
