import type { Initiative, InitiativeStatus } from '../data/planningData';
import { MONTHS, STATUS_STYLES } from '../data/planningData';

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
          <label>Start<select value={initiative.startMonth} onChange={e => patch({ startMonth: Number(e.target.value) })}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></label>
          <label>End<select value={initiative.endMonth} onChange={e => patch({ endMonth: Number(e.target.value) })}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></label>
        </section>

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
          {initiative.milestones.map(m => <div key={m.id} className="milestone-row"><span>{m.title}</span><span>{MONTHS[m.month]}</span></div>)}
        </section>

        <button className="danger" onClick={() => onDelete(initiative.id)}>Delete initiative</button>
      </div>
    </aside>
  );
}
