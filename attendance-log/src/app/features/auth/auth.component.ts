import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
  ],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss'],
})
export class AuthComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');
  error = signal('');
  loading = signal(false);

  async submit(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.login(this.email(), this.password());
      this.goBack();
    } catch (e) {
      this.error.set(this.getErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  async register(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.register(this.email(), this.password());
      this.goBack();
    } catch (e) {
      this.error.set(this.getErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  private goBack(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    void this.router.navigate([returnUrl ?? '/']);
  }

  private getErrorMessage(e: unknown): string {
    const code = (e as { code?: string })?.code ?? '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Неверный email или пароль';
      case 'auth/email-already-in-use':
        return 'Пользователь с таким email уже существует';
      case 'auth/invalid-email':
        return 'Некорректный email';
      case 'auth/weak-password':
        return 'Слишком слабый пароль';
      default:
        return 'Произошла ошибка. Попробуйте ещё раз.';
    }
  }
}
