import { Injectable, signal, computed, inject } from '@angular/core';
import { Httpclient } from './httpclient';

export type MeDto = { id: number; userName: string; personName?: string; email?: string; avatarUrl?: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(Httpclient);
  private _me = signal<MeDto | null>(null);
  me = computed(() => this._me());

  /** یکبار ابتدای اپ فراخوانی کن تا وضعیت کاربر معلوم شود */
  async bootstrap() {
    try {
      const me = await this.http.get<MeDto>('/api/auth/me').toPromise();
      this._me.set(me ?? null);
    } catch { this._me.set(null); }
  }

  /** لاگین با گوگل: credential از GIS می‌آد */
  async loginWithGoogle(credential: string) {
    const me = await this.http.postJson<MeDto>('/api/auth/google', { credential }).toPromise();
    this._me.set(me ?? null);
    return me;
  }

  async logout() {
    await this.http.postJson('/api/auth/logout', {}).toPromise();
    this._me.set(null);
  }
}
