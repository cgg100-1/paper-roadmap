import { useEffect, useRef, useState } from 'react';
import { DEMO_PLANNING_ITEMS } from '../data/demoData';
import type { PlanningItem } from '../domain/types';
import { parsePlannerJson, PLANNER_STORAGE_KEY, serialisePlanner } from '../domain/persistence';

const LOCAL_FILE_API = '/__paper-roadmap/data';
const SAVE_DEBOUNCE_MS = 250;

const cloneDemo = () => DEMO_PLANNING_ITEMS.map(item => ({
  ...item,
  dependencies: [...item.dependencies],
  externalDependencies: item.externalDependencies.map(dependency => ({ ...dependency })),
  milestones: item.milestones.map(milestone => ({ ...milestone })),
}));

const loadBrowserBackup = (): PlanningItem[] => {
  if (typeof window === 'undefined') return cloneDemo();
  try {
    const saved = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    return saved ? parsePlannerJson(saved) : cloneDemo();
  } catch {
    return cloneDemo();
  }
};

export function usePlannerStore() {
  const [items, setItems] = useState<PlanningItem[]>(loadBrowserBackup);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const fileHydratedRef = useRef(!import.meta.env.DEV);
  const saveTimerRef = useRef<number | null>(null);
  const saveChainRef = useRef(Promise.resolve());

  // Browser storage remains a secondary backup in both local and deployed modes.
  useEffect(() => {
    try {
      window.localStorage.setItem(PLANNER_STORAGE_KEY, serialisePlanner(items));
    } catch {
      // Local storage can be unavailable in private/restricted browser contexts.
    }
  }, [items]);

  // When running locally, the JSON file is the source of truth. On first use,
  // if the file does not exist yet, migrate the current browser backup/demo into it.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;

    const hydrateFromFile = async () => {
      try {
        const response = await fetch(LOCAL_FILE_API, { cache: 'no-store' });
        if (response.ok) {
          const fileItems = parsePlannerJson(await response.text());
          if (!cancelled) setItems(fileItems);
        } else if (response.status === 404) {
          const seed = serialisePlanner(items);
          const createResponse = await fetch(LOCAL_FILE_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: seed,
          });
          if (!createResponse.ok) throw new Error('Could not create local planner data file.');
        } else {
          throw new Error('Could not read local planner data file.');
        }
        if (!cancelled) setPersistenceError(null);
      } catch (error) {
        if (!cancelled) {
          setPersistenceError(error instanceof Error ? error.message : 'Could not load local planner data file.');
        }
      } finally {
        fileHydratedRef.current = true;
      }
    };

    void hydrateFromFile();
    return () => { cancelled = true; };
    // Run once on app start. `items` here is deliberately the initial browser backup/demo used for first-run migration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In local development, persist every front-end change back to data/planner-data.json.
  // Debouncing avoids excessive writes while typing; the promise chain guarantees writes finish in order.
  useEffect(() => {
    if (!import.meta.env.DEV || !fileHydratedRef.current) return;
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);

    const document = serialisePlanner(items);
    saveTimerRef.current = window.setTimeout(() => {
      saveChainRef.current = saveChainRef.current
        .then(async () => {
          const response = await fetch(LOCAL_FILE_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: document,
          });
          if (!response.ok) throw new Error('Could not save planner-data.json.');
          setPersistenceError(null);
        })
        .catch(error => {
          setPersistenceError(error instanceof Error ? error.message : 'Could not save planner-data.json.');
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, [items]);

  const replaceFromJson = (text: string) => setItems(parsePlannerJson(text));
  const resetToDemo = () => setItems(cloneDemo());

  return {
    items,
    setItems,
    replaceFromJson,
    resetToDemo,
    exportJson: () => serialisePlanner(items),
    persistenceMode: import.meta.env.DEV ? 'local-file' as const : 'browser' as const,
    persistenceError,
  };
}
