import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StudentGroupService } from '../../core/services/student-group.service';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule,
  ],
  templateUrl: './groups-list.html',
  styleUrls: ['./groups-list.scss'],
})
export class GroupsListComponent {
  private groupsService = inject(StudentGroupService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  readonly groups = toSignal(this.groupsService.list$(), { initialValue: [] });

  addGroup(): void {
    this.router.navigate(['/group/new']);
  }

  editGroup(id: string): void {
    this.router.navigate(['/group', id, 'edit']);
  }

  async deleteGroup(id: string, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent);
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      await this.groupsService.remove(id);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
