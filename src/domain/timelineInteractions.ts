import type { PlanningItem } from './types';
import { addDays, daysBetween, snapDateToGrid, TIMELINE_END, TIMELINE_START } from '../data/timelineModel';

export type TimelineMoveMode = 'drag' | 'resize-left' | 'resize-right';

export function movePlanningItem(item: PlanningItem, deltaDays: number, mode: TimelineMoveMode): PlanningItem {
  if (mode === 'drag') {
    const duration = daysBetween(item.startDate, item.endDate);
    const latestStart = addDays(TIMELINE_END, -duration);
    let target = addDays(item.startDate, deltaDays);
    if (target < TIMELINE_START) target = TIMELINE_START;
    if (target > latestStart) target = latestStart;
    let startDate = snapDateToGrid(target);
    if (startDate > latestStart) startDate = latestStart;
    return { ...item, startDate, endDate: addDays(startDate, duration) };
  }

  if (mode === 'resize-left') {
    let startDate = snapDateToGrid(addDays(item.startDate, deltaDays));
    if (startDate < TIMELINE_START) startDate = TIMELINE_START;
    if (startDate >= item.endDate) return item;
    return { ...item, startDate };
  }

  let endDate = snapDateToGrid(addDays(item.endDate, deltaDays));
  if (endDate > TIMELINE_END) endDate = TIMELINE_END;
  if (endDate <= item.startDate) return item;
  return { ...item, endDate };
}
