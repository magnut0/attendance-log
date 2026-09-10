import { Injectable, inject, computed, signal } from '@angular/core';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, reauthenticateWithCredential, updatePassword, EmailAuthProvider, type User } from 'firebase/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, switchMap, of, map, take } from 'rxjs';
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

  readonly ready$ = this.authState$.pipe(map(() => true), take(1));

  readonly profile$ = this.authState$.pipe(
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

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error('Пользователь не авторизован');
    }
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }
}
