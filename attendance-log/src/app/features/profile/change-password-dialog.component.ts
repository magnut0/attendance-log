import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Изменение пароля</h2>
    <mat-dialog-content>
      <form #pwForm="ngForm" (submit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Старый пароль</mat-label>
          <input
            matInput
            type="password"
            required
            [ngModel]="oldPassword()"
            name="oldPassword"
            (ngModelChange)="oldPassword.set($event)"
          />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Новый пароль</mat-label>
          <input
            matInput
            type="password"
            required
            minlength="6"
            [ngModel]="newPassword()"
            name="newPassword"
            (ngModelChange)="newPassword.set($event)"
          />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Повторите новый пароль</mat-label>
          <input
            matInput
            type="password"
            required
            minlength="6"
            [ngModel]="confirmPassword()"
            name="confirmPassword"
            (ngModelChange)="confirmPassword.set($event)"
          />
        </mat-form-field>
        @if (error()) {
          <div class="error">{{ error() }}</div>
        }
        <mat-dialog-actions align="end">
          <button mat-button type="button" [disabled]="loading()" [mat-dialog-close]="false">Отмена</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading() || pwForm.invalid">
            {{ loading() ? 'Сохранение…' : 'Изменить пароль' }}
          </button>
        </mat-dialog-actions>
      </form>
    </mat-dialog-content>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
        margin-bottom: 8px;
      }
      .error {
        color: var(--mat-sys-error, #f44336);
        margin: 8px 0;
      }
    `,
  ],
})
export class ChangePasswordDialogComponent {
  private auth = inject(AuthService);
  private dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private snackbar = inject(MatSnackBar);

  readonly oldPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly error = signal('');
  readonly loading = signal(false);

  async submit(): Promise<void> {
    this.error.set('');
    if (!this.oldPassword()) {
      this.error.set('Введите старый пароль');
      return;
    }
    if (this.newPassword().length < 6) {
      this.error.set('Новый пароль должен быть не короче 6 символов');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Новый пароль и подтверждение не совпадают');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.changePassword(this.oldPassword(), this.newPassword());
      this.snackbar.open('Пароль изменён', '', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (e) {
      this.error.set(this.mapError(e));
    } finally {
      this.loading.set(false);
    }
  }

  private mapError(e: unknown): string {
    const code = (e as { code?: string })?.code ?? '';
    switch (code) {
      case 'auth/wrong-password':
        return 'Неверный старый пароль';
      case 'auth/weak-password':
        return 'Новый пароль слишком слабый';
      case 'auth/requires-recent-login':
        return 'Требуется повторный вход. Выйдите и войдите снова.';
      case 'auth/too-many-requests':
        return 'Слишком много попыток. Попробуйте позже.';
      default:
        return 'Не удалось изменить пароль. Проверьте данные и попробуйте ещё раз.';
    }
  }
}