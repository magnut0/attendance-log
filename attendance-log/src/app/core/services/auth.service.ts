import { Injectable, inject, computed, signal } from '@angular/core';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, switchMap, of } from 'rxjs';
import { auth } from './firestore';
import { UserProfileService } from './user-profile.service';
import type { UserProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private profileService = inject(UserProfileService);

  private authState$: Observable<User | null> = new Observable<User | null>((subscriber) => {
    return onAuthStateChanged(auth, (user) => subscriber.next(user));
  });

  readonly user = toSignal(this.authState$, { initialValue: null });
  readonly isAuthenticated = computed(() => !!this.user());

  private profile$ = this.authState$.pipe(
    switchMap((user) => (user ? this.profileService.get$(user.uid) : of(undefined))),
  );

  readonly profile = toSignal(this.profile$, { initialValue: undefined });
  readonly isSuperUser = computed(() => this.profile()?.isSuperUser ?? false);
  readonly userGroupIds = computed(() => this.profile()?.groupIds ?? []);

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async register(email: string, password: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await this.profileService.create({
      uid: cred.user.uid,
      email,
      isSuperUser: false,
      groupIds: [],
    });
  }

  logout(): Promise<void> {
    return signOut(auth);
  }
}
