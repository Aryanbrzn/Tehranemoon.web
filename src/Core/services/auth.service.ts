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
    private _token: string | null = sessionStorage.getItem(environment.accessTokenKey);
    private _refreshToken: string | null = sessionStorage.getItem(environment.refreshTokenKey);
    private _refreshPromise: Promise<boolean> | null = null;

    async loadMe(): Promise<void> {
        this._loading.set(true);
        try {
            // Check if token is valid before making request
            if (!this.isTokenValid()) {
                const refreshed = await this.refreshTokenIfNeeded();
                if (!refreshed) {
                    this.clearInvalidTokens();
                    return;
                }
            }

            const me = await this.http.get<UserProfileDto>('/api/auth/me', {
                _t: Date.now() // Cache-buster
            }).toPromise();
            this._user.set(me ?? null);
        } catch (error: any) {
            // If we get 401, the token might be invalid
            if (error?.code === 401 || error?.httpError?.status === 401) {
                const refreshed = await this.refreshTokenIfNeeded();
                if (!refreshed) {
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
            if (this._token) sessionStorage.setItem(environment.accessTokenKey, this._token);
            if (this._refreshToken) sessionStorage.setItem(environment.refreshTokenKey, this._refreshToken);
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
            sessionStorage.removeItem(environment.accessTokenKey);
            sessionStorage.removeItem(environment.refreshTokenKey);
            this._token = null;
            this._refreshToken = null;
            this._user.set(null);
        }
    }

    get token() { return this._token; }
    get refreshTokenValue() { return this._refreshToken; }

    // Public method to manually refresh token
    async refreshToken(): Promise<boolean> {
        return await this.refreshTokenIfNeeded();
    }

    // Get current user info
    getCurrentUser(): UserProfileDto | null {
        return this._user();
    }

    // Check if user is authenticated (method version)
    isUserAuthenticated(): boolean {
        return !!this._user();
    }

    // Check if token exists and is not expired
    private isTokenValid(): boolean {
        if (!this._token) return false;

        try {
            // Decode JWT token to check expiration
            const payload = JSON.parse(atob(this._token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = (payload.exp - now) * 1000;

            // Return true if token is valid and has more than 3 minutes left (180 seconds)
            // This ensures we refresh tokens 2-3 minutes before expiration
            return payload.exp > now && timeUntilExpiry > (3 * 60 * 1000);
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
            // Send refresh token via cookie (withCredentials: true) or header
            const res = await this.http.postJson<RefreshRes>('/api/auth/refresh',
                {}, // Empty body since refresh token is sent via cookie
                { withCredentials: true }
            ).toPromise();

            this._token = res?.accessToken || null;
            this._refreshToken = res?.refreshToken || null;

            if (this._token) sessionStorage.setItem(environment.accessTokenKey, this._token);
            if (this._refreshToken) sessionStorage.setItem(environment.refreshTokenKey, this._refreshToken);

            return true;
        } catch (error) {
            this.clearInvalidTokens();
            return false;
        }
    }

    // Clear invalid tokens
    private clearInvalidTokens(): void {
        sessionStorage.removeItem(environment.accessTokenKey);
        sessionStorage.removeItem(environment.refreshTokenKey);
        this._token = null;
        this._refreshToken = null;
        this._user.set(null);
    }
}
