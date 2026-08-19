import { useMemo, useState } from 'react';
import { AddModal } from './components/AddModal';
import { DependencyArrows } from './components/DependencyArrows';
import { DetailPanel } from './components/DetailPanel';
import { MilestonePin } from './components/MilestonePin';
import { WashiBar } from './components/WashiBar';
import { INITIAL_INITIATIVES, MONTHS, MONTH_BAND_COLORS, type Initiative } from './data/planningData';

const MONTH_WIDTH = 146;
const ROW_HEIGHT = 78;
const BAR_HEIGHT = 34;
const HANDLE_W = 9;
const LABEL_WIDTH = 220;

export default function App() {
  const [initiatives, setInitiatives] = useState<Initiative[]>(INITIAL_INITIATIVES);
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
      const deltaMonths = Math.round((ev.clientX - startX) / MONTH_WIDTH);
      setInitiatives(items => items.map(i => {
        if (i.id !== id) return i;
        if (mode === 'drag') {
          const duration = initial.endMonth - initial.startMonth;
          const startMonth = Math.max(0, Math.min(11 - duration, initial.startMonth + deltaMonths));
          return { ...i, startMonth, endMonth: startMonth + duration };
        }
        if (mode === 'resize-left') {
          return { ...i, startMonth: Math.max(0, Math.min(initial.endMonth - 1, initial.startMonth + deltaMonths)) };
        }
        return { ...i, endMonth: Math.min(11, Math.max(initial.startMonth + 1, initial.endMonth + deltaMonths)) };
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
          <div className="kicker">12-month planning</div>
          <h1>Paper Roadmap</h1>
        </div>
        <div className="top-actions">
          {connectingFrom && <button onClick={() => setConnectingFrom(null)}>Cancel dependency</button>}
          <button className="primary" onClick={() => setShowAdd(true)}>+ Add initiative</button>
        </div>
      </header>

      <main className="workspace">
        <div className="planner-scroll planner" onClick={() => { setSelectedId(null); if (connectingFrom) setConnectingFrom(null); }}>
          <div className="month-header" style={{ width: LABEL_WIDTH + 12 * MONTH_WIDTH }}>
            <div className="corner" style={{ width: LABEL_WIDTH }}>Initiative</div>
            {MONTHS.map((month, i) => <div className="month" key={month} style={{ width: MONTH_WIDTH, background: MONTH_BAND_COLORS[i] }}>{month}</div>)}
          </div>

          <div className="rows" style={{ width: LABEL_WIDTH + 12 * MONTH_WIDTH }}>
            <div className="month-columns" style={{ left: LABEL_WIDTH }}>
              {MONTHS.map((m, i) => <div key={m} style={{ width: MONTH_WIDTH, background: MONTH_BAND_COLORS[i] }} />)}
            </div>

            <DependencyArrows initiatives={sorted} monthWidth={MONTH_WIDTH} rowHeight={ROW_HEIGHT} barHeight={BAR_HEIGHT} offsetLeft={LABEL_WIDTH} />

            {sorted.map(ini => (
              <div className="initiative-row" key={ini.id} style={{ height: ROW_HEIGHT }}>
                <button className="row-label" style={{ width: LABEL_WIDTH }} onClick={e => { e.stopPropagation(); connectOrSelect(ini.id); }}>
                  <span className="colour-chip" style={{ background: ini.color }} />
                  <span><strong>{ini.title}</strong><small>{ini.team}</small></span>
                </button>
                <div className="bar-area" style={{ width: 12 * MONTH_WIDTH, height: ROW_HEIGHT }} onClick={e => { e.stopPropagation(); connectOrSelect(ini.id); }}>
                  <WashiBar
                    initiative={ini}
                    isSelected={selectedId === ini.id}
                    isConnecting={connectingFrom !== null}
                    connectingFrom={connectingFrom}
                    monthWidth={MONTH_WIDTH}
                    rowHeight={ROW_HEIGHT}
                    barHeight={BAR_HEIGHT}
                    handleWidth={HANDLE_W}
                    onClick={e => { e.stopPropagation(); connectOrSelect(ini.id); }}
                    onDragStart={e => beginPointerMove(e, ini.id, 'drag')}
                    onResizeLeft={e => beginPointerMove(e, ini.id, 'resize-left')}
                    onResizeRight={e => beginPointerMove(e, ini.id, 'resize-right')}
                  />
                  {ini.milestones.map(m => <MilestonePin key={m.id} milestone={m} monthWidth={MONTH_WIDTH} rowHeight={ROW_HEIGHT} barHeight={BAR_HEIGHT} />)}
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
