import { Injectable } from '@angular/core';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, type Firestore, query, where } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Student } from '../models';
import { db } from './firestore';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private db: Firestore = db;

  listByGroup$(groupId: string): Observable<Student[]> {
    return new Observable<Student[]>((subscriber) => {
      const ref = query(collection(this.db, 'students'), where('studentGroupId', '==', groupId));
      const unsub = onSnapshot(
        ref,
        (snap) => {
          const students = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
          subscriber.next(students);
        },
        (err) => subscriber.error(err),
      );
      return unsub;
    });
  }

  create(data: Omit<Student, 'id'>): Promise<string> {
    return addDoc(collection(this.db, 'students'), data as Record<string, unknown>).then((r) => r.id);
  }

  update(id: string, data: Partial<Student>): Promise<void> {
    return updateDoc(doc(this.db, `students/${id}`), data as Record<string, unknown>);
  }

  remove(id: string): Promise<void> {
    return deleteDoc(doc(this.db, `students/${id}`));
  }
}
