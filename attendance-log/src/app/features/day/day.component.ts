import { Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StudentGroupService } from '../../core/services/student-group.service';
import { StudentService } from '../../core/services/student.service';
import { ScheduleDayService } from '../../core/services/schedule-day.service';
import { AuthService } from '../../core/services/auth.service';
import { TIME_SLOTS } from '../../core/models';

@Component({
  selector: 'app-day',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './day.html',
  styleUrls: ['./day.scss'],
})
export class DayComponent {
  private route = inject(ActivatedRoute);
  private groupsService = inject(StudentGroupService);
  private studentsService = inject(StudentService);
  private schedule = inject(ScheduleDayService);
  private auth = inject(AuthService);

  readonly router = inject(Router);
  readonly times = TIME_SLOTS;
  readonly isAuthenticated = this.auth.isAuthenticated;

  private groupId = this.route.snapshot.paramMap.get('groupId') ?? '';
  readonly date: string = this.route.snapshot.paramMap.get('date') ?? '';

  readonly group = toSignal(this.groupsService.get$(this.groupId), { initialValue: undefined });
  readonly students = toSignal(this.studentsService.listByGroup$(this.groupId), { initialValue: [] });
  readonly day = toSignal(this.schedule.getDay$(this.groupId, this.date), { initialValue: undefined });

  readonly sortedStudents = computed(() =>
    [...this.students()].sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru')),
  );

  readonly enabledTimes = computed(() => this.times.filter((t) => !this.isTimeSlotDisabled(t)));

  isTimeSlotDisabled(timeSlot: string): boolean {
    return !!this.day()?.disabledTimeSlots?.includes(timeSlot);
  }

  isPresent(studentId: string, timeSlot: string): boolean {
    if (this.isTimeSlotDisabled(timeSlot)) {
      return false;
    }
    return !!this.day()?.attendance?.[studentId]?.[timeSlot]?.present;
  }

  getEntry(
    studentId: string,
    timeSlot: string,
  ): { present: boolean; modifiedBy: string; modifiedAt: string } | null {
    return this.day()?.attendance?.[studentId]?.[timeSlot] ?? null;
  }

  tooltip(studentId: string, timeSlot: string): string {
    const e = this.getEntry(studentId, timeSlot);
    if (!e) {
      return '';
    }
    const when = new Date(e.modifiedAt);
    return `Отмечено: ${e.modifiedBy}, ${when.toLocaleString('ru-RU')}`;
  }

  readonly isDayAccounted = computed(() => !!this.day()?.accounted);

  hasNoAttendance(studentId: string): boolean {
    const rec = this.day()?.attendance?.[studentId];
    return !rec || Object.values(rec).every((e) => !e);
  }

  toggle(studentId: string, timeSlot: string): void {
    if (this.isAuthenticated()) {
      this.schedule.toggleAttendance(this.groupId, this.date, studentId, timeSlot);
    }
  }

  rowChecked(studentId: string): boolean {
    const enabled = this.enabledTimes();
    return enabled.length > 0 && enabled.every((t) => this.isPresent(studentId, t));
  }

  rowIndeterminate(studentId: string): boolean {
    const enabled = this.enabledTimes();
    const checked = enabled.filter((t) => this.isPresent(studentId, t)).length;
    return checked > 0 && checked < enabled.length;
  }

  toggleRow(studentId: string): void {
    if (!this.isAuthenticated()) {
      return;
    }
    const enabled = this.enabledTimes();
    this.schedule.setAttendanceForSlots(this.groupId, this.date, studentId, enabled, !this.rowChecked(studentId));
  }

  toggleTimeSlot(timeSlot: string): void {
    if (this.isAuthenticated()) {
      this.schedule.toggleTimeSlot(this.groupId, this.date, timeSlot);
    }
  }
}