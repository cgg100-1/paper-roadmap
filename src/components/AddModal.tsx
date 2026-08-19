import { useState } from 'react';
import { WASHI_PALETTE, newId, type InitiativeStatus } from '../data/planningData';
import type { Initiative } from '../data/timelineModel';
import { TIMELINE_END, TIMELINE_START, snapDateToGrid } from '../data/timelineModel';

interface Props {
  onAdd: (ini: Initiative) => void;
  onClose: () => void;
  existingRows: number;
  initiatives: Initiative[];
}

export function AddModal({ onAdd, onClose, existingRows, initiatives }: Props) {
  const [form, setForm] = useState({
    title: '', team: '', owner: '', startDate: '2026-01-01', endDate: '2026-04-01', parentId: '' as string,
    color: WASHI_PALETTE[0].bg, textColor: WASHI_PALETTE[0].text,
    status: 'planning' as InitiativeStatus, description: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const startDate = snapDateToGrid(form.startDate);
    const endDate = snapDateToGrid(form.endDate);
    if (endDate <= startDate) return;
    const { parentId, ...rest } = form;
    onAdd({ id: newId(), ...rest, startDate, endDate, parentId: parentId || null, row: existingRows, dependencies: [], milestones: [] });
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <form className="modal-card" onSubmit={submit}>
        <h2>New planning item</h2>
        <label>Title<input value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))} autoFocus required /></label>
        <label>Parent<select value={form.parentId} onChange={e => setForm(v => ({ ...v, parentId: e.target.value }))}>
          <option value="">None — top-level initiative</option>
          {[...initiatives].sort((a, b) => a.row - b.row).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select></label>
        <small className="date-hint">Choose a parent to create a sub-initiative, story or deeper task.</small>
        <div className="two-col">
          <label>Team<input value={form.team} onChange={e => setForm(v => ({ ...v, team: e.target.value }))} /></label>
          <label>Owner<input value={form.owner} onChange={e => setForm(v => ({ ...v, owner: e.target.value }))} /></label>
        </div>
        <div className="two-col">
          <label>Start<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={form.startDate} onChange={e => setForm(v => ({ ...v, startDate: e.target.value }))} /></label>
          <label>End<input type="date" min={TIMELINE_START} max={TIMELINE_END} value={form.endDate} onChange={e => setForm(v => ({ ...v, endDate: e.target.value }))} /></label>
        </div>
        <small className="date-hint">Dates snap to the nearest Monday or month boundary.</small>
        <label>Colour<div className="palette">{WASHI_PALETTE.map(p => <button key={p.bg} type="button" className={form.color === p.bg ? 'swatch selected' : 'swatch'} style={{ background: p.bg }} onClick={() => setForm(v => ({ ...v, color: p.bg, textColor: p.text }))} />)}</div></label>
        <label>Description<textarea value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} /></label>
        <div className="actions"><button type="submit" className="primary">Add to planner</button><button type="button" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  );
}
