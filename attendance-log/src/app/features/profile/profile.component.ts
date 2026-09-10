import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { StudentGroupService } from '../../core/services/student-group.service';
import { AvatarService } from '../../core/services/avatar.service';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private profileService = inject(UserProfileService);
  private groupsService = inject(StudentGroupService);
  private avatarService = inject(AvatarService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);

  readonly allGroups = toSignal(this.groupsService.list$(), { initialValue: [] });

  readonly profile = this.authService.profile;
  readonly isSuperUser = this.authService.isSuperUser;

  readonly displayName = computed(
    () => this.profile()?.displayName || this.profile()?.email || '',
  );
  readonly email = computed(() => this.profile()?.email ?? '');
  readonly photoUrl = computed(() => this.profile()?.photoUrl ?? '');
  readonly avatarInitial = computed(() => {
    const name = this.displayName();
    return name ? name.charAt(0).toUpperCase() : '?';
  });
  readonly myGroups = computed(() => {
    const ids = this.authService.userGroupIds();
    return this.allGroups().filter((g) => ids.includes(g.id));
  });

  readonly editingName = signal(false);
  readonly nameInput = signal('');

  readonly uploadingAvatar = signal(false);
  readonly avatarError = signal('');

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    const p = this.profile();
    if (!p) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.avatarError.set('Выберите файл изображения');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.avatarError.set('Изображение не должно превышать 5 МБ');
      return;
    }
    this.avatarError.set('');
    this.uploadingAvatar.set(true);
    try {
      await this.avatarService.uploadAvatar(p.uid, file);
      this.snackbar.open('Аватар обновлён', '', { duration: 3000 });
    } catch {
      this.avatarError.set('Не удалось загрузить изображение. Попробуйте ещё раз.');
    } finally {
      this.uploadingAvatar.set(false);
    }
  }

  async removeAvatar(): Promise<void> {
    const p = this.profile();
    if (!p || !p.photoUrl) {
      return;
    }
    this.uploadingAvatar.set(true);
    try {
      await this.profileService.update(p.uid, { photoUrl: '' });
      this.snackbar.open('Аватар удалён', '', { duration: 3000 });
    } catch {
      this.avatarError.set('Не удалось удалить аватар. Попробуйте ещё раз.');
    } finally {
      this.uploadingAvatar.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  startEditName(): void {
    this.nameInput.set(this.displayName());
    this.editingName.set(true);
  }

  cancelEditName(): void {
    this.editingName.set(false);
  }

  async saveName(): Promise<void> {
    const p = this.profile();
    const value = this.nameInput().trim();
    if (!p || !value) {
      return;
    }
    await this.profileService.update(p.uid, { displayName: value });
    this.editingName.set(false);
    this.snackbar.open('Имя обновлено', '', { duration: 3000 });
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent);
  }
}