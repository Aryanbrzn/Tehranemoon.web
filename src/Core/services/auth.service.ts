// src/Core/services/auth.service.ts
import { Injectable, computed, signal, inject } from '@angular/core';
import { Httpclient } from './httpclient';

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
    private http = inject(Httpclient);

    private _user = signal<UserProfileDto | null>(null);
    readonly user = computed(() => this._user());
    readonly isAuthenticated = computed(() => !!this._user());

    private _loading = signal(false);
    readonly loading = computed(() => this._loading());

    async loadMe(): Promise<void> {
        this._loading.set(true);
        try {
            const me = await this.http.get<UserProfileDto>('/api/auth/me').toPromise();
            this._user.set(me ?? null);
        } catch {
            this._user.set(null);
        } finally {
            this._loading.set(false);
        }
    }

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

    /** لاگین اجتماعی (مثلاً گوگل) */
    async loginWithGoogle(credential: string) {
        this._loading.set(true);
        try {
            const me = await this.http.postJson<UserProfileDto>('/api/auth/google', { credential }).toPromise();
            this._user.set(me ?? null);
            return !!me;
        } finally {
            this._loading.set(false);
        }
    }

    async logout(): Promise<void> {
        try { await this.http.postJson('/api/auth/logout', {}).toPromise(); }
        finally { this._user.set(null); }
    }
}
