import type { Initiative } from '../data/timelineModel';
import { dateToDayOffset } from '../data/timelineModel';

export interface DependencyLayoutItem {
  initiative: Initiative;
  top: number;
  height: number;
}

interface Props {
  items: DependencyLayoutItem[];
  dayWidth: number;
  timelineDays: number;
  totalHeight: number;
  offsetLeft: number;
}

export function DependencyArrows({ items, dayWidth, timelineDays, totalHeight, offsetLeft }: Props) {
  const svgWidth = timelineDays * dayWidth;
  const byId = new Map(items.map(item => [item.initiative.id, item]));
  const edges: Array<{ from: DependencyLayoutItem; to: DependencyLayoutItem }> = [];

  for (const item of items) {
    for (const depId of item.initiative.dependencies) {
      const dep = byId.get(depId);
      if (dep) edges.push({ from: dep, to: item });
    }
  }

  if (edges.length === 0) return null;
  const barMidY = (item: DependencyLayoutItem) => item.top + item.height / 2;

  return (
    <svg style={{ position: 'absolute', left: offsetLeft, top: 0, pointerEvents: 'none', zIndex: 3, overflow: 'visible' }} width={svgWidth} height={totalHeight + 20}>
      <defs>
        <marker id="dep-arrowhead" markerWidth="7" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 7 3, 0 6" fill="rgba(44,36,24,0.38)" />
        </marker>
      </defs>
      {edges.map(({ from, to }, idx) => {
        const startX = dateToDayOffset(from.initiative.endDate) * dayWidth;
        const startY = barMidY(from);
        const endX = dateToDayOffset(to.initiative.startDate) * dayWidth;
        const endY = barMidY(to);
        let d: string;
        if (endX > startX + 10) {
          const spread = Math.max(36, Math.abs(endX - startX) * 0.38);
          d = `M ${startX} ${startY} C ${startX + spread} ${startY}, ${endX - spread} ${endY}, ${endX} ${endY}`;
        } else {
          const loopX = Math.max(startX, endX) + 28;
          d = `M ${startX} ${startY} C ${loopX} ${startY}, ${loopX} ${endY}, ${endX} ${endY}`;
        }
        return <path key={idx} d={d} fill="none" stroke="rgba(44,36,24,0.28)" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#dep-arrowhead)" />;
      })}
    </svg>
  );
}
