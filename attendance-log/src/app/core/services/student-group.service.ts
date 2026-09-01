import { Injectable } from '@angular/core';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { StudentGroup } from '../models';
import { db } from './firestore';

@Injectable({ providedIn: 'root' })
export class StudentGroupService {
  private db: Firestore = db;

  list$(): Observable<StudentGroup[]> {
    return new Observable<StudentGroup[]>((subscriber) => {
      const ref = collection(this.db, 'studentGroups');
      const unsub = onSnapshot(
        ref,
        (snap) => {
          const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StudentGroup));
          subscriber.next(groups);
        },
        (err) => subscriber.error(err),
      );
      return unsub;
    });
  }

  get$(id: string): Observable<StudentGroup | undefined> {
    return new Observable<StudentGroup | undefined>((subscriber) => {
      const ref = doc(this.db, `studentGroups/${id}`);
      const unsub = onSnapshot(
        ref,
        (snap) => subscriber.next(snap.exists() ? ({ id: snap.id, ...snap.data() } as StudentGroup) : undefined),
        (err) => subscriber.error(err),
      );
      return unsub;
    });
  }

  create(name: string, studentIds: string[] = []): Promise<string> {
    return addDoc(collection(this.db, 'studentGroups'), {
      name,
      studentIds,
    }).then((ref) => ref.id);
  }

  update(id: string, data: Partial<StudentGroup>): Promise<void> {
    return updateDoc(doc(this.db, `studentGroups/${id}`), data as Record<string, unknown>);
  }

  remove(id: string): Promise<void> {
    return deleteDoc(doc(this.db, `studentGroups/${id}`));
  }
}
