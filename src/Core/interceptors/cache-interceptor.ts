import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

// Simple in-memory cache
const cache = new Map<string, HttpResponse<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next(req);
    }

    // Don't cache authentication endpoints
    if (req.url.includes('/api/auth/')) {
        return next(req);
    }

    // Don't cache place detail endpoints (they should always be fresh)
    if (req.url.includes('/api/places/') && !req.url.includes('/api/places/leaderboard')) {
        return next(req);
    }

    // Don't cache user rating endpoints (they should always be fresh)
    if (req.url.includes('/user-rating')) {
        return next(req);
    }

    const cacheKey = req.urlWithParams;
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
        const now = Date.now();
        const cacheTime = cachedResponse.headers.get('X-Cache-Time');

        if (cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
            return of(cachedResponse);
        } else {
            cache.delete(cacheKey);
        }
    }

    return next(req).pipe(
        tap(response => {
            if (response instanceof HttpResponse) {
                // Add cache timestamp
                const responseWithTime = response.clone({
                    headers: response.headers.set('X-Cache-Time', Date.now().toString())
                });
                cache.set(cacheKey, responseWithTime);
            }
        })
    );
};
