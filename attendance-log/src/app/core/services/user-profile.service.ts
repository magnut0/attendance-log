import { Injectable } from '@angular/core';
import { doc, onSnapshot, setDoc, updateDoc, query, collection, where, getDocs, arrayUnion, arrayRemove, type Firestore } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { UserProfile } from '../models';
import { db } from './firestore';

const userRef = (uid: string) => doc(db, `users/${uid}`);

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private db: Firestore = db;

  get$(uid: string): Observable<UserProfile | undefined> {
    return new Observable<UserProfile | undefined>((subscriber) => {
      const unsub = onSnapshot(
        userRef(uid),
        (snap) => {
          if (!snap.exists()) {
            subscriber.next(undefined);
            return;
          }
          subscriber.next({ uid: snap.id, ...snap.data() } as UserProfile);
        },
        (err) => subscriber.error(err),
      );
      return unsub;
    });
  }

  create(profile: UserProfile): Promise<void> {
    return setDoc(userRef(profile.uid), {
      email: profile.email,
      isSuperUser: profile.isSuperUser,
      groupIds: profile.groupIds,
    });
  }

  getByGroup$(groupId: string): Observable<UserProfile[]> {
    return new Observable<UserProfile[]>((subscriber) => {
      const ref = query(collection(this.db, 'users'), where('groupIds', 'array-contains', groupId));
      const unsub = onSnapshot(
        ref,
        (snap) => {
          const profiles = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
          subscriber.next(profiles);
        },
        (err) => subscriber.error(err),
      );
      return unsub;
    });
  }

  getAllUsers$(): Observable<UserProfile[]> {
    return new Observable<UserProfile[]>((subscriber) => {
      const ref = collection(this.db, 'users');
      const unsub = onSnapshot(
        ref,
        (snap) => {
          const profiles = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
          subscriber.next(profiles);
        },
        (err) => subscriber.error(err),
      );
      return unsub;
    });
  }

  assignGroup(uid: string, groupId: string): Promise<void> {
    return updateDoc(userRef(uid), { groupIds: arrayUnion(groupId) });
  }

  unassignGroup(uid: string, groupId: string): Promise<void> {
    return updateDoc(userRef(uid), { groupIds: arrayRemove(groupId) });
  }

  update(uid: string, data: Partial<Omit<UserProfile, 'uid'>>): Promise<void> {
    return updateDoc(userRef(uid), data as Record<string, unknown>);
  }
}
