import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { StudentGroupService } from '../../core/services/student-group.service';
import { StudentService } from '../../core/services/student.service';
import { SettingsService } from '../../core/services/settings.service';

interface StudentFormItem {
  localId: string;
  firstName: string;
  lastName: string;
  patronymic: string;
}

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './group-form.html',
  styleUrls: ['./group-form.scss'],
})
export class GroupFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupsService = inject(StudentGroupService);
  private studentsService = inject(StudentService);
  private settings = inject(SettingsService);

  editingId = signal<string | null>(null);
  groupName = signal('');
  students = signal<StudentFormItem[]>([]);
  error = signal('');
  saving = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      const group = await this.waitForGroup(id);
      if (group) {
        this.groupName.set(group.name);
        const students = await this.loadStudents(id);
        this.students.set(students);
      }
    } else {
      this.addStudent();
    }
  }

  private async waitForGroup(id: string) {
    return new Promise<any>((resolve) => {
      const sub = this.groupsService.get$(id).subscribe((g) => {
        if (g) {
          sub.unsubscribe();
          resolve(g);
        }
      });
    });
  }

  private async loadStudents(groupId: string): Promise<StudentFormItem[]> {
    return new Promise<StudentFormItem[]>((resolve) => {
      const sub = this.studentsService.listByGroup$(groupId).subscribe((students) => {
        sub.unsubscribe();
        resolve(
          students
            .map((s) => ({
              localId: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              patronymic: s.patronymic,
            }))
            .sort((a, b) => a.lastName.localeCompare(b.lastName)),
        );
      });
    });
  }

  addStudent(): void {
    this.students.update((list) => [
      ...list,
      { localId: crypto.randomUUID(), firstName: '', lastName: '', patronymic: '' },
    ]);
  }

  removeStudent(index: number): void {
    this.students.update((list) => list.filter((_, i) => i !== index));
  }

  updateStudent(index: number, field: keyof StudentFormItem, value: string): void {
    this.students.update((list) => {
      const updated = [...list];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  isValid(): boolean {
    if (!this.groupName().trim()) {
      return false;
    }
    return this.students().length > 0 && this.students().every((s) => s.lastName.trim());
  }

  async save(): Promise<void> {
    if (!this.isValid()) {
      this.error.set('Заполните название группы и фамилии всех студентов');
      return;
    }
    this.error.set('');
    this.saving.set(true);
    try {
      if (this.editingId()) {
        const groupId = this.editingId()!;
        await this.groupsService.update(groupId, { name: this.groupName().trim() });
        await this.saveStudents(groupId);
      } else {
        const groupId = await this.groupsService.create(this.groupName().trim());
        await this.saveStudents(groupId);
        await this.settings.generateMonthSettingsForGroup(groupId, new Date());
      }
      this.router.navigate(['/']);
    } catch (e) {
      this.error.set('Не удалось сохранить группу');
    } finally {
      this.saving.set(false);
    }
  }

  private async saveStudents(groupId: string): Promise<void> {
    const existing = this.editingId()
      ? await this.loadStudentsForSave(this.editingId()!)
      : [];
    const existingIds = new Set(existing.map((e) => e.localId));
    const formItems = this.students();

    for (const item of formItems) {
      if (existingIds.has(item.localId)) {
        await this.studentsService.update(item.localId, {
          studentGroupId: groupId,
          firstName: item.firstName.trim(),
          lastName: item.lastName.trim(),
          patronymic: item.patronymic.trim(),
        });
      } else {
        await this.studentsService.create({
          studentGroupId: groupId,
          firstName: item.firstName.trim(),
          lastName: item.lastName.trim(),
          patronymic: item.patronymic.trim(),
        });
      }
    }

    // remove students that were in the group but are now removed from the form
    const remainingIds = new Set(formItems.map((f) => f.localId));
    for (const ex of existing) {
      if (!remainingIds.has(ex.localId)) {
        await this.studentsService.remove(ex.localId);
      }
    }

    const currentIds = formItems.map((f) => f.localId);
    await this.groupsService.update(groupId, { studentIds: currentIds });
  }

  private async loadStudentsForSave(groupId: string) {
    return new Promise<any[]>((resolve) => {
      const sub = this.studentsService.listByGroup$(groupId).subscribe((students) => {
        sub.unsubscribe();
        resolve(
          students.map((s) => ({
            localId: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            patronymic: s.patronymic,
          })),
        );
      });
    });
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
