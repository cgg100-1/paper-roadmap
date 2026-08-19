import { useMemo, useRef, useState } from 'react';
import { buildHierarchyLayout, getDescendantIds } from '../domain/hierarchy';
import type { PlanningItem, PlanningItemStatus } from '../domain/types';
import { WASHI_PALETTE, newId } from '../data/theme';
import { TIMELINE_END, TIMELINE_START } from '../data/timelineModel';

interface Props {
  items: PlanningItem[];
  onUpdate: (item: PlanningItem) => void;
  onDelete: (id: string) => void;
  onAdd: (item: PlanningItem) => void;
  onImportJson: (text: string) => void;
  onReset: () => void;
  exportJson: () => string;
}

const STATUSES: PlanningItemStatus[] = ['planning', 'active', 'complete', 'blocked'];
const noopSize = () => 1;

export function DataEditor({ items, onUpdate, onDelete, onAdd, onImportJson, onReset, exportJson }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const rows = useMemo(() => buildHierarchyLayout(items, new Set(), noopSize, noopSize).items, [items]);

  const patch = (item: PlanningItem, next: Partial<PlanningItem>) => onUpdate({ ...item, ...next });

  const addBlank = () => {
    const palette = WASHI_PALETTE[items.length % WASHI_PALETTE.length];
    onAdd({
      id: newId(), title: 'New planning item', team: '', owner: '', description: '',
      color: palette.bg, textColor: palette.text, startDate: TIMELINE_START, endDate: TIMELINE_END,
      row: items.length, parentId: null, dependencies: [], milestones: [], status: 'planning',
    });
  };

  const downloadJson = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'paper-roadmap.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('JSON exported');
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      onImportJson(await file.text());
      setMessage('JSON imported');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not import this file.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const reset = () => {
    if (!window.confirm('Reset this browser back to the demo roadmap? Your saved local edits will be replaced.')) return;
    onReset();
    setMessage('Reset to demo data');
  };

  return (
    <section className="data-page">
      <div className="data-rainbow-strip" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
      </div>

      <div className="data-page-head">
        <div>
          <div className="kicker">Same roadmap · editable data</div>
          <h2>Planner data</h2>
          <p>Every row below is the same item you see on the roadmap. Changes save automatically in this browser.</p>
        </div>
        <div className="data-actions">
          <button className="primary" onClick={addBlank}>+ Add row</button>
          <button onClick={downloadJson}>Export JSON</button>
          <button onClick={() => fileInput.current?.click()}>Import JSON</button>
          <button className="danger" onClick={reset}>Reset demo</button>
          <input ref={fileInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={event => importFile(event.target.files?.[0])} />
        </div>
      </div>

      {message && <div className="data-message" role="status">{message}<button onClick={() => setMessage(null)}>×</button></div>}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th><th>Parent</th><th>Start</th><th>End</th><th>Team</th><th>Owner</th><th>Status</th><th>Deps</th><th>Milestones</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, depth }) => {
              const descendants = getDescendantIds(items, item.id);
              const parentOptions = items.filter(candidate => candidate.id !== item.id && !descendants.has(candidate.id));
              return (
                <tr key={item.id}>
                  <td className="data-title-cell">
                    <span className="data-indent" style={{ width: depth * 16 }} />
                    <span className="data-dot" style={{ background: item.color }} />
                    <input value={item.title} onChange={event => patch(item, { title: event.target.value })} />
                  </td>
                  <td>
                    <select value={item.parentId ?? ''} onChange={event => patch(item, { parentId: event.target.value || null })}>
                      <option value="">Top level</option>
                      {parentOptions.map(parent => <option key={parent.id} value={parent.id}>{parent.title}</option>)}
                    </select>
                  </td>
                  <td><input type="date" min={TIMELINE_START} max={TIMELINE_END} value={item.startDate} onChange={event => patch(item, { startDate: event.target.value })} /></td>
                  <td><input type="date" min={TIMELINE_START} max={TIMELINE_END} value={item.endDate} onChange={event => patch(item, { endDate: event.target.value })} /></td>
                  <td><input value={item.team} onChange={event => patch(item, { team: event.target.value })} /></td>
                  <td><input value={item.owner} onChange={event => patch(item, { owner: event.target.value })} /></td>
                  <td><select value={item.status} onChange={event => patch(item, { status: event.target.value as PlanningItemStatus })}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></td>
                  <td className="data-count">{item.dependencies.length || '—'}</td>
                  <td className="data-count">{item.milestones.length || '—'}</td>
                  <td><button className="data-delete" aria-label={`Delete ${item.title}`} onClick={() => onDelete(item.id)}>×</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="data-footnote">IDs, dependency IDs and milestone details remain part of the exported JSON; the table keeps the everyday editing surface deliberately human-readable.</div>
    </section>
  );
}
