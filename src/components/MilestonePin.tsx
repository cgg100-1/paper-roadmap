import { useState } from 'react';
import { MILESTONE_COLORS } from '../data/theme';
import type { Milestone } from '../domain/types';
import { WEEK_SEGMENTS, dateToDayOffset, formatDateShort } from '../data/timelineModel';

const TYPE_LABELS: Record<string, string> = { deadline: 'Deadline', launch: 'Launch', review: 'Review', release: 'Release' };

interface Props { milestone: Milestone; dayWidth: number; rowHeight: number; barHeight: number; }

export function MilestonePin({ milestone, dayWidth }: Props) {
  const [showTip, setShowTip] = useState(false);
  const stickerSize = 20;
  const edgeInset = 2;
  const color = MILESTONE_COLORS[milestone.type];

  const week = WEEK_SEGMENTS.find(segment => milestone.date >= segment.startDate && milestone.date < segment.endDate);
  const cellRight = dateToDayOffset(week?.endDate ?? milestone.date) * dayWidth;
  const left = cellRight - stickerSize - edgeInset;
  const top = edgeInset;

  return (
    <div
      style={{ position: 'absolute', left, top, width: stickerSize, height: stickerSize, zIndex: 8, cursor: 'default' }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: '100%',
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          backgroundColor: color,
          backgroundImage: 'linear-gradient(115deg, rgba(255,255,255,.28), rgba(255,255,255,0) 48%), repeating-linear-gradient(16deg, rgba(255,255,255,.08) 0 1px, rgba(255,255,255,0) 1px 4px)',
          opacity: 0.9,
          filter: 'drop-shadow(0 1px 1px rgba(44,36,24,.14))',
        }}
      />
      {showTip && (
        <div style={{ position: 'absolute', top: stickerSize + 6, right: 0, background: '#2C2418', color: '#F7F3ED', borderRadius: 5, padding: '5px 9px', fontSize: 11, whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: '"DM Sans", sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 50 }}>
          <div style={{ fontWeight: 500 }}>{milestone.title}</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, fontFamily: '"DM Mono", monospace' }}>{TYPE_LABELS[milestone.type]} · {formatDateShort(milestone.date)}</div>
          <div style={{ position: 'absolute', top: -5, right: 6, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid #2C2418' }} />
        </div>
      )}
    </div>
  );
}
