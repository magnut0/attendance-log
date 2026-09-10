import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { StudentGroupService } from '../../../core/services/student-group.service';
import { ConfirmDialogComponent } from '../../../core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users-details',
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
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './users-details.html',
  styleUrls: ['./users-details.scss'],
})
export class UsersDetailsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private groupsService = inject(StudentGroupService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  readonly uid = this.route.snapshot.paramMap.get('id') ?? '';

  readonly profile = toSignal(this.userProfileService.get$(this.uid), { initialValue: undefined });
  readonly allGroups = toSignal(this.groupsService.list$(), { initialValue: [] });
  readonly selectedGroupId = signal('');

  readonly displayName = computed(
    () => this.profile()?.displayName || this.profile()?.email || '',
  );
  readonly email = computed(() => this.profile()?.email ?? '');
  readonly isSuperUser = computed(() => this.profile()?.isSuperUser ?? false);
  readonly tempPassword = computed(() => this.profile()?.tempPassword ?? '');
  readonly photoUrl = computed(() => this.profile()?.photoUrl ?? '');
  readonly avatarInitial = computed(() => {
    const name = this.displayName();
    return name ? name.charAt(0).toUpperCase() : '?';
  });
  readonly myGroups = computed(() => {
    const ids = this.profile()?.groupIds ?? [];
    return this.allGroups().filter((g) => ids.includes(g.id));
  });
  readonly availableGroups = computed(() => {
    const ids = new Set(this.profile()?.groupIds ?? []);
    return this.allGroups().filter((g) => !ids.has(g.id));
  });

  goBack(): void {
    this.router.navigate(['/users']);
  }

  async assignGroup(): Promise<void> {
    const gid = this.selectedGroupId();
    if (!gid || !this.uid) {
      return;
    }
    try {
      await this.userProfileService.assignGroup(this.uid, gid);
      this.selectedGroupId.set('');
    } catch {
      this.snackbar.open('Не удалось назначить группу', '', { duration: 3000 });
    }
  }

  async unassignGroup(groupId: string): Promise<void> {
    if (!this.uid) {
      return;
    }
    try {
      await this.userProfileService.unassignGroup(this.uid, groupId);
    } catch {
      this.snackbar.open('Не удалось отвязать группу', '', { duration: 3000 });
    }
  }

  async toggleRole(): Promise<void> {
    const current = this.isSuperUser();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Смена роли',
        message: current
          ? 'Сделать пользователя обычным?'
          : 'Сделать пользователя суперпользователем?',
        confirmLabel: current ? 'Сделать пользователем' : 'Сделать суперпользователем',
        danger: false,
      },
    });
    const ok = await dialogRef.afterClosed().toPromise();
    if (ok && this.uid) {
      try {
        await this.userProfileService.update(this.uid, { isSuperUser: !current });
        this.snackbar.open('Роль обновлена', '', { duration: 3000 });
      } catch {
        this.snackbar.open('Не удалось обновить роль', '', { duration: 3000 });
      }
    }
  }

  async copyTempPassword(): Promise<void> {
    const tp = this.tempPassword();
    if (!tp) {
      return;
    }
    try {
      await navigator.clipboard.writeText(tp);
      this.snackbar.open('Временный пароль скопирован', '', { duration: 2000 });
    } catch {
      this.snackbar.open('Не удалось скопировать', '', { duration: 2000 });
    }
  }
}