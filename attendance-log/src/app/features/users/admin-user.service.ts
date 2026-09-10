import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

export interface NewUserInput {
  email: string;
  displayName?: string;
  isSuperUser?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private auth = inject(AuthService);

  generateTempPassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    let out = '';
    for (let i = 0; i < length; i++) {
      out += chars[arr[i] % chars.length];
    }
    return out;
  }

  async createUser(data: NewUserInput): Promise<string> {
    const tempPassword = this.generateTempPassword();
    this.auth.operationInProgress.set(true);
    try {
      await this.auth.createUserWithTempPassword({
        email: data.email.trim(),
        tempPassword,
        displayName: data.displayName?.trim() || undefined,
        isSuperUser: data.isSuperUser ?? false,
      });
      return tempPassword;
    } finally {
      this.auth.operationInProgress.set(false);
    }
  }
}