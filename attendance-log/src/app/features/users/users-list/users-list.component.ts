import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { AdminUserService } from '../admin-user.service';
import { CreateUserDialogComponent } from '../create-user-dialog.component';
import { TempPasswordDialogComponent } from '../temp-password-dialog.component';
import type { UserProfile } from '../../../core/models';
import type { CreateUserResult } from '../create-user-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './users-list.html',
  styleUrls: ['./users-list.scss'],
})
export class UsersListComponent {
  private userProfileService = inject(UserProfileService);
  private adminService = inject(AdminUserService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  readonly users = toSignal(this.userProfileService.getAllUsers$(), { initialValue: [] });

  readonly creating = signal(false);

  displayNameOf(u: UserProfile): string {
    return u.displayName || u.email;
  }

  initialOf(u: UserProfile): string {
    const name = this.displayNameOf(u);
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  openUser(id: string): void {
    this.router.navigate(['/users', id]);
  }

  async addUser(): Promise<void> {
    const ref = this.dialog.open(CreateUserDialogComponent, { width: '440px' });
    const data = (await ref.afterClosed().toPromise()) as CreateUserResult | null;
    if (!data) {
      return;
    }
    this.creating.set(true);
    try {
      const tempPassword = await this.adminService.createUser(data);
      this.dialog.open(TempPasswordDialogComponent, {
        data: { email: data.email, tempPassword },
        disableClose: true,
      });
    } catch {
      this.snackbar.open('Не удалось создать пользователя', '', { duration: 3000 });
    } finally {
      this.creating.set(false);
    }
  }
}