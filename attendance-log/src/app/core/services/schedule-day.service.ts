import { Injectable } from '@angular/core';
import { doc, onSnapshot, setDoc, updateDoc, writeBatch, query, collection, where, getDoc, type Firestore } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { ScheduleDay, AttendanceEntry, AttendanceRecord, DayFlags } from '../models';
import { db } from './firestore';
import { AuthService } from './auth.service';

const dayRef = (groupId: string, date: string) =>
  doc(db, `scheduleDays/${groupId}_${date}`);

@Injectable({ providedIn: 'root' })
export class ScheduleDayService {
  constructor(private auth: AuthService) {}

  listDaysForGroupAndMonth$(groupId: string, month: Date): Observable<Map<string, DayFlags>> {
    const start = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
    const end = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-31`;
    return new Observable<Map<string, DayFlags>>((subscriber) => {
      const ref = query(
        collection(db, 'scheduleDays'),
        where('studentGroupId', '==', groupId),
        where('date', '>=', start),
        where('date', '<=', end),
      );
      const unsub = onSnapshot(
        ref,
        (snap) => {
          const map = new Map<string, DayFlags>();
          snap.docs.forEach((d) => {
            const data = d.data();
            map.set(data['date'], {
              accounted: Boolean(data['accounted']),
              transferred: Boolean(data['transferred']),
            });
          });
          subscriber.next(map);
        },
        (err) => subscriber.error(err),
      );
      return unsub;
    });
  }

  getDay$(groupId: string, date: string): Observable<ScheduleDay | undefined> {
    return new Observable<ScheduleDay | undefined>((subscriber) => {
      const unsub = onSnapshot(
        dayRef(groupId, date),
        (snap) => {
          if (!snap.exists()) {
            subscriber.next(undefined);
            return;
          }
          subscriber.next({ id: snap.id, ...snap.data() } as ScheduleDay);
        },
        (err) => subscriber.error(err),
      );
      return unsub;
    });
  }

  private async initDay(groupId: string, date: string): Promise<void> {
    const ref = dayRef(groupId, date);
    await setDoc(ref, {
      studentGroupId: groupId,
      date,
      accounted: false,
      transferred: false,
      attendance: {},
    });
  }

  async toggleAttendance(groupId: string, date: string, studentId: string, timeSlot: string): Promise<void> {
    const ref = dayRef(groupId, date);
    const snap = await getDoc(ref).catch(() => null);
    if (!snap || !snap.exists()) {
      await this.initDay(groupId, date);
    }
    const docSnap = await getDoc(ref);
    const data = docSnap.data() as ScheduleDay;
    const attendance = data?.attendance ?? {};
    const studentRec = attendance[studentId] ?? {};

    const existing: AttendanceEntry | null = studentRec[timeSlot] ?? null;
    const newEntry: AttendanceEntry | null = existing
      ? null
      : {
          present: true,
          modifiedBy: this.auth.user()?.email ?? 'unknown',
          modifiedAt: new Date().toISOString(),
        };

    const updatedStudentRec = { ...studentRec };
    if (newEntry) {
      updatedStudentRec[timeSlot] = newEntry;
    } else {
      delete updatedStudentRec[timeSlot];
    }

    const updatedAttendance = { ...attendance, [studentId]: updatedStudentRec };

    const hasAny = Object.values(updatedAttendance).some((studentRec) =>
      studentRec && Object.values(studentRec as AttendanceRecord).some((e) => !!e),
    );

    await setDoc(
      ref,
      {
        studentGroupId: groupId,
        date,
        accounted: hasAny,
        transferred: data?.transferred ?? false,
        attendance: updatedAttendance,
      },
      { merge: true },
    );
  }

  async toggleAccounted(groupId: string, date: string): Promise<void> {
    const ref = dayRef(groupId, date);
    const snap = await getDoc(ref).catch(() => null);
    const accounted = snap && snap.exists() ? Boolean(snap.data()['accounted']) : false;
    if (!snap || !snap.exists()) {
      await this.initDay(groupId, date);
    }
    await updateDoc(ref, { accounted: !accounted });
  }

  async toggleTransferred(groupId: string, date: string): Promise<void> {
    const ref = dayRef(groupId, date);
    const snap = await getDoc(ref).catch(() => null);
    const transferred = snap && snap.exists() ? Boolean(snap.data()['transferred']) : false;
    if (!snap || !snap.exists()) {
      await this.initDay(groupId, date);
    }
    await updateDoc(ref, { transferred: !transferred });
  }

  async markAll(
    groupId: string,
    monthStart: Date,
    flagType: 'accounted' | 'transferred',
    saturdayIsStudyDay: boolean,
  ): Promise<void> {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const batch = writeBatch(db);

    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month, d).getDay();
      if (dayOfWeek === 0 || (dayOfWeek === 6 && !saturdayIsStudyDay)) {
        continue;
      }
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const ref = dayRef(groupId, dateStr);
      batch.set(ref, { [flagType]: true }, { merge: true });
    }

    await batch.commit();
  }
}
