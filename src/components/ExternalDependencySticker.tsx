import { useState } from 'react';
import './externalDependencySticker.css';
import { PLANNER_VISUALS } from '../data/theme';
import type { ExternalDependency } from '../domain/types';
import { WEEK_SEGMENTS, dateToDayOffset, formatDateShort } from '../data/timelineModel';

interface Props {
  dependency: ExternalDependency;
  dayWidth: number;
  rowHeight: number;
}

export function ExternalDependencySticker({ dependency, dayWidth, rowHeight }: Props) {
  const [showTip, setShowTip] = useState(false);
  const stickerSize = PLANNER_VISUALS.externalDependencyStickerSize;
  const week = WEEK_SEGMENTS.find(segment => dependency.date >= segment.startDate && dependency.date < segment.endDate);
  const startDate = week?.startDate ?? dependency.date;
  const cellWidth = (week?.days ?? 7) * dayWidth;
  const left = dateToDayOffset(startDate) * dayWidth + Math.max(0, (cellWidth - stickerSize) / 2);
  const top = Math.max(1, (rowHeight - stickerSize) / 2);

  return (
    <div
      className="external-dependency-pin"
      style={{ left, top, width: stickerSize, height: stickerSize }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <svg className="external-dependency-sticker" viewBox="0 0 28 28" aria-hidden="true">
        <path className="external-dependency-paper" d="M27 2H13.2C7.7 2 5 5 5 8.4c0 2.5 1.5 4.4 4 5.4-3.4.8-5 2.9-5 5.5C4 23.1 7 26 12.4 26H27Z" />
        <path className="external-dependency-outline" d="M25.7 3.5H13.4c-4.3 0-6.7 2.1-6.7 4.9 0 2.4 1.8 4.2 5 5.1-4 .6-6 2.7-6 5.7 0 3 2.5 5.3 6.9 5.3h13.1" />
      </svg>
      <span className="external-dependency-mark">↙</span>
      {showTip && (
        <div className="external-dependency-tooltip">
          <div className="external-dependency-tooltip-title">{dependency.title}</div>
          <div className="external-dependency-tooltip-meta">External dependency · {formatDateShort(dependency.date)}</div>
          <div className="external-dependency-tooltip-arrow" />
        </div>
      )}
    </div>
  );
}
