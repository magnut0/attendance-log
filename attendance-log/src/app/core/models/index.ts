export interface Student {
  id: string;
  studentGroupId: string;
  firstName: string;
  lastName: string;
  patronymic: string;
}

export interface StudentGroup {
  id: string;
  name: string;
  studentIds: string[];
}

export interface AttendanceEntry {
  present: boolean;
  modifiedBy: string;
  modifiedAt: string; // ISO string
}

export interface AttendanceRecord {
  [timeSlot: string]: AttendanceEntry | null;
}

export interface ScheduleDay {
  id: string;
  studentGroupId: string;
  date: string; // YYYY-MM-DD
  accounted: boolean;
  transferred: boolean;
  disabledTimeSlots?: string[]; // время, когда занятий не было
  attendance: {
    [studentId: string]: AttendanceRecord;
  };
}

export interface MonthSettings {
  id: string;
  groupId: string;
  monthKey: string; // YYYY-MM
  saturdayIsStudyDay: boolean;
}

export const TIME_SLOTS = ['8:30', '10:15', '12:10', '14:00', '15:45'] as const;

export interface DayFlags {
  accounted: boolean;
  transferred: boolean;
}
