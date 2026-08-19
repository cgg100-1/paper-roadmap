import { useState } from 'react';
import { STATUS_STYLES, newId, type InitiativeStatus, type MilestoneType } from '../data/planningData';
import type { Initiative, Milestone } from '../data/timelineModel';
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
const MILESTONE_TYPES: MilestoneType[] = ['deadline', 'launch', 'review', 'release'];

export function DetailPanel({ initiative, initiatives, onClose, onUpdate, onDelete, onStartConnect }: Props) {
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [draftMilestone, setDraftMilestone] = useState<Omit<Milestone, 'id'>>({
    title: '',
    date: initiative.startDate,
    type: 'deadline',
  });

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

  const updateMilestone = (id: string, next: Partial<Milestone>) => {
    patch({ milestones: initiative.milestones.map(m => m.id === id ? { ...m, ...next } : m) });
  };

  const removeMilestone = (id: string) => {
    patch({ milestones: initiative.milestones.filter(m => m.id !== id) });
  };

  const addMilestone = () => {
    if (!draftMilestone.title.trim()) return;
    patch({
      milestones: [
        ...initiative.milestones,
        {
          id: newId(),
          title: draftMilestone.title.trim(),
          date: draftMilestone.date,
          type: draftMilestone.type,
        },
      ],
    });
    setDraftMilestone({ title: '', date: initiative.startDate, type: 'deadline' });
    setAddingMilestone(false);
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span className="eyebrow">Milestones</span>
            <button type="button" onClick={() => setAddingMilestone(value => !value)}>{addingMilestone ? 'Cancel' : '+ Add milestone'}</button>
          </div>

          {addingMilestone && (
            <div style={{ display: 'grid', gap: 8, padding: 10, border: '1px solid rgba(44,36,24,.12)', borderRadius: 8, background: '#fff8' }}>
              <label>Title<input value={draftMilestone.title} onChange={e => setDraftMilestone(v => ({ ...v, title: e.target.value }))} placeholder="e.g. Production release" /></label>
              <div className="two-col">
                <label>Date<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={draftMilestone.date} onChange={e => setDraftMilestone(v => ({ ...v, date: e.target.value }))} /></label>
                <label>Type<select value={draftMilestone.type} onChange={e => setDraftMilestone(v => ({ ...v, type: e.target.value as MilestoneType }))}>{MILESTONE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
              </div>
              <button type="button" className="primary" onClick={addMilestone}>Add milestone</button>
            </div>
          )}

          {initiative.milestones.length === 0 && <div className="dependency-list">None</div>}

          {initiative.milestones.map(m => (
            <div key={m.id} style={{ display: 'grid', gap: 7, padding: '9px 0', borderBottom: '1px solid rgba(44,36,24,.08)' }}>
              <input aria-label="Milestone title" value={m.title} onChange={e => updateMilestone(m.id, { title: e.target.value })} />
              <div className="two-col">
                <label>Date<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={m.date} onChange={e => updateMilestone(m.id, { date: e.target.value })} /></label>
                <label>Type<select value={m.type} onChange={e => updateMilestone(m.id, { type: e.target.value as MilestoneType })}>{MILESTONE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="milestone-row">{formatDateShort(m.date)}</span>
                <button type="button" className="danger" onClick={() => removeMilestone(m.id)}>Delete milestone</button>
              </div>
            </div>
          ))}
        </section>

        <button className="danger" onClick={() => onDelete(initiative.id)}>Delete initiative</button>
      </div>
    </aside>
  );
}
