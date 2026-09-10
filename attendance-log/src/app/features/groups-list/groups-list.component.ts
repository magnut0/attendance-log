import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { StudentGroupService } from '../../core/services/student-group.service';

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
  ],
  templateUrl: './groups-list.html',
  styleUrls: ['./groups-list.scss'],
})
export class GroupsListComponent {
  private groupsService = inject(StudentGroupService);
  private router = inject(Router);

  readonly groups = toSignal(this.groupsService.list$(), { initialValue: [] });

  addGroup(): void {
    this.router.navigate(['/group/new']);
  }

  editGroup(id: string): void {
    this.router.navigate(['/group', id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
