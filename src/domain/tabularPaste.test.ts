import { describe, expect, it } from 'vitest';
import { isRecognisedHeaderRow, normalisePastedDate, normalisePastedStatus, parseClipboardGrid } from './tabularPaste';

describe('tabular paste helpers', () => {
  it('parses tab and newline separated Excel clipboard data', () => {
    expect(parseClipboardGrid('Item\tParent\tStart\r\nChild\tParent A\t01/09/2026\r\n')).toEqual([
      ['Item', 'Parent', 'Start'],
      ['Child', 'Parent A', '01/09/2026'],
    ]);
  });

  it('recognises common table headers', () => {
    expect(isRecognisedHeaderRow(['Item', 'Parent', 'Start', 'End'])).toBe(true);
    expect(isRecognisedHeaderRow(['Platform work', '', '2026-01-01'])).toBe(false);
  });

  it('normalises UK and ISO dates', () => {
    expect(normalisePastedDate('1/9/2026')).toBe('2026-09-01');
    expect(normalisePastedDate('2026-09-01')).toBe('2026-09-01');
    expect(normalisePastedDate('September')).toBeNull();
  });

  it('normalises statuses safely', () => {
    expect(normalisePastedStatus(' Active ')).toBe('active');
    expect(normalisePastedStatus('unknown')).toBeNull();
  });
});
