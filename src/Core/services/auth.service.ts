import { computed, inject, Injectable, signal } from "@angular/core";
import { Httpclient } from "./httpclient";
import { environment } from "../../environments/environment";

// Core/services/auth.service.ts
export interface UserProfileDto {
    id: number; userName: string; personName?: string;
    email?: string; avatarUrl?: string | null;
}
type LoginRes = { accessToken: string; refreshToken: string; expires: string };
type RefreshRes = { accessToken: string; refreshToken: string; expires: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(Httpclient);
    private _user = signal<UserProfileDto | null>(null);
    readonly user = computed(() => this._user());
    readonly isAuthenticated = computed(() => !!this._user());
    private _loading = signal(false);
    readonly loading = computed(() => this._loading());
    private _token: string | null = localStorage.getItem(environment.accessTokenKey);
    private _refreshToken: string | null = localStorage.getItem(environment.refreshTokenKey);
    private _refreshPromise: Promise<boolean> | null = null;

    async loadMe(): Promise<void> {
        this._loading.set(true);
        try {
            // Check if token is valid before making request
            if (!this.isTokenValid()) {
                console.log('Token is invalid or expired, attempting refresh...');
                const refreshed = await this.refreshTokenIfNeeded();
                if (!refreshed) {
                    console.log('Token refresh failed, clearing tokens...');
                    this.clearInvalidTokens();
                    return;
                }
            }

            console.log('Loading user profile with token:', this._token ? 'present' : 'missing');
            const me = await this.http.get<UserProfileDto>('/api/auth/me').toPromise();
            this._user.set(me ?? null);
            console.log('User profile loaded:', me);
        } catch (error: any) {
            console.error('Failed to load user profile:', error);
            // If we get 401, the token might be invalid
            if (error?.code === 401 || error?.httpError?.status === 401) {
                console.log('Received 401, attempting token refresh...');
                const refreshed = await this.refreshTokenIfNeeded();
                if (!refreshed) {
                    console.log('Token refresh failed, clearing tokens...');
                    this.clearInvalidTokens();
                }
            } else {
                this._user.set(null);
            }
        }
        finally { this._loading.set(false); }
    }

    async login(dto: { userNameOrEmail: string; password: string; }): Promise<boolean> {
        try {
            const res = await this.http.postJson<LoginRes>('/api/auth/login', dto, { withCredentials: true }).toPromise();
            this._token = res?.accessToken || null;
            this._refreshToken = res?.refreshToken || null;
            if (this._token) localStorage.setItem(environment.accessTokenKey, this._token);
            if (this._refreshToken) localStorage.setItem(environment.refreshTokenKey, this._refreshToken);
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
            localStorage.removeItem(environment.accessTokenKey);
            localStorage.removeItem(environment.refreshTokenKey);
            this._token = null;
            this._refreshToken = null;
            this._user.set(null);
        }
    }

    get token() { return this._token; }
    get refreshToken() { return this._refreshToken; }

    // Check if token exists and is not expired
    private isTokenValid(): boolean {
        if (!this._token) return false;

        try {
            // Decode JWT token to check expiration
            const payload = JSON.parse(atob(this._token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = (payload.exp - now) * 1000;

            // Return true if token is valid and not close to expiry
            return payload.exp > now && timeUntilExpiry > environment.tokenRefreshThreshold;
        } catch {
            // If token is not a valid JWT, assume it's invalid
            return false;
        }
    }

    // Refresh token if needed
    async refreshTokenIfNeeded(): Promise<boolean> {
        if (!this._refreshToken) return false;

        // Prevent multiple simultaneous refresh attempts
        if (this._refreshPromise) {
            return this._refreshPromise;
        }

        this._refreshPromise = this.performTokenRefresh();
        const result = await this._refreshPromise;
        this._refreshPromise = null;
        return result;
    }

    private async performTokenRefresh(): Promise<boolean> {
        try {
            console.log('Attempting token refresh...');
            const res = await this.http.postJson<RefreshRes>('/api/auth/refresh',
                { refreshToken: this._refreshToken },
                { withCredentials: true }
            ).toPromise();

            this._token = res?.accessToken || null;
            this._refreshToken = res?.refreshToken || null;

            if (this._token) localStorage.setItem(environment.accessTokenKey, this._token);
            if (this._refreshToken) localStorage.setItem(environment.refreshTokenKey, this._refreshToken);

            console.log('Token refresh successful');
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearInvalidTokens();
            return false;
        }
    }

    // Clear invalid tokens
    private clearInvalidTokens(): void {
        localStorage.removeItem(environment.accessTokenKey);
        localStorage.removeItem(environment.refreshTokenKey);
        this._token = null;
        this._refreshToken = null;
        this._user.set(null);
    }
}
