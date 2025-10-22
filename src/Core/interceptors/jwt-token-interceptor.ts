import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const jwtTokenInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    // Skip token attachment for auth endpoints and external URLs
    if (isAuthEndpoint(req) || isExternalUrl(req)) {
        return next(req);
    }

    const token = authService.token;
    if (token && isTokenValid(token)) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(authReq);
    }

    return next(req);
};

function isAuthEndpoint(req: HttpRequest<any>): boolean {
    const authPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
    return authPaths.some(path => req.url.includes(path));
}

function isExternalUrl(req: HttpRequest<any>): boolean {
    return req.url.startsWith('http://') || req.url.startsWith('https://');
}

function isTokenValid(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
    } catch {
        return false;
    }
}
