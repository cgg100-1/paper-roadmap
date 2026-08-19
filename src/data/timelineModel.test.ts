import { describe, expect, it } from 'vitest';
import { MONTH_SEGMENTS, TIMELINE_END, TIMELINE_START, WEEK_SEGMENTS, daysBetween, snapDateToGrid } from './timelineModel';

describe('timeline model', () => {
  it('uses the configured date range', () => {
    expect(TIMELINE_START).toBe('2026-01-01');
    expect(TIMELINE_END).toBe('2027-04-01');
    expect(daysBetween(TIMELINE_START, TIMELINE_END)).toBeGreaterThan(365);
  });

  it('includes 2027 months and denotes January with its year', () => {
    expect(MONTH_SEGMENTS.some(segment => segment.label === 'Jan 2027')).toBe(true);
    expect(MONTH_SEGMENTS.at(-1)?.label).toBe('Mar');
  });

  it('snaps dates to configured week/month boundaries', () => {
    expect(snapDateToGrid('2026-01-06')).toBe('2026-01-05');
    expect(snapDateToGrid('2027-01-02')).toBe('2027-01-01');
  });

  it('covers the full configured timeline with week segments', () => {
    expect(WEEK_SEGMENTS[0].startDate).toBe(TIMELINE_START);
    expect(WEEK_SEGMENTS.at(-1)?.endDate).toBe(TIMELINE_END);
  });
});
