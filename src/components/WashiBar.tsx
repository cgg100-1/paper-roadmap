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

  return (
    <div className="absolute" style={{ left, top, width, height: barHeight, zIndex: 4 }}>
      <div
        style={{ position: 'absolute', left: 0, top: 0, width: handleWidth, height: '100%', cursor: 'ew-resize', zIndex: 6 }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeLeft(e); }}
      />

      <div
        className="washi-bar"
        style={{
          position: 'absolute', inset: 0,
          backgroundColor: item.color,
          opacity: 0.88,
          clipPath: 'polygon(0.7% 0%, 0% 9%, 0.8% 18%, 0.15% 31%, 0.9% 43%, 0.2% 55%, 0.75% 68%, 0.1% 81%, 0.9% 92%, 0.35% 100%, 99.35% 100%, 100% 91%, 99.25% 80%, 99.9% 68%, 99.2% 55%, 99.85% 42%, 99.15% 30%, 99.85% 18%, 99.2% 8%, 99.6% 0%)',
          backgroundImage: [
            'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.01) 24%, rgba(255,255,255,0.06) 57%, rgba(0,0,0,0.025))',
            'repeating-linear-gradient(7deg, rgba(255,255,255,0.10) 0, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 5px)',
            'repeating-linear-gradient(96deg, rgba(0,0,0,0.018) 0, rgba(0,0,0,0.018) 1px, transparent 1px, transparent 7px)',
          ].join(','),
          boxShadow: isSelected ? `0 0 0 2px ${item.textColor}, 0 3px 8px rgba(44,36,24,0.14)` : isSource ? '0 0 0 2px #B43C3C' : '0 2px 4px rgba(44,36,24,0.10)',
          outline: isTarget ? '2px dashed rgba(44,36,24,0.4)' : 'none', outlineOffset: 2,
          cursor: isConnecting ? (isTarget ? 'crosshair' : 'default') : 'grab',
          display: 'flex', alignItems: 'center', paddingLeft: handleWidth + 5, paddingRight: handleWidth + 5,
          overflow: 'hidden', transition: 'outline 0.1s, box-shadow 0.15s ease, transform 0.12s ease',
        }}
        onClick={onClick}
        onMouseDown={(e) => { if (!isConnecting) onDragStart(e); }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 500, fontFamily: '"DM Sans", sans-serif', color: item.textColor, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none', userSelect: 'none', textShadow: '0 1px rgba(255,255,255,0.22)' }}>{item.title}</span>
      </div>

      <div
        style={{ position: 'absolute', right: 0, top: 0, width: handleWidth, height: '100%', cursor: 'ew-resize', zIndex: 6 }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeRight(e); }}
      />
    </div>
  );
}
