import { useMemo, useRef, useState } from 'react';
import { buildHierarchyLayout, getDescendantIds } from '../domain/hierarchy';
import type { PlanningItem, PlanningItemStatus } from '../domain/types';
import {
  EDITABLE_TABLE_COLUMNS,
  isRecognisedHeaderRow,
  normalisePastedDate,
  normalisePastedStatus,
  parseClipboardGrid,
} from '../domain/tabularPaste';
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
  const [showExcelPaste, setShowExcelPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const rows = useMemo(() => buildHierarchyLayout(items, new Set(), noopSize, noopSize).items, [items]);
  const pastePreview = useMemo(() => {
    const parsed = parseClipboardGrid(pasteText);
    return isRecognisedHeaderRow(parsed[0] ?? []) ? parsed.slice(1) : parsed;
  }, [pasteText]);

  const patch = (item: PlanningItem, next: Partial<PlanningItem>) => onUpdate({ ...item, ...next });

  const makeBlank = (row: number): PlanningItem => {
    const palette = WASHI_PALETTE[row % WASHI_PALETTE.length];
    return {
      id: newId(), title: 'New planning item', team: '', owner: '', description: '',
      color: palette.bg, textColor: palette.text, startDate: TIMELINE_START, endDate: TIMELINE_END,
      row, parentId: null, dependencies: [], milestones: [], status: 'planning',
    };
  };

  const addBlank = () => onAdd(makeBlank(items.length));

  const applyGridPaste = (matrix: string[][], startRow: number, startColumn: number) => {
    if (!matrix.length) return;
    const ordered = rows.map(row => row.item);
    const existingIds = new Set(items.map(item => item.id));
    const working = ordered.map(item => ({ ...item }));
    const requiredRows = startRow + matrix.length;
    while (working.length < requiredRows) working.push(makeBlank(working.length));

    const unresolvedParents: Array<{ itemId: string; value: string }> = [];

    matrix.forEach((cells, rowOffset) => {
      const target = working[startRow + rowOffset];
      if (!target) return;

      cells.forEach((rawValue, columnOffset) => {
        const column = EDITABLE_TABLE_COLUMNS[startColumn + columnOffset];
        if (!column) return;

        if (column === 'title') target.title = rawValue || target.title;
        if (column === 'team') target.team = rawValue;
        if (column === 'owner') target.owner = rawValue;
        if (column === 'startDate') {
          const date = normalisePastedDate(rawValue);
          if (date && date >= TIMELINE_START && date <= TIMELINE_END) target.startDate = date;
        }
        if (column === 'endDate') {
          const date = normalisePastedDate(rawValue);
          if (date && date >= TIMELINE_START && date <= TIMELINE_END) target.endDate = date;
        }
        if (column === 'status') {
          const status = normalisePastedStatus(rawValue);
          if (status) target.status = status;
        }
        if (column === 'parent') unresolvedParents.push({ itemId: target.id, value: rawValue });
      });
    });

    const titleToId = new Map(working.map(item => [item.title.trim().toLowerCase(), item.id]));
    const unresolvedNames: string[] = [];
    unresolvedParents.forEach(({ itemId, value }) => {
      const target = working.find(item => item.id === itemId);
      if (!target) return;
      if (!value.trim()) {
        target.parentId = null;
        return;
      }
      const parentId = titleToId.get(value.trim().toLowerCase());
      if (parentId && parentId !== itemId) target.parentId = parentId;
      else unresolvedNames.push(value.trim());
    });

    let changed = 0;
    working.forEach(item => {
      if (existingIds.has(item.id)) {
        const original = items.find(existing => existing.id === item.id);
        if (original && JSON.stringify(original) !== JSON.stringify(item)) {
          onUpdate(item);
          changed += 1;
        }
      } else {
        onAdd(item);
        changed += 1;
      }
    });

    const parentNote = unresolvedNames.length ? ` ${unresolvedNames.length} parent name${unresolvedNames.length === 1 ? '' : 's'} could not be matched.` : '';
    setMessage(`Pasted into ${changed} row${changed === 1 ? '' : 's'}.${parentNote}`);
  };

  const handleCellPaste = (event: React.ClipboardEvent, rowIndex: number, columnIndex: number) => {
    const text = event.clipboardData.getData('text/plain');
    if (!text.includes('\t') && !/[\r\n]/.test(text)) return;
    event.preventDefault();
    applyGridPaste(parseClipboardGrid(text), rowIndex, columnIndex);
  };

  const applyExcelPaste = () => {
    if (!pastePreview.length) {
      setMessage('Nothing to paste');
      return;
    }
    applyGridPaste(pastePreview, rows.length, 0);
    setPasteText('');
    setShowExcelPaste(false);
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
          <p>Every row below is the same item you see on the roadmap. Changes save automatically in this browser. You can also paste rectangular ranges straight from Excel.</p>
        </div>
        <div className="data-actions">
          <button className="primary" onClick={addBlank}>+ Add row</button>
          <button onClick={() => setShowExcelPaste(true)}>Paste from Excel</button>
          <button onClick={downloadJson}>Export JSON</button>
          <button onClick={() => fileInput.current?.click()}>Import JSON</button>
          <button className="danger" onClick={reset}>Reset demo</button>
          <input ref={fileInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={event => importFile(event.target.files?.[0])} />
        </div>
      </div>

      {message && <div className="data-message" role="status">{message}<button onClick={() => setMessage(null)}>×</button></div>}

      <div className="data-paste-hint">Copy a block in Excel, click the first matching cell below, then paste. Multi-row and multi-column ranges will fill across the table.</div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th><th>Parent</th><th>Start</th><th>End</th><th>Team</th><th>Owner</th><th>Status</th><th>Deps</th><th>Milestones</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, depth }, rowIndex) => {
              const descendants = getDescendantIds(items, item.id);
              const parentOptions = items.filter(candidate => candidate.id !== item.id && !descendants.has(candidate.id));
              return (
                <tr key={item.id}>
                  <td className="data-title-cell" onPaste={event => handleCellPaste(event, rowIndex, 0)}>
                    <span className="data-indent" style={{ width: depth * 16 }} />
                    <span className="data-dot" style={{ background: item.color }} />
                    <input value={item.title} onChange={event => patch(item, { title: event.target.value })} />
                  </td>
                  <td onPaste={event => handleCellPaste(event, rowIndex, 1)}>
                    <select value={item.parentId ?? ''} onChange={event => patch(item, { parentId: event.target.value || null })}>
                      <option value="">Top level</option>
                      {parentOptions.map(parent => <option key={parent.id} value={parent.id}>{parent.title}</option>)}
                    </select>
                  </td>
                  <td onPaste={event => handleCellPaste(event, rowIndex, 2)}><input type="date" min={TIMELINE_START} max={TIMELINE_END} value={item.startDate} onChange={event => patch(item, { startDate: event.target.value })} /></td>
                  <td onPaste={event => handleCellPaste(event, rowIndex, 3)}><input type="date" min={TIMELINE_START} max={TIMELINE_END} value={item.endDate} onChange={event => patch(item, { endDate: event.target.value })} /></td>
                  <td onPaste={event => handleCellPaste(event, rowIndex, 4)}><input value={item.team} onChange={event => patch(item, { team: event.target.value })} /></td>
                  <td onPaste={event => handleCellPaste(event, rowIndex, 5)}><input value={item.owner} onChange={event => patch(item, { owner: event.target.value })} /></td>
                  <td onPaste={event => handleCellPaste(event, rowIndex, 6)}><select value={item.status} onChange={event => patch(item, { status: event.target.value as PlanningItemStatus })}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></td>
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

      {showExcelPaste && (
        <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setShowExcelPaste(false)}>
          <div className="modal-card excel-paste-card">
            <div>
              <div className="kicker">Bulk add</div>
              <h2>Paste from Excel</h2>
              <p>Paste rows in this order: Item, Parent, Start, End, Team, Owner, Status. A header row is optional. Parent names are matched to item titles, including rows in the same paste.</p>
            </div>
            <textarea
              className="excel-paste-area"
              value={pasteText}
              onChange={event => setPasteText(event.target.value)}
              placeholder={'Item\tParent\tStart\tEnd\tTeam\tOwner\tStatus\nOnline feature serving\tML Feature Store\t01/09/2026\t30/09/2026\tML Platform\tRavi Patel\tactive'}
              autoFocus
            />
            {pastePreview.length > 0 && (
              <div className="excel-preview-wrap">
                <div className="excel-preview-title">Preview · {pastePreview.length} row{pastePreview.length === 1 ? '' : 's'}</div>
                <table className="excel-preview-table">
                  <tbody>
                    {pastePreview.slice(0, 6).map((row, index) => <tr key={index}>{row.slice(0, 7).map((cell, cellIndex) => <td key={cellIndex}>{cell || '—'}</td>)}</tr>)}
                  </tbody>
                </table>
                {pastePreview.length > 6 && <div className="excel-preview-more">+ {pastePreview.length - 6} more rows</div>}
              </div>
            )}
            <div className="actions">
              <button className="primary" type="button" onClick={applyExcelPaste} disabled={!pastePreview.length}>Add pasted rows</button>
              <button type="button" onClick={() => setShowExcelPaste(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
