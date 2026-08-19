import type { Initiative } from '../data/planningData';
import { dateToDayOffset } from '../data/planningData';

interface Props {
  initiatives: Initiative[];
  dayWidth: number;
  timelineDays: number;
  rowHeight: number;
  offsetLeft: number;
}

export function DependencyArrows({ initiatives, dayWidth, timelineDays, rowHeight, offsetLeft }: Props) {
  const totalRows = initiatives.reduce((max, i) => Math.max(max, i.row), 0) + 1;
  const svgHeight = totalRows * rowHeight + 40;
  const svgWidth = timelineDays * dayWidth;
  const byId = new Map(initiatives.map(i => [i.id, i]));
  const edges: Array<{ from: Initiative; to: Initiative }> = [];

  for (const ini of initiatives) {
    for (const depId of ini.dependencies) {
      const dep = byId.get(depId);
      if (dep) edges.push({ from: dep, to: ini });
    }
  }

  if (edges.length === 0) return null;
  const barMidY = (row: number) => row * rowHeight + rowHeight / 2;

  return (
    <svg style={{ position: 'absolute', left: offsetLeft, top: 0, pointerEvents: 'none', zIndex: 3, overflow: 'visible' }} width={svgWidth} height={svgHeight}>
      <defs>
        <marker id="dep-arrowhead" markerWidth="7" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 7 3, 0 6" fill="rgba(44,36,24,0.38)" />
        </marker>
      </defs>
      {edges.map(({ from, to }, idx) => {
        const startX = dateToDayOffset(from.endDate) * dayWidth;
        const startY = barMidY(from.row);
        const endX = dateToDayOffset(to.startDate) * dayWidth;
        const endY = barMidY(to.row);
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
