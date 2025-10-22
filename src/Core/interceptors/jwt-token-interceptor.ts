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
    // Only skip token attachment for endpoints that don't require authentication
    const publicAuthPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
    return publicAuthPaths.includes(req.url);
}

function isExternalUrl(req: HttpRequest<any>): boolean {
    // Only consider URLs external if they don't point to our API
    const url = req.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false; // Relative URLs are internal
    }

    // Check if it's pointing to our API server
    return !url.includes('localhost:5129') && !url.includes('127.0.0.1:5129');
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
