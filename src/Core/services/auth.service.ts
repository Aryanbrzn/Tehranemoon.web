import { Injectable, computed, signal } from '@angular/core';
import { Httpclient } from './httpclient'; // همونی که قبلاً ساختی (Core/services/httpclient.ts)

export interface UserProfileDto {
    id: number;
    userName: string;
    personName?: string;
    email?: string;
    avatarUrl?: string | null;
}

export interface LoginDto { userNameOrEmail: string; password: string; }
export interface RegisterDto { userName: string; email?: string; phoneNumber?: string; password: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = new Httpclient(); // اگر با DI می‌خواهی: inject(Httpclient)

    private _user = signal<UserProfileDto | null>(null);
    user = computed(() => this._user());
    isAuthenticated = computed(() => !!this._user());

    private _loading = signal(false);
    loading = computed(() => this._loading());

    /** پروفایل را از سرور می‌گیرد (اگه 401 شد، null) */
    async loadMe(): Promise<void> {
        this._loading.set(true);
        try {
            // مسیر API را با بک‌اند خودت هماهنگ کن
            const me = await this.http.get<UserProfileDto>('/api/auth/me').toPromise();
            this._user.set(me ?? null);
        } catch {
            this._user.set(null);
        } finally {
            this._loading.set(false);
        }
    }

    /** ورود: کوکی HttpOnly ست می‌شود، بعد دوباره /me */
    async login(payload: LoginDto): Promise<boolean> {
        this._loading.set(true);
        try {
            await this.http.postJson('/api/auth/login', payload).toPromise();
            await this.loadMe();
            return this.isAuthenticated();
        } catch {
            return false;
        } finally {
            this._loading.set(false);
        }
    }

    /** ثبت‌نام: بعد از موفقیت، اتوماتیک لاگین شو (بسته به بک‌اند) یا دستی /me */
    async register(payload: RegisterDto): Promise<boolean> {
        this._loading.set(true);
        try {
            await this.http.postJson('/api/auth/register', payload).toPromise();
            await this.loadMe();
            return this.isAuthenticated();
        } catch {
            return false;
        } finally {
            this._loading.set(false);
        }
    }

    async logout(): Promise<void> {
        try { await this.http.postJson('/api/auth/logout', {}).toPromise(); }
        finally { this._user.set(null); }
    }
}
