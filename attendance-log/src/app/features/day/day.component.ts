import { Component, inject, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentGroupService } from '../../core/services/student-group.service';
import { StudentService } from '../../core/services/student.service';
import { ScheduleDayService } from '../../core/services/schedule-day.service';
import type { PendingAttendance } from '../../core/services/schedule-day.service';
import { AuthService } from '../../core/services/auth.service';
import { TIME_SLOTS } from '../../core/models';
import type { ScheduleDay } from '../../core/models';

type PendingEntry = { present: boolean; modifiedBy: string; modifiedAt: string };

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
    MatSnackBarModule,
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
  private snackBar = inject(MatSnackBar);

  readonly router = inject(Router);
  readonly times = TIME_SLOTS;
  readonly isAuthenticated = this.auth.isAuthenticated;

  private groupId = this.route.snapshot.paramMap.get('groupId') ?? '';
  readonly date: string = this.route.snapshot.paramMap.get('date') ?? '';

  readonly group = toSignal(this.groupsService.get$(this.groupId), { initialValue: undefined });
  readonly students = toSignal(this.studentsService.listByGroup$(this.groupId), { initialValue: [] });
  readonly day = signal<ScheduleDay | undefined>(undefined);

  constructor() {
    this.schedule
      .getDay$(this.groupId, this.date)
      .subscribe((d) => this.day.set(d));
  }

  readonly sortedStudents = computed(() =>
    [...this.students()].sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru')),
  );

  readonly pendingAttendance = signal<PendingAttendance>(new Map());
  readonly pendingDisabledSlots = signal<Set<string>>(new Set());
  readonly isSaving = signal(false);

  readonly hasPendingChanges = computed(
    () => this.pendingAttendance().size > 0 || this.pendingDisabledSlots().size > 0,
  );

  readonly enabledTimes = computed(() =>
    this.times.filter((t) => !this.slotDisabled(t)),
  );

  readonly slotDisabled = (timeSlot: string): boolean => {
    const pending = this.pendingDisabledSlots();
    if (pending.has(timeSlot)) {
      return !this.day()?.disabledTimeSlots?.includes(timeSlot);
    }
    return !!this.day()?.disabledTimeSlots?.includes(timeSlot);
  };

  private getPendingValue(studentId: string, timeSlot: string): boolean {
    const pending = this.pendingAttendance();
    if (pending.has(studentId) && pending.get(studentId)!.has(timeSlot)) {
      return !!pending.get(studentId)!.get(timeSlot);
    }
    return !!this.day()?.attendance?.[studentId]?.[timeSlot]?.present;
  }

  readonly isPresent = (studentId: string, timeSlot: string): boolean => {
    if (this.slotDisabled(timeSlot)) {
      return false;
    }
    return this.getPendingValue(studentId, timeSlot);
  };

  getEntry(
    studentId: string,
    timeSlot: string,
  ): { present: boolean; modifiedBy: string; modifiedAt: string } | null {
    if (this.slotDisabled(timeSlot)) {
      return null;
    }
    const pending = this.pendingAttendance();
    if (pending.has(studentId) && pending.get(studentId)!.has(timeSlot)) {
      return pending.get(studentId)!.get(timeSlot) ?? null;
    }
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
    if (!this.isAuthenticated()) {
      return;
    }
    const pending = this.pendingAttendance();
    const current = this.isPresent(studentId, timeSlot);
    const newEntry: PendingEntry | null = current
      ? null
      : {
          present: true,
          modifiedBy: this.auth.user()?.email ?? 'unknown',
          modifiedAt: new Date().toISOString(),
        };
    const studentMap = new Map(pending.get(studentId) ?? []);
    studentMap.set(timeSlot, newEntry);
    const next = new Map(pending);
    next.set(studentId, studentMap);
    this.pendingAttendance.set(next);
  }

  rowChecked(studentId: string): boolean {
    const enabled = this.enabledTimes();
    return enabled.length > 0 && enabled.every((t) => this.getPendingValue(studentId, t));
  }

  toggleRow(studentId: string): void {
    if (!this.isAuthenticated()) {
      return;
    }
    const all = this.times;
    const checked = this.rowChecked(studentId);
    const pending = this.pendingAttendance();
    const studentMap = new Map(pending.get(studentId) ?? []);
    const now = new Date().toISOString();
    const user = this.auth.user()?.email ?? 'unknown';
    all.forEach((ts) => {
      studentMap.set(ts, checked ? null : { present: true, modifiedBy: user, modifiedAt: now });
    });
    const next = new Map(pending);
    next.set(studentId, studentMap);
    this.pendingAttendance.set(next);
  }

  toggleTimeSlot(timeSlot: string): void {
    if (!this.isAuthenticated()) {
      return;
    }
    const pending = this.pendingDisabledSlots();
    const next = new Set(pending);
    if (next.has(timeSlot)) {
      next.delete(timeSlot);
    } else {
      next.add(timeSlot);
    }
    this.pendingDisabledSlots.set(next);
  }

  async save(): Promise<void> {
    if (this.isSaving()) {
      return;
    }
    this.isSaving.set(true);
    const attendanceMap = this.pendingAttendance();
    const changed = this.pendingDisabledSlots();
    const hasDisabledChanges = changed.size > 0;
    const baseDisabled = this.day()?.disabledTimeSlots ?? [];
    const finalDisabled = this.times.filter((t) => {
      const base = baseDisabled.includes(t);
      if (changed.has(t)) {
        return !base;
      }
      return base;
    });
    try {
      await this.schedule.saveAll(this.groupId, this.date, attendanceMap, finalDisabled, hasDisabledChanges);
      this.pendingAttendance.set(new Map());
      this.pendingDisabledSlots.set(new Set());
      this.applySavedState(finalDisabled, attendanceMap);
      await this.refreshDay();
      this.snackBar.open('Данные сохранены', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('save failed:', err);
      this.snackBar.open('Ошибка сохранения', 'OK', { duration: 3000 });
    } finally {
      this.isSaving.set(false);
    }
  }

  private applySavedState(finalDisabled: string[], attendanceMap: PendingAttendance): void {
    const current = this.day();
    if (!current) {
      return;
    }
    const mergedAttendance = { ...(current.attendance ?? {}) };
    attendanceMap.forEach((slots, studentId) => {
      const rec = { ...(mergedAttendance[studentId] ?? {}) };
      slots.forEach((entry, ts) => {
        if (entry) rec[ts] = entry;
        else delete rec[ts];
      });
      mergedAttendance[studentId] = rec;
    });
    this.day.set({
      ...current,
      disabledTimeSlots: finalDisabled,
      attendance: mergedAttendance,
    });
  }

  private async refreshDay(): Promise<void> {
    try {
      const fresh = await this.schedule.fetchDay(this.groupId, this.date);
      if (!fresh) {
        return;
      }
      const justSaved = this.day()?.disabledTimeSlots ?? [];
      if (this.isStale(fresh.disabledTimeSlots ?? [], justSaved)) {
        return;
      }
      this.day.set(fresh);
    } catch (err) {
      console.error('refreshDay failed:', err);
    }
  }

  private isStale(incoming: string[], saved: string[]): boolean {
    const savedSet = new Set(saved);
    return incoming.some((t) => !savedSet.has(t));
  }
}
