import type { Initiative } from '../data/planningData';
import { dateToDayOffset, daysBetween } from '../data/planningData';

interface Props {
  initiative: Initiative;
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

export function WashiBar({ initiative, isSelected, isConnecting, connectingFrom, dayWidth, rowHeight, barHeight, handleWidth, onClick, onDragStart, onResizeLeft, onResizeRight }: Props) {
  const left = dateToDayOffset(initiative.startDate) * dayWidth;
  const width = daysBetween(initiative.startDate, initiative.endDate) * dayWidth;
  const top = (rowHeight - barHeight) / 2;
  const isSource = connectingFrom === initiative.id;
  const isTarget = isConnecting && !isSource;

  return (
    <div className="absolute" style={{ left, top, width, height: barHeight, zIndex: 4 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: handleWidth, height: '100%', cursor: 'ew-resize', zIndex: 6, borderRadius: '4px 0 0 4px' }} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeLeft(e); }} />
      <div
        className="washi-bar"
        style={{
          position: 'absolute', inset: 0, borderRadius: 4,
          backgroundColor: initiative.color,
          backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.14) 4px, rgba(255,255,255,0.14) 5px)',
          boxShadow: isSelected ? `0 0 0 2px ${initiative.textColor}, 0 2px 10px rgba(0,0,0,0.15)` : isSource ? '0 0 0 2px #B43C3C' : '0 1px 4px rgba(0,0,0,0.10)',
          outline: isTarget ? '2px dashed rgba(44,36,24,0.4)' : 'none', outlineOffset: 2,
          cursor: isConnecting ? (isTarget ? 'crosshair' : 'default') : 'grab',
          display: 'flex', alignItems: 'center', paddingLeft: handleWidth + 4, paddingRight: handleWidth + 4,
          overflow: 'hidden', transition: 'outline 0.1s',
        }}
        onClick={onClick}
        onMouseDown={(e) => { if (!isConnecting) onDragStart(e); }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 500, fontFamily: '"DM Sans", sans-serif', color: initiative.textColor, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none', userSelect: 'none' }}>{initiative.title}</span>
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, width: handleWidth, height: '100%', cursor: 'ew-resize', zIndex: 6, borderRadius: '0 4px 4px 0' }} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeRight(e); }} />
    </div>
  );
}
