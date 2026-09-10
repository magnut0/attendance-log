import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface TempPasswordData {
  email: string;
  tempPassword: string;
}

@Component({
  selector: 'app-temp-password-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Пользователь создан</h2>
    <mat-dialog-content>
      <p>Временный пароль для <strong>{{ data.email }}</strong>:</p>
      <div class="temp-password">{{ data.tempPassword }}</div>
      <p class="hint">
        Пользователь войдёт по этому паролю и должен будет сразу задать новый.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="copy()">
        <mat-icon>content_copy</mat-icon>
        Скопировать
      </button>
      <button mat-button [mat-dialog-close]="true">Готово</button>
    </mat-dialog-actions>
  `,
  styles: `
    .temp-password {
      font-family: 'Roboto Mono', 'Consolas', monospace;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 1px;
      text-align: center;
      padding: 12px;
      margin: 8px 0;
      border: 1px dashed var(--mat-sys-outline-variant, #bbb);
      border-radius: 8px;
      background: var(--mat-sys-surface-container, #eee);
    }
    .hint {
      color: var(--mat-sys-on-surface-variant, #666);
      font-size: 13px;
    }
  `,
})
export class TempPasswordDialogComponent {
  private dialogRef = inject(MatDialogRef<TempPasswordDialogComponent>);
  private snackbar = inject(MatSnackBar);
  data = inject<TempPasswordData>(MAT_DIALOG_DATA);

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.data.tempPassword);
      this.snackbar.open('Временный пароль скопирован', '', { duration: 2000 });
    } catch {
      this.snackbar.open('Не удалось скопировать', '', { duration: 2000 });
    }
  }
}