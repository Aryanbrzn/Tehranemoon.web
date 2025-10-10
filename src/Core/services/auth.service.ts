import { computed, inject, Injectable, signal } from "@angular/core";
import { Httpclient } from "./httpclient";

// Core/services/auth.service.ts
export interface UserProfileDto {
    id: number; userName: string; personName?: string;
    email?: string; avatarUrl?: string | null;
}
type LoginRes = { accessToken: string; expires: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(Httpclient);
    private _user = signal<UserProfileDto | null>(null);
    readonly user = computed(() => this._user());
    readonly isAuthenticated = computed(() => !!this._user());
    private _loading = signal(false);
    readonly loading = computed(() => this._loading());
    private _token: string | null = localStorage.getItem('tm_access');

    async loadMe(): Promise<void> {
        this._loading.set(true);
        try {
            const me = await this.http.get<UserProfileDto>('/api/auth/me').toPromise();
            this._user.set(me ?? null);
        } catch { this._user.set(null); }
        finally { this._loading.set(false); }
    }

    async login(dto: { userNameOrEmail: string; password: string; }): Promise<boolean> {
        try {
            const res = await this.http.postJson<LoginRes>('/api/auth/login', dto, { withCredentials: true }).toPromise();
            this._token = res?.accessToken || null;
            if (this._token) localStorage.setItem('tm_access', this._token);
            await this.loadMe();
            return !!this._token;
        } catch { return false; }
    }

    async register(dto: { userName: string; email?: string; phoneNumber?: string; password: string; }): Promise<boolean> {
        try {
            await this.http.postJson('/api/auth/register', dto).toPromise();
            // بعد از ثبت‌نام می‌تونی خودکار لاگین هم بکنی
            return true;
        } catch { return false; }
    }

    async logout(): Promise<void> {
        try { await this.http.postJson('/api/auth/revoke', {}, { withCredentials: true }).toPromise(); }
        finally {
            localStorage.removeItem('tm_access');
            this._token = null; this._user.set(null);
        }
    }

    get token() { return this._token; }
}
