import { useState } from 'react';
import type { Milestone } from '../data/planningData';
import { dateToDayOffset, formatDateShort, MILESTONE_COLORS } from '../data/planningData';

const TYPE_LABELS: Record<string, string> = { deadline: 'Deadline', launch: 'Launch', review: 'Review', release: 'Release' };

interface Props { milestone: Milestone; dayWidth: number; rowHeight: number; barHeight: number; }

export function MilestonePin({ milestone, dayWidth, rowHeight, barHeight }: Props) {
  const [showTip, setShowTip] = useState(false);
  const pinW = 14;
  const pinH = 11;
  const left = dateToDayOffset(milestone.date) * dayWidth - pinW / 2;
  const barTop = (rowHeight - barHeight) / 2;
  const pinTop = barTop - pinH - 3;
  const color = MILESTONE_COLORS[milestone.type];

  return (
    <div style={{ position: 'absolute', left, top: pinTop, width: pinW, height: pinH, zIndex: 8, cursor: 'default' }} onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <svg width={pinW} height={pinH} viewBox={`0 0 ${pinW} ${pinH}`} style={{ display: 'block' }}>
        <polygon points={`${pinW / 2},${pinH} 0,0 ${pinW},0`} fill={color} opacity={0.88} />
      </svg>
      {showTip && (
        <div style={{ position: 'absolute', bottom: pinH + 6, left: '50%', transform: 'translateX(-50%)', background: '#2C2418', color: '#F7F3ED', borderRadius: 5, padding: '5px 9px', fontSize: 11, whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: '"DM Sans", sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 50 }}>
          <div style={{ fontWeight: 500 }}>{milestone.title}</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, fontFamily: '"DM Mono", monospace' }}>{TYPE_LABELS[milestone.type]} · {formatDateShort(milestone.date)}</div>
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #2C2418' }} />
        </div>
      )}
    </div>
  );
}
