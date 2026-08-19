import { useState } from 'react';
import './detailPanel.css';
import { STATUS_STYLES, newId } from '../data/theme';
import type { Milestone, MilestoneType, PlanningItem, PlanningItemStatus } from '../domain/types';
import { formatDateShort, snapDateToGrid, TIMELINE_END, TIMELINE_START } from '../data/timelineModel';

interface Props {
  item: PlanningItem;
  items: PlanningItem[];
  onClose: () => void;
  onUpdate: (item: PlanningItem) => void;
  onDelete: (id: string) => void;
  onStartConnect: (fromId: string) => void;
}

const STATUSES: PlanningItemStatus[] = ['planning', 'active', 'complete', 'blocked'];
const MILESTONE_TYPES: MilestoneType[] = ['deadline', 'launch', 'review', 'release'];

export function DetailPanel({ item, items, onClose, onUpdate, onDelete, onStartConnect }: Props) {
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [draftMilestone, setDraftMilestone] = useState<Omit<Milestone, 'id'>>({ title: '', date: item.startDate, type: 'deadline' });

  const patch = (next: Partial<PlanningItem>) => onUpdate({ ...item, ...next });
  const dependencyNames = item.dependencies.map(id => items.find(candidate => candidate.id === id)?.title).filter(Boolean);

  const updateStart = (value: string) => {
    const startDate = snapDateToGrid(value);
    if (startDate < item.endDate) patch({ startDate });
  };

  const updateEnd = (value: string) => {
    const endDate = snapDateToGrid(value);
    if (endDate > item.startDate) patch({ endDate });
  };

  const updateMilestone = (id: string, next: Partial<Milestone>) => patch({ milestones: item.milestones.map(m => m.id === id ? { ...m, ...next } : m) });
  const removeMilestone = (id: string) => patch({ milestones: item.milestones.filter(m => m.id !== id) });

  const addMilestone = () => {
    if (!draftMilestone.title.trim()) return;
    patch({ milestones: [...item.milestones, { id: newId(), title: draftMilestone.title.trim(), date: draftMilestone.date, type: draftMilestone.type }] });
    setDraftMilestone({ title: '', date: item.startDate, type: 'deadline' });
    setAddingMilestone(false);
  };

  return (
    <aside className="detail-panel">
      <div className="panel-head">
        <input className="title-input" value={item.title} onChange={e => patch({ title: e.target.value })} />
        <button onClick={onClose}>×</button>
      </div>

      <div className="panel-body">
        <section>
          <span className="eyebrow">Status</span>
          <div className="status-row">
            {STATUSES.map(status => {
              const style = STATUS_STYLES[status];
              return <button key={status} className={item.status === status ? 'status active' : 'status'} onClick={() => patch({ status })} style={item.status === status ? { background: style.bg, color: style.text } : undefined}>{style.label}</button>;
            })}
          </div>
        </section>

        <section className="two-col">
          <label>Start<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={item.startDate} onChange={e => updateStart(e.target.value)} /></label>
          <label>End<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={item.endDate} onChange={e => updateEnd(e.target.value)} /></label>
        </section>
        <small className="date-hint">Planning items snap to Mondays and month boundaries.</small>

        <section>
          <label>Team<input value={item.team} onChange={e => patch({ team: e.target.value })} /></label>
          <label>Owner<input value={item.owner} onChange={e => patch({ owner: e.target.value })} /></label>
          <label>Description<textarea value={item.description} onChange={e => patch({ description: e.target.value })} /></label>
        </section>

        <section>
          <span className="eyebrow">Dependencies</span>
          <div className="dependency-list">{dependencyNames.length ? dependencyNames.join(' · ') : 'None'}</div>
          <button onClick={() => onStartConnect(item.id)}>Add dependency</button>
        </section>

        <section>
          <div className="panel-section-head">
            <span className="eyebrow">Milestones</span>
            <button type="button" onClick={() => setAddingMilestone(value => !value)}>{addingMilestone ? 'Cancel' : '+ Add milestone'}</button>
          </div>

          {addingMilestone && (
            <div className="milestone-editor-card">
              <label>Title<input value={draftMilestone.title} onChange={e => setDraftMilestone(v => ({ ...v, title: e.target.value }))} placeholder="e.g. Production release" /></label>
              <div className="two-col">
                <label>Date<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={draftMilestone.date} onChange={e => setDraftMilestone(v => ({ ...v, date: e.target.value }))} /></label>
                <label>Type<select value={draftMilestone.type} onChange={e => setDraftMilestone(v => ({ ...v, type: e.target.value as MilestoneType }))}>{MILESTONE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
              </div>
              <button type="button" className="primary" onClick={addMilestone}>Add milestone</button>
            </div>
          )}

          {item.milestones.length === 0 && <div className="dependency-list">None</div>}
          {item.milestones.map(m => (
            <div key={m.id} className="milestone-editor-row">
              <input aria-label="Milestone title" value={m.title} onChange={e => updateMilestone(m.id, { title: e.target.value })} />
              <div className="two-col">
                <label>Date<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={m.date} onChange={e => updateMilestone(m.id, { date: e.target.value })} /></label>
                <label>Type<select value={m.type} onChange={e => updateMilestone(m.id, { type: e.target.value as MilestoneType })}>{MILESTONE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
              </div>
              <div className="milestone-editor-footer">
                <span className="milestone-row">{formatDateShort(m.date)}</span>
                <button type="button" className="danger" onClick={() => removeMilestone(m.id)}>Delete milestone</button>
              </div>
            </div>
          ))}
        </section>

        <button className="danger" onClick={() => onDelete(item.id)}>Delete planning item</button>
      </div>
    </aside>
  );
}
