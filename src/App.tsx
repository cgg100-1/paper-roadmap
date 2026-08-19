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
const ROW_HEIGHT = 78;
const BAR_HEIGHT = 34;
const HANDLE_W = 9;
const LABEL_WIDTH = 220;
const TIMELINE_WIDTH = TIMELINE_DAYS * DAY_WIDTH;

export default function App() {
  const [initiatives, setInitiatives] = useState<Initiative[]>(INITIAL_TIMELINE_INITIATIVES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const sorted = useMemo(() => [...initiatives].sort((a, b) => a.row - b.row), [initiatives]);
  const selected = initiatives.find(i => i.id === selectedId) ?? null;

  const update = (next: Initiative) => setInitiatives(items => items.map(i => i.id === next.id ? next : i));
  const remove = (id: string) => {
    setInitiatives(items => items.filter(i => i.id !== id).map((i, row) => ({ ...i, row, dependencies: i.dependencies.filter(d => d !== id) })));
    setSelectedId(null);
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
          <button className="primary" onClick={() => setShowAdd(true)}>+ Add initiative</button>
        </div>
      </header>

      <main className="workspace">
        <div className="planner-scroll planner" onClick={() => { setSelectedId(null); if (connectingFrom) setConnectingFrom(null); }}>
          <div className="month-header" style={{ width: LABEL_WIDTH + TIMELINE_WIDTH }}>
            <div className="corner" style={{ width: LABEL_WIDTH }}>Initiative</div>
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

          <div className="rows" style={{ width: LABEL_WIDTH + TIMELINE_WIDTH }}>
            <div className="month-columns" style={{ left: LABEL_WIDTH }}>
              {MONTH_SEGMENTS.map(segment => <div key={segment.key} style={{ width: segment.days * DAY_WIDTH, background: MONTH_BAND_COLORS[segment.monthIndex ?? 0] }} />)}
            </div>
            <div className="week-columns" style={{ left: LABEL_WIDTH }}>
              {WEEK_SEGMENTS.map(segment => <div key={segment.key} style={{ width: segment.days * DAY_WIDTH }} />)}
            </div>

            <DependencyArrows initiatives={sorted} dayWidth={DAY_WIDTH} timelineDays={TIMELINE_DAYS} rowHeight={ROW_HEIGHT} offsetLeft={LABEL_WIDTH} />

            {sorted.map(ini => (
              <div className="initiative-row" key={ini.id} style={{ height: ROW_HEIGHT }}>
                <button className="row-label" style={{ width: LABEL_WIDTH }} onClick={e => { e.stopPropagation(); connectOrSelect(ini.id); }}>
                  <span className="colour-chip" style={{ background: ini.color }} />
                  <span><strong>{ini.title}</strong><small>{ini.team}</small></span>
                </button>
                <div className="bar-area" style={{ width: TIMELINE_WIDTH, height: ROW_HEIGHT }} onClick={e => { e.stopPropagation(); connectOrSelect(ini.id); }}>
                  <WashiBar
                    initiative={ini}
                    isSelected={selectedId === ini.id}
                    isConnecting={connectingFrom !== null}
                    connectingFrom={connectingFrom}
                    dayWidth={DAY_WIDTH}
                    rowHeight={ROW_HEIGHT}
                    barHeight={BAR_HEIGHT}
                    handleWidth={HANDLE_W}
                    onClick={e => { e.stopPropagation(); connectOrSelect(ini.id); }}
                    onDragStart={e => beginPointerMove(e, ini.id, 'drag')}
                    onResizeLeft={e => beginPointerMove(e, ini.id, 'resize-left')}
                    onResizeRight={e => beginPointerMove(e, ini.id, 'resize-right')}
                  />
                  {ini.milestones.map(m => <MilestonePin key={m.id} milestone={m} dayWidth={DAY_WIDTH} rowHeight={ROW_HEIGHT} barHeight={BAR_HEIGHT} />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected && <DetailPanel initiative={selected} initiatives={initiatives} onClose={() => setSelectedId(null)} onUpdate={update} onDelete={remove} onStartConnect={id => setConnectingFrom(id)} />}
      </main>

      {showAdd && <AddModal existingRows={sorted.length} onClose={() => setShowAdd(false)} onAdd={ini => { setInitiatives(items => [...items, ini]); setShowAdd(false); setSelectedId(ini.id); }} />}
    </div>
  );
}
