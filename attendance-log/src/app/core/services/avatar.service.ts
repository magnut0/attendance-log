import { Injectable, inject } from '@angular/core';
import { UserProfileService } from './user-profile.service';

@Injectable({ providedIn: 'root' })
export class AvatarService {
  private profileService = inject(UserProfileService);

  async uploadAvatar(uid: string, file: File): Promise<string> {
    const dataUrl = await this.fileToDataUrl(file, 256);
    await this.profileService.update(uid, { photoUrl: dataUrl });
    return dataUrl;
  }

  private fileToDataUrl(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas is not supported'));
              return;
            }
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error('Не удалось прочитать изображение'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      reader.readAsDataURL(file);
    });
  }
}