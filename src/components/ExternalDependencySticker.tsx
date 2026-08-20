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

export function ExternalDependencySticker({ dependency, dayWidth }: Props) {
  const [showTip, setShowTip] = useState(false);
  const stickerWidth = PLANNER_VISUALS.externalDependencyStickerWidth;
  const stickerHeight = PLANNER_VISUALS.externalDependencyStickerHeight;
  const week = WEEK_SEGMENTS.find(segment => dependency.date >= segment.startDate && dependency.date < segment.endDate);
  const startDate = week?.startDate ?? dependency.date;
  const cellWidth = (week?.days ?? 7) * dayWidth;
  const left = dateToDayOffset(startDate) * dayWidth + Math.max(0, (cellWidth - stickerWidth) / 2);
  const top = PLANNER_VISUALS.externalDependencyTopInset;

  return (
    <div
      className="external-dependency-pin"
      style={{ left, top, width: stickerWidth, height: stickerHeight }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <svg className="external-dependency-sticker" viewBox="0 0 40 28" aria-hidden="true" preserveAspectRatio="none">
        <path
          className="external-dependency-paper"
          d="M1.5 2.5H38.5V13.1C38.5 17.4 35.7 20.3 32 20.3C28.4 20.3 26.3 18 25.7 15.2C25.1 19.7 22.3 22.7 18.2 22.7C14.5 22.7 11.9 20.3 11.2 16.8C10.4 20.8 7.8 23.8 3.5 23.8C2.8 23.8 2.1 23.7 1.5 23.5Z"
        />
      </svg>
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
