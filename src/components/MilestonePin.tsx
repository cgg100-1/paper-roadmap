import type { CSSProperties } from 'react';
import { useState } from 'react';
import './milestonePin.css';
import { MILESTONE_COLORS, PLANNER_VISUALS } from '../data/theme';
import type { Milestone } from '../domain/types';
import { WEEK_SEGMENTS, dateToDayOffset, formatDateShort } from '../data/timelineModel';

const TYPE_LABELS: Record<string, string> = { deadline: 'Deadline', launch: 'Launch', review: 'Review', release: 'Release' };

interface Props { milestone: Milestone; dayWidth: number; }

export function MilestonePin({ milestone, dayWidth }: Props) {
  const [showTip, setShowTip] = useState(false);
  const { milestoneStickerSize: stickerSize, milestoneEdgeInset: edgeInset } = PLANNER_VISUALS;
  const week = WEEK_SEGMENTS.find(segment => milestone.date >= segment.startDate && milestone.date < segment.endDate);
  const cellRight = dateToDayOffset(week?.endDate ?? milestone.date) * dayWidth;
  const left = cellRight - stickerSize - edgeInset;
  const vars = { '--milestone-color': MILESTONE_COLORS[milestone.type] } as CSSProperties;

  return (
    <div
      className="milestone-pin"
      style={{ ...vars, left, top: edgeInset, width: stickerSize, height: stickerSize }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div className="milestone-sticker" aria-hidden="true" />
      {showTip && (
        <div className="milestone-tooltip" style={{ top: stickerSize + 6 }}>
          <div className="milestone-tooltip-title">{milestone.title}</div>
          <div className="milestone-tooltip-meta">{TYPE_LABELS[milestone.type]} · {formatDateShort(milestone.date)}</div>
          <div className="milestone-tooltip-arrow" />
        </div>
      )}
    </div>
  );
}
