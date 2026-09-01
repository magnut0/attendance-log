import { describe, it, expect } from 'vitest';
import { buildCalendarWeeks } from './calendar';

describe('buildCalendarWeeks', () => {
  it('aligns September 2026 (1st is Tuesday) with a leading placeholder', () => {
    const weeks = buildCalendarWeeks(2026, 8, new Map(), true, new Date(2026, 8, 15));
    expect(weeks[0][0]).toBeNull();
    expect(weeks[0][1]?.number).toBe(1);
    expect(weeks[0][1]?.date).toBe('2026-09-01');
  });

  it('marks Sunday and inactive Saturday as disabled', () => {
    const weeks = buildCalendarWeeks(2026, 8, new Map(), false, new Date(2026, 8, 15));
    const sundayIndex = weeks[0].findIndex((d) => d?.date === '2026-09-06');
    expect(weeks[0][sundayIndex]?.isSunday).toBe(true);
    expect(weeks[0][sundayIndex]?.enabled).toBe(false);
    const saturdayIndex = weeks[0].findIndex((d) => d?.date === '2026-09-05');
    expect(weeks[0][saturdayIndex]?.isSaturday).toBe(true);
    expect(weeks[0][saturdayIndex]?.enabled).toBe(false);
  });
});