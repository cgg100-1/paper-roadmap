import type { CSSProperties } from 'react';
import type { PlanningItem } from '../domain/types';
import { dateToDayOffset, daysBetween } from '../data/timelineModel';

interface Props {
  item: PlanningItem;
  isSelected: boolean;
  isConnecting: boolean;
  connectingFrom: string | null;
  dayWidth: number;
  rowHeight: number;
  barHeight: number;
  handleWidth: number;
  onClick: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeLeft: (e: React.MouseEvent) => void;
  onResizeRight: (e: React.MouseEvent) => void;
}

export function WashiBar({ item, isSelected, isConnecting, connectingFrom, dayWidth, rowHeight, barHeight, handleWidth, onClick, onDragStart, onResizeLeft, onResizeRight }: Props) {
  const left = dateToDayOffset(item.startDate) * dayWidth;
  const width = daysBetween(item.startDate, item.endDate) * dayWidth;
  const top = (rowHeight - barHeight) / 2;
  const isSource = connectingFrom === item.id;
  const isTarget = isConnecting && !isSource;
  const stateClass = isSelected ? ' is-selected' : isSource ? ' is-source' : isTarget ? ' is-target' : '';
  const interactionClass = isConnecting ? (isTarget ? ' can-connect' : ' connecting') : '';
  const vars = {
    '--washi-bg': item.color,
    '--washi-text': item.textColor,
    '--washi-handle': `${handleWidth}px`,
  } as CSSProperties;

  return (
    <div className="washi-shell" style={{ ...vars, left, top, width, height: barHeight }}>
      <div className="washi-resize-handle washi-resize-left" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeLeft(e); }} />
      <div className={`washi-bar${stateClass}${interactionClass}`} onClick={onClick} onMouseDown={(e) => { if (!isConnecting) onDragStart(e); }}>
        <span className="washi-label">{item.title}</span>
      </div>
      <div className="washi-resize-handle washi-resize-right" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeRight(e); }} />
    </div>
  );
}
