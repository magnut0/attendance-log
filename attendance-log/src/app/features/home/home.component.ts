import { Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { StudentGroupService } from '../../core/services/student-group.service';
import { SettingsService } from '../../core/services/settings.service';
import { ScheduleDayService } from '../../core/services/schedule-day.service';
import { DayFlags } from '../../core/models';
import { buildCalendarWeeks, CalendarDay } from './calendar';

const SELECTED_GROUP_KEY = 'selectedGroupId';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class HomeComponent {
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private groupsService = inject(StudentGroupService);
  private settings = inject(SettingsService);
  private schedule = inject(ScheduleDayService);
  private router = inject(Router);

  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly groups = toSignal(this.groupsService.list$(), { initialValue: [] });
  readonly isDark = this.theme.isDark;

  selectedGroupId = signal<string>(localStorage.getItem(SELECTED_GROUP_KEY) ?? '');
  displayedMonth = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  activeMode = signal<'accounted' | 'transferred' | null>(null);

  constructor() {
    effect(() => {
      const id = this.selectedGroupId();
      if (id) {
        localStorage.setItem(SELECTED_GROUP_KEY, id);
      } else {
        localStorage.removeItem(SELECTED_GROUP_KEY);
      }
    });
    effect(() => {
      const groups = this.groups();
      const id = this.selectedGroupId();
      if (groups.length > 0 && id && !groups.some((g) => g.id === id)) {
        this.selectedGroupId.set('');
      }
    });
  }

  private selectedGroup$ = toObservable(this.selectedGroupId);
  private displayedMonth$ = toObservable(this.displayedMonth);
  private currentMonthKey$ = this.displayedMonth$.pipe(map((d) => monthKey(d)));

  private saturdaySetting$ = combineLatest([this.selectedGroup$, this.currentMonthKey$]).pipe(
    switchMap(([gid, mk]) =>
      gid ? this.settings.getSaturdayIsStudyDay$(gid, mk) : of(true),
    ),
  );
  readonly saturdayIsStudyDay = toSignal(this.saturdaySetting$, { initialValue: true });

  private monthDays$ = combineLatest([this.selectedGroup$, this.displayedMonth$]).pipe(
    switchMap(([gid, month]) =>
      gid ? this.schedule.listDaysForGroupAndMonth$(gid, month) : of(new Map<string, DayFlags>()),
    ),
  );
  private readonly monthFlags = toSignal(this.monthDays$, { initialValue: new Map<string, DayFlags>() });

  readonly monthLabel = computed(() => {
    const d = this.displayedMonth();
    return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  });

  readonly selectedGroupName = computed(() => {
    const gid = this.selectedGroupId();
    return this.groups().find((g) => g.id === gid)?.name ?? '';
  });

  switchTheme(): void {
    this.theme.toggle();
  }

  logout(): void {
    this.auth.logout();
    this.activeMode.set(null);
  }

  addGroup(): void {
    this.router.navigate(['/group/new']);
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }

  onSaturdayChange(value: boolean): void {
    const gid = this.selectedGroupId();
    const mk = monthKey(this.displayedMonth());
    if (gid) {
      this.settings.setSaturdayIsStudyDay(gid, mk, value);
    }
  }

  previousMonth(): void {
    this.displayedMonth.update((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    this.displayedMonth.update((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  toggleMode(mode: 'accounted' | 'transferred'): void {
    this.activeMode.update((cur) => (cur === mode ? null : mode));
  }

  markAll(): void {
    const mode = this.activeMode();
    const gid = this.selectedGroupId();
    if (!mode || !gid) {
      return;
    }
    this.schedule.markAll(gid, this.displayedMonth(), mode, this.saturdayIsStudyDay());
  }

  onDayClick(day: CalendarDay): void {
    const gid = this.selectedGroupId();
    if (!gid || !day.enabled) {
      return;
    }
    this.activeMode()
      ? (this.activeMode() === 'accounted'
          ? this.schedule.toggleAccounted(gid, day.date)
          : this.schedule.toggleTransferred(gid, day.date))
      : this.router.navigate(['/day', gid, day.date]);
  }

  readonly weeks = computed<(CalendarDay | null)[][]>(() =>
    buildCalendarWeeks(
      this.displayedMonth().getFullYear(),
      this.displayedMonth().getMonth(),
      this.monthFlags(),
      this.saturdayIsStudyDay(),
    ),
  );
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
