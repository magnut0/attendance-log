import { Injectable } from '@angular/core';
import { doc, onSnapshot, setDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { db } from './firestore';

const settingsRef = (groupId: string, monthKey: string) =>
  doc(db, `monthSettings/${groupId}_${monthKey}`);

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private db: Firestore = db;

  getSaturdayIsStudyDay$(groupId: string, monthKey: string): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      const ref = settingsRef(groupId, monthKey);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          const value = snap.exists() ? snap.data()['saturdayIsStudyDay'] : undefined;
          subscriber.next(value === undefined ? true : value);
        },
        (err) => subscriber.error(err),
      );
      return unsub;
    });
  }

  setSaturdayIsStudyDay(groupId: string, monthKey: string, value: boolean): Promise<void> {
    return setDoc(settingsRef(groupId, monthKey), { saturdayIsStudyDay: value });
  }

  generateMonthSettingsForGroup(groupId: string, startDate: Date): Promise<void> {
    const batch = writeBatch(this.db);
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    for (let i = 0; i < 96; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      batch.set(settingsRef(groupId, monthKey), { saturdayIsStudyDay: true });
    }
    return batch.commit();
  }
}
