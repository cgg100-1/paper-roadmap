import { useMemo, useState } from 'react';
import './dataEditor.css';
import { AddModal } from './components/AddModal';
import { DataEditor } from './components/DataEditor';
import { DependencyArrows } from './components/DependencyArrows';
import { DetailPanel } from './components/DetailPanel';
import { MilestonePin } from './components/MilestonePin';
import { WashiBar } from './components/WashiBar';
import { PLANNER_CONFIG } from './config/plannerConfig';
import { MONTH_BAND_COLORS } from './data/theme';
import { buildHierarchyLayout, getDescendantIds } from './domain/hierarchy';
import { movePlanningItem, type TimelineMoveMode } from './domain/timelineInteractions';
import type { PlanningItem } from './domain/types';
import { MONTH_SEGMENTS, TIMELINE_DAYS, WEEK_SEGMENTS } from './data/timelineModel';
import { usePlannerStore } from './state/usePlannerStore';

const DAY_WIDTH = PLANNER_CONFIG.weekWidth / 7;
const HANDLE_W = 9;
const LABEL_WIDTH = PLANNER_CONFIG.labelWidth;
const TIMELINE_WIDTH = TIMELINE_DAYS * DAY_WIDTH;

const rowHeightForDepth = (depth: number) => depth === 0 ? 78 : depth === 1 ? 54 : depth === 2 ? 38 : 30;
const barHeightForDepth = (depth: number) => depth === 0 ? 34 : depth === 1 ? 24 : depth === 2 ? 14 : 8;

type View = 'roadmap' | 'data';

export default function App() {
  const { items, setItems, replaceFromJson, resetToDemo, exportJson } = usePlannerStore();
  const [view, setView] = useState<View>('roadmap');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);

  const selected = items.find(item => item.id === selectedId) ?? null;
  const childCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.parentId) counts.set(item.parentId, (counts.get(item.parentId) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const layout = useMemo(
    () => buildHierarchyLayout(items, new Set(collapsedIds), rowHeightForDepth, barHeightForDepth),
    [items, collapsedIds],
  );

  const update = (next: PlanningItem) => setItems(current => current.map(item => item.id === next.id ? next : item));

  const add = (item: PlanningItem) => setItems(current => [...current, item]);

  const remove = (id: string) => {
    setItems(current => {
      const deleting = getDescendantIds(current, id);
      deleting.add(id);
      return current
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
      setItems(current => current.map(item => item.id === id && !item.dependencies.includes(connectingFrom)
        ? { ...item, dependencies: [...item.dependencies, connectingFrom] }
        : item));
      setConnectingFrom(null);
      return;
    }
    setSelectedId(id);
  };

  const beginPointerMove = (e: React.MouseEvent, id: string, mode: TimelineMoveMode) => {
    e.preventDefault();
    const startX = e.clientX;
    const initial = items.find(item => item.id === id);
    if (!initial) return;

    const move = (ev: MouseEvent) => {
      const deltaDays = Math.round((ev.clientX - startX) / DAY_WIDTH);
      const next = movePlanningItem(initial, deltaDays, mode);
      setItems(current => current.map(item => item.id === id ? next : item));
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
        <div className="brand-block">
          <div>
            <div className="kicker">Planning roadmap · weekly snap</div>
            <h1>Paper Roadmap</h1>
          </div>
          <nav className="view-tabs" aria-label="Planner views">
            <button className={view === 'roadmap' ? 'active' : ''} onClick={() => setView('roadmap')}>Roadmap</button>
            <button className={view === 'data' ? 'active' : ''} onClick={() => { setView('data'); setSelectedId(null); setConnectingFrom(null); }}>Data</button>
          </nav>
        </div>
        <div className="top-actions">
          {view === 'roadmap' && connectingFrom && <button onClick={() => setConnectingFrom(null)}>Cancel dependency</button>}
          {view === 'roadmap' && <button className="primary" onClick={() => setShowAdd(true)}>+ Add item</button>}
        </div>
      </header>

      {view === 'data' ? (
        <main className="workspace data-workspace">
          <DataEditor
            items={items}
            onUpdate={update}
            onDelete={remove}
            onAdd={add}
            onImportJson={replaceFromJson}
            onReset={resetToDemo}
            exportJson={exportJson}
          />
        </main>
      ) : (
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
                items={layout.items.map(({ item, top, height }) => ({ item, top, height }))}
                dayWidth={DAY_WIDTH}
                timelineDays={TIMELINE_DAYS}
                totalHeight={layout.totalHeight}
                offsetLeft={LABEL_WIDTH}
              />

              {layout.items.map(({ item, depth, height, barHeight }) => {
                const hasChildren = (childCount.get(item.id) ?? 0) > 0;
                const isCollapsed = collapsedIds.includes(item.id);
                const hasVisibleChildren = hasChildren && !isCollapsed;
                return (
                  <div className={`initiative-row depth-${Math.min(depth, 3)}${hasVisibleChildren ? ' has-visible-children' : ''}`} key={item.id} style={{ height }}>
                    <div className="row-label" style={{ width: LABEL_WIDTH, paddingLeft: 10 + depth * 17 }}>
                      <button
                        type="button"
                        className={`hierarchy-toggle ${hasChildren ? '' : 'empty'}`}
                        onClick={e => { e.stopPropagation(); if (hasChildren) toggleCollapsed(item.id); }}
                        aria-label={hasChildren ? (isCollapsed ? 'Expand children' : 'Collapse children') : undefined}
                      >{hasChildren ? (isCollapsed ? '▸' : '▾') : '·'}</button>
                      <button className="row-label-main" onClick={e => { e.stopPropagation(); connectOrSelect(item.id); }}>
                        <span className="colour-chip" style={{ background: item.color }} />
                        <span><strong>{item.title}</strong><small>{item.team || (depth === 0 ? 'Initiative' : depth === 1 ? 'Sub-initiative' : depth === 2 ? 'Story' : 'Task')}</small></span>
                      </button>
                    </div>
                    <div className="bar-area" style={{ width: TIMELINE_WIDTH, height }} onClick={e => { e.stopPropagation(); connectOrSelect(item.id); }}>
                      <WashiBar
                        item={item}
                        isSelected={selectedId === item.id}
                        isConnecting={connectingFrom !== null}
                        connectingFrom={connectingFrom}
                        dayWidth={DAY_WIDTH}
                        rowHeight={height}
                        barHeight={barHeight}
                        handleWidth={Math.min(HANDLE_W, Math.max(4, barHeight / 3))}
                        onClick={e => { e.stopPropagation(); connectOrSelect(item.id); }}
                        onDragStart={e => beginPointerMove(e, item.id, 'drag')}
                        onResizeLeft={e => beginPointerMove(e, item.id, 'resize-left')}
                        onResizeRight={e => beginPointerMove(e, item.id, 'resize-right')}
                      />
                      {item.milestones.map(m => <MilestonePin key={m.id} milestone={m} dayWidth={DAY_WIDTH} rowHeight={height} barHeight={barHeight} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selected && <DetailPanel item={selected} items={items} onClose={() => setSelectedId(null)} onUpdate={update} onDelete={remove} onStartConnect={id => setConnectingFrom(id)} />}
        </main>
      )}

      {showAdd && <AddModal existingRows={items.length} items={items} onClose={() => setShowAdd(false)} onAdd={item => { add(item); setShowAdd(false); setSelectedId(item.id); if (item.parentId) setCollapsedIds(ids => ids.filter(id => id !== item.parentId)); }} />}
    </div>
  );
}
