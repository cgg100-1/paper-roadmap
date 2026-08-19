import { useMemo, useState } from 'react';
import { AddModal } from './components/AddModal';
import { DependencyArrows } from './components/DependencyArrows';
import { DetailPanel } from './components/DetailPanel';
import { MilestonePin } from './components/MilestonePin';
import { WashiBar } from './components/WashiBar';
import { MONTH_BAND_COLORS } from './data/planningData';
import {
  addDays,
  daysBetween,
  INITIAL_TIMELINE_INITIATIVES,
  MONTH_SEGMENTS,
  snapDateToGrid,
  TIMELINE_DAYS,
  TIMELINE_END,
  TIMELINE_START,
  WEEK_SEGMENTS,
  type Initiative,
} from './data/timelineModel';

const WEEK_WIDTH = 35;
const DAY_WIDTH = WEEK_WIDTH / 7;
const HANDLE_W = 9;
const LABEL_WIDTH = 220;
const TIMELINE_WIDTH = TIMELINE_DAYS * DAY_WIDTH;

const rowHeightForDepth = (depth: number) => depth === 0 ? 78 : depth === 1 ? 54 : depth === 2 ? 38 : 30;
const barHeightForDepth = (depth: number) => depth === 0 ? 34 : depth === 1 ? 24 : depth === 2 ? 14 : 8;

interface LayoutItem {
  initiative: Initiative;
  depth: number;
  top: number;
  height: number;
  barHeight: number;
}

export default function App() {
  const [initiatives, setInitiatives] = useState<Initiative[]>(INITIAL_TIMELINE_INITIATIVES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);

  const sorted = useMemo(() => [...initiatives].sort((a, b) => a.row - b.row), [initiatives]);
  const selected = initiatives.find(i => i.id === selectedId) ?? null;
  const childCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of initiatives) {
      if (item.parentId) counts.set(item.parentId, (counts.get(item.parentId) ?? 0) + 1);
    }
    return counts;
  }, [initiatives]);

  const layout = useMemo(() => {
    const byParent = new Map<string | null, Initiative[]>();
    const ids = new Set(initiatives.map(item => item.id));
    for (const item of sorted) {
      const parent = item.parentId && ids.has(item.parentId) ? item.parentId : null;
      const siblings = byParent.get(parent) ?? [];
      siblings.push(item);
      byParent.set(parent, siblings);
    }

    const visible: LayoutItem[] = [];
    let top = 0;
    const walk = (parentId: string | null, depth: number) => {
      for (const item of byParent.get(parentId) ?? []) {
        const height = rowHeightForDepth(depth);
        const barHeight = barHeightForDepth(depth);
        visible.push({ initiative: item, depth, top, height, barHeight });
        top += height;
        if (!collapsedIds.includes(item.id)) walk(item.id, depth + 1);
      }
    };
    walk(null, 0);
    return { items: visible, totalHeight: top };
  }, [sorted, initiatives, collapsedIds]);

  const update = (next: Initiative) => setInitiatives(items => items.map(i => i.id === next.id ? next : i));

  const remove = (id: string) => {
    setInitiatives(items => {
      const deleting = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const item of items) {
          if (item.parentId && deleting.has(item.parentId) && !deleting.has(item.id)) {
            deleting.add(item.id);
            changed = true;
          }
        }
      }
      return items
        .filter(item => !deleting.has(item.id))
        .map((item, row) => ({ ...item, row, dependencies: item.dependencies.filter(dep => !deleting.has(dep)) }));
    });
    setSelectedId(null);
  };

  const toggleCollapsed = (id: string) => {
    setCollapsedIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]);
  };

  const connectOrSelect = (id: string) => {
    if (connectingFrom && connectingFrom !== id) {
      setInitiatives(items => items.map(i => i.id === id && !i.dependencies.includes(connectingFrom) ? { ...i, dependencies: [...i.dependencies, connectingFrom] } : i));
      setConnectingFrom(null);
      return;
    }
    setSelectedId(id);
  };

  const beginPointerMove = (e: React.MouseEvent, id: string, mode: 'drag' | 'resize-left' | 'resize-right') => {
    e.preventDefault();
    const startX = e.clientX;
    const initial = initiatives.find(i => i.id === id);
    if (!initial) return;

    const move = (ev: MouseEvent) => {
      const deltaDays = Math.round((ev.clientX - startX) / DAY_WIDTH);
      setInitiatives(items => items.map(i => {
        if (i.id !== id) return i;

        if (mode === 'drag') {
          const duration = daysBetween(initial.startDate, initial.endDate);
          const latestStart = addDays(TIMELINE_END, -duration);
          let target = addDays(initial.startDate, deltaDays);
          if (target < TIMELINE_START) target = TIMELINE_START;
          if (target > latestStart) target = latestStart;
          let startDate = snapDateToGrid(target);
          if (startDate > latestStart) startDate = latestStart;
          return { ...i, startDate, endDate: addDays(startDate, duration) };
        }

        if (mode === 'resize-left') {
          let startDate = snapDateToGrid(addDays(initial.startDate, deltaDays));
          if (startDate < TIMELINE_START) startDate = TIMELINE_START;
          if (startDate >= initial.endDate) return i;
          return { ...i, startDate };
        }

        let endDate = snapDateToGrid(addDays(initial.endDate, deltaDays));
        if (endDate > TIMELINE_END) endDate = TIMELINE_END;
        if (endDate <= initial.startDate) return i;
        return { ...i, endDate };
      }));
    };

    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="kicker">12-month planning · weekly snap</div>
          <h1>Paper Roadmap</h1>
        </div>
        <div className="top-actions">
          {connectingFrom && <button onClick={() => setConnectingFrom(null)}>Cancel dependency</button>}
          <button className="primary" onClick={() => setShowAdd(true)}>+ Add item</button>
        </div>
      </header>

      <main className="workspace">
        <div className="planner-scroll planner" onClick={() => { setSelectedId(null); if (connectingFrom) setConnectingFrom(null); }}>
          <div className="month-header" style={{ width: LABEL_WIDTH + TIMELINE_WIDTH }}>
            <div className="corner" style={{ width: LABEL_WIDTH }}>Planning item</div>
            <div className="timeline-head" style={{ width: TIMELINE_WIDTH }}>
              <div className="month-row">
                {MONTH_SEGMENTS.map(segment => (
                  <div className="month" key={segment.key} style={{ width: segment.days * DAY_WIDTH, background: MONTH_BAND_COLORS[segment.monthIndex ?? 0] }}>{segment.label}</div>
                ))}
              </div>
              <div className="week-row">
                {WEEK_SEGMENTS.map(segment => <div className="week" key={segment.key} style={{ width: segment.days * DAY_WIDTH }}>{segment.label}</div>)}
              </div>
            </div>
          </div>

          <div className="rows" style={{ width: LABEL_WIDTH + TIMELINE_WIDTH, minHeight: layout.totalHeight }}>
            <div className="month-columns" style={{ left: LABEL_WIDTH }}>
              {MONTH_SEGMENTS.map(segment => <div key={segment.key} style={{ width: segment.days * DAY_WIDTH, background: MONTH_BAND_COLORS[segment.monthIndex ?? 0] }} />)}
            </div>
            <div className="week-columns" style={{ left: LABEL_WIDTH }}>
              {WEEK_SEGMENTS.map(segment => <div key={segment.key} style={{ width: segment.days * DAY_WIDTH }} />)}
            </div>

            <DependencyArrows
              items={layout.items.map(({ initiative, top, height }) => ({ initiative, top, height }))}
              dayWidth={DAY_WIDTH}
              timelineDays={TIMELINE_DAYS}
              totalHeight={layout.totalHeight}
              offsetLeft={LABEL_WIDTH}
            />

            {layout.items.map(({ initiative: ini, depth, height, barHeight }) => {
              const hasChildren = (childCount.get(ini.id) ?? 0) > 0;
              const isCollapsed = collapsedIds.includes(ini.id);
              return (
                <div className={`initiative-row depth-${Math.min(depth, 3)}`} key={ini.id} style={{ height }}>
                  <div className="row-label" style={{ width: LABEL_WIDTH, paddingLeft: 10 + depth * 17 }}>
                    <button
                      type="button"
                      className={`hierarchy-toggle ${hasChildren ? '' : 'empty'}`}
                      onClick={e => { e.stopPropagation(); if (hasChildren) toggleCollapsed(ini.id); }}
                      aria-label={hasChildren ? (isCollapsed ? 'Expand children' : 'Collapse children') : undefined}
                    >{hasChildren ? (isCollapsed ? '▸' : '▾') : '·'}</button>
                    <button className="row-label-main" onClick={e => { e.stopPropagation(); connectOrSelect(ini.id); }}>
                      <span className="colour-chip" style={{ background: ini.color }} />
                      <span><strong>{ini.title}</strong><small>{ini.team || (depth === 0 ? 'Initiative' : depth === 1 ? 'Sub-initiative' : depth === 2 ? 'Story' : 'Task')}</small></span>
                    </button>
                  </div>
                  <div className="bar-area" style={{ width: TIMELINE_WIDTH, height }} onClick={e => { e.stopPropagation(); connectOrSelect(ini.id); }}>
                    <WashiBar
                      initiative={ini}
                      isSelected={selectedId === ini.id}
                      isConnecting={connectingFrom !== null}
                      connectingFrom={connectingFrom}
                      dayWidth={DAY_WIDTH}
                      rowHeight={height}
                      barHeight={barHeight}
                      handleWidth={Math.min(HANDLE_W, Math.max(4, barHeight / 3))}
                      onClick={e => { e.stopPropagation(); connectOrSelect(ini.id); }}
                      onDragStart={e => beginPointerMove(e, ini.id, 'drag')}
                      onResizeLeft={e => beginPointerMove(e, ini.id, 'resize-left')}
                      onResizeRight={e => beginPointerMove(e, ini.id, 'resize-right')}
                    />
                    {ini.milestones.map(m => <MilestonePin key={m.id} milestone={m} dayWidth={DAY_WIDTH} rowHeight={height} barHeight={barHeight} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selected && <DetailPanel initiative={selected} initiatives={initiatives} onClose={() => setSelectedId(null)} onUpdate={update} onDelete={remove} onStartConnect={id => setConnectingFrom(id)} />}
      </main>

      {showAdd && <AddModal existingRows={initiatives.length} initiatives={initiatives} onClose={() => setShowAdd(false)} onAdd={ini => { setInitiatives(items => [...items, ini]); setShowAdd(false); setSelectedId(ini.id); if (ini.parentId) setCollapsedIds(ids => ids.filter(id => id !== ini.parentId)); }} />}
    </div>
  );
}
