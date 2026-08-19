import { STATUS_STYLES, type InitiativeStatus } from '../data/planningData';
import type { Initiative } from '../data/timelineModel';
import { formatDateShort, snapDateToGrid, TIMELINE_END, TIMELINE_START } from '../data/timelineModel';

interface Props {
  initiative: Initiative;
  initiatives: Initiative[];
  onClose: () => void;
  onUpdate: (ini: Initiative) => void;
  onDelete: (id: string) => void;
  onStartConnect: (fromId: string) => void;
}

const STATUSES: InitiativeStatus[] = ['planning', 'active', 'complete', 'blocked'];

export function DetailPanel({ initiative, initiatives, onClose, onUpdate, onDelete, onStartConnect }: Props) {
  const patch = (next: Partial<Initiative>) => onUpdate({ ...initiative, ...next });
  const dependencyNames = initiative.dependencies
    .map(id => initiatives.find(i => i.id === id)?.title)
    .filter(Boolean);

  const updateStart = (value: string) => {
    const startDate = snapDateToGrid(value);
    if (startDate < initiative.endDate) patch({ startDate });
  };

  const updateEnd = (value: string) => {
    const endDate = snapDateToGrid(value);
    if (endDate > initiative.startDate) patch({ endDate });
  };

  return (
    <aside className="detail-panel">
      <div className="panel-head">
        <input className="title-input" value={initiative.title} onChange={e => patch({ title: e.target.value })} />
        <button onClick={onClose}>×</button>
      </div>

      <div className="panel-body">
        <section>
          <span className="eyebrow">Status</span>
          <div className="status-row">
            {STATUSES.map(status => {
              const style = STATUS_STYLES[status];
              return <button key={status} className={initiative.status === status ? 'status active' : 'status'} onClick={() => patch({ status })} style={initiative.status === status ? { background: style.bg, color: style.text } : undefined}>{style.label}</button>;
            })}
          </div>
        </section>

        <section className="two-col">
          <label>Start<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={initiative.startDate} onChange={e => updateStart(e.target.value)} /></label>
          <label>End<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={initiative.endDate} onChange={e => updateEnd(e.target.value)} /></label>
        </section>
        <small className="date-hint">Initiatives snap to Mondays and month boundaries.</small>

        <section>
          <label>Team<input value={initiative.team} onChange={e => patch({ team: e.target.value })} /></label>
          <label>Owner<input value={initiative.owner} onChange={e => patch({ owner: e.target.value })} /></label>
          <label>Description<textarea value={initiative.description} onChange={e => patch({ description: e.target.value })} /></label>
        </section>

        <section>
          <span className="eyebrow">Dependencies</span>
          <div className="dependency-list">{dependencyNames.length ? dependencyNames.join(' · ') : 'None'}</div>
          <button onClick={() => onStartConnect(initiative.id)}>Add dependency</button>
        </section>

        <section>
          <span className="eyebrow">Milestones</span>
          {initiative.milestones.map(m => <div key={m.id} className="milestone-row"><span>{m.title}</span><span>{formatDateShort(m.date)}</span></div>)}
        </section>

        <button className="danger" onClick={() => onDelete(initiative.id)}>Delete initiative</button>
      </div>
    </aside>
  );
}
