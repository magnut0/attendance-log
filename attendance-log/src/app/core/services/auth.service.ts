import { Injectable, inject, computed, signal } from '@angular/core';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, switchMap, of, map, take } from 'rxjs';
import { auth } from './firestore';
import { UserProfileService } from './user-profile.service';
import type { UserProfile } from '../models';

interface CreateUserParams {
  email: string;
  tempPassword: string;
  displayName?: string;
  isSuperUser?: boolean;
}

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

  /** Флаг «идёт переключение сессии» (создание пользователя). */
  readonly operationInProgress = signal(false);

  private sessionPassword = signal<string | null>(null);
  readonly passwordAvailable = computed(() => !!this.sessionPassword());

  setSessionPassword(password: string): void {
    this.sessionPassword.set(password);
  }

  /** Проверяет текущий пароль пользователя (для подтверждения операций). */
  async verifyPassword(password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error('Пользователь не авторизован');
    }
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    this.sessionPassword.set(password);
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
    this.sessionPassword.set(password);
  }

  logout(): Promise<void> {
    this.sessionPassword.set(null);
    return signOut(auth);
  }

  /**
   * Создаёт пользователя с временным паролем клиентски:
   * 1) createUserWithEmailAndPassword переключает сессию на нового пользователя;
   * 2) восстанавливаем сессию админа по сохранённому в памяти паролю;
   * 3) создаём профиль (супер-пользователь).
   */
  async createUserWithTempPassword(params: CreateUserParams): Promise<void> {
    const adminEmail = auth.currentUser?.email;
    const adminPassword = this.sessionPassword();
    if (!adminEmail || !adminPassword) {
      throw new Error('Для создания пользователя требуется ваш пароль. Повторите вход.');
    }
    const cred = await createUserWithEmailAndPassword(auth, params.email, params.tempPassword);
    const newUid = cred.user.uid;
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    await this.profileService.create({
      uid: newUid,
      email: params.email,
      isSuperUser: params.isSuperUser ?? false,
      groupIds: [],
      displayName: params.displayName,
      mustChangePassword: true,
      tempPassword: params.tempPassword,
    });
  }

  /** Смена пароля от текущей сессии (без повторной аутентификации). */
  async changePasswordWithCurrentSession(newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }
    await updatePassword(user, newPassword);
    this.sessionPassword.set(newPassword);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error('Пользователь не авторизован');
    }
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    this.sessionPassword.set(newPassword);
  }

  resetPasswordByEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(auth, email);
  }
}
