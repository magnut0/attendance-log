import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService } from '../../core/services/user-profile.service';

@Component({
  selector: 'app-force-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    <h2 mat-dialog-title>Смена пароля</h2>
    <mat-dialog-content>
      <p class="hint">
        Это ваш первый вход (или пароль был изменён администратором). Задайте новый пароль.
      </p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Новый пароль</mat-label>
        <input
          matInput
          type="password"
          [ngModel]="newPassword()"
          (ngModelChange)="newPassword.set($event)"
        />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Повторите пароль</mat-label>
        <input
          matInput
          type="password"
          [ngModel]="confirmPassword()"
          (ngModelChange)="confirmPassword.set($event)"
          (keydown.enter)="submit()"
        />
      </mat-form-field>
      @if (error()) {
        <div class="error">{{ error() }}</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" [disabled]="loading()" (click)="submit()">
        @if (loading()) {
          <mat-spinner diameter="16"></mat-spinner>
          Сохранение…
        } @else {
          Сохранить пароль
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .hint {
      color: var(--mat-sys-on-surface-variant, #666);
      margin-bottom: 12px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 12px;
    }
    .error {
      color: var(--mat-sys-error, #f44336);
    }
  `,
})
export class ForcePasswordComponent {
  private dialogRef = inject(MatDialogRef<ForcePasswordComponent>);
  private auth = inject(AuthService);
  private profileService = inject(UserProfileService);

  newPassword = signal('');
  confirmPassword = signal('');
  error = signal('');
  loading = signal(false);

  async submit(): Promise<void> {
    const newPw = this.newPassword();
    const confirmPw = this.confirmPassword();
    if (newPw.length < 6) {
      this.error.set('Пароль должен быть не короче 6 символов');
      return;
    }
    if (newPw !== confirmPw) {
      this.error.set('Пароли не совпадают');
      return;
    }
    const uid = this.auth.user()?.uid;
    if (!uid) {
      return;
    }
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.changePasswordWithCurrentSession(newPw);
      await this.profileService.update(uid, { mustChangePassword: false, tempPassword: '' });
      this.dialogRef.close(true);
    } catch {
      this.error.set('Не удалось изменить пароль. Попробуйте ещё раз.');
    } finally {
      this.loading.set(false);
    }
  }
}