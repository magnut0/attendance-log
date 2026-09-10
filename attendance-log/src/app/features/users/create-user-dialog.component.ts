import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';

export interface CreateUserResult {
  email: string;
  displayName: string;
  isSuperUser: boolean;
}

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    <h2 mat-dialog-title>Новый пользователь</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Имя (необязательно)</mat-label>
        <input matInput [ngModel]="displayName()" (ngModelChange)="displayName.set($event)" />
      </mat-form-field>
      <mat-checkbox color="primary" [checked]="isSuperUser()" (change)="isSuperUser.set($event.checked)">
        Суперпользователь
      </mat-checkbox>
      @if (!passwordAvailable()) {
        <p class="hint">Для создания потребуется ваш пароль (автоматический возврат сессии).</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ваш текущий пароль</mat-label>
          <input
            matInput
            type="password"
            [ngModel]="adminPassword()"
            (ngModelChange)="adminPassword.set($event)"
            (keydown.enter)="submit()"
          />
        </mat-form-field>
      }
      @if (error()) {
        <div class="error">{{ error() }}</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="loading()" [mat-dialog-close]="null">Отмена</button>
      <button mat-raised-button color="primary" [disabled]="loading()" (click)="submit()">
        @if (loading()) {
          <mat-spinner diameter="16"></mat-spinner>
          Создание…
        } @else {
          Создать
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width {
      width: 100%;
      margin-bottom: 12px;
    }
    .hint {
      color: var(--mat-sys-on-surface-variant, #666);
      font-size: 13px;
      margin: 4px 0;
    }
    .error {
      color: var(--mat-sys-error, #f44336);
      margin-top: 8px;
    }
  `,
})
export class CreateUserDialogComponent {
  private dialogRef = inject(MatDialogRef<CreateUserDialogComponent>);
  private auth = inject(AuthService);

  readonly passwordAvailable = this.auth.passwordAvailable;

  email = signal('');
  displayName = signal('');
  isSuperUser = signal(false);
  adminPassword = signal('');
  error = signal('');
  loading = signal(false);

  async submit(): Promise<void> {
    const email = this.email().trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      this.error.set('Введите корректный email');
      return;
    }
    if (!this.passwordAvailable()) {
      if (!this.adminPassword()) {
        this.error.set('Введите ваш текущий пароль для подтверждения');
        return;
      }
      this.error.set('');
      this.loading.set(true);
      try {
        await this.auth.verifyPassword(this.adminPassword());
      } catch {
        this.error.set('Неверный пароль');
        this.loading.set(false);
        return;
      } finally {
        this.loading.set(false);
      }
    }
    this.dialogRef.close({
      email,
      displayName: this.displayName().trim(),
      isSuperUser: this.isSuperUser(),
    } satisfies CreateUserResult);
  }
}