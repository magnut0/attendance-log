import { DayFlags } from '../../core/models';

export interface CalendarDay {
  number: number;
  date: string;
  enabled: boolean;
  isSunday: boolean;
  isSaturday: boolean;
  isPast: boolean;
  isToday: boolean;
  accounted: boolean;
  transferred: boolean;
}

export function buildCalendarWeeks(
  year: number,
  month: number,
  flags: Map<string, DayFlags>,
  saturdayIsStudyDay: boolean,
  today: Date = new Date(),
): (CalendarDay | null)[][] {
  const first = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (CalendarDay | null)[] = [];
  for (let i = 0; i < first; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    const enabled = !isSunday && !(isSaturday && !saturdayIsStudyDay);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const flag = flags.get(dateStr);
    cells.push({
      number: d,
      date: dateStr,
      enabled,
      isSunday,
      isSaturday,
      isPast: date < todayStart,
      isToday: date.getTime() === todayStart.getTime(),
      accounted: flag?.accounted ?? false,
      transferred: flag?.transferred ?? false,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}