import { Injectable, computed } from '@angular/core';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { auth } from './firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authState$: Observable<User | null> = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(auth, (user) => subscriber.next(user));
  });

  readonly user = toSignal(this.authState$, { initialValue: null });
  readonly isAuthenticated = computed(() => !!this.user());

  login(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(auth, email, password).then(() => undefined);
  }

  register(email: string, password: string): Promise<void> {
    return createUserWithEmailAndPassword(auth, email, password).then(() => undefined);
  }

  logout(): Promise<void> {
    return signOut(auth);
  }
}
