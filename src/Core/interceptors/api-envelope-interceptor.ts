import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface ApiEnvelope<T> {
  isSuccess: boolean;
  data: T | null;
  message: string;
  code: number;
}

export const apiEnvelopeInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    map(event => {
      if (!(event instanceof HttpResponse)) return event;

      const contentType = event.headers.get('content-type') ?? '';
      const isJson = contentType.includes('application/json');
      const body = event.body as any;

      // Empty body (e.g., 204 or Ok() with no content)
      if (body === null || body === undefined) {
        return event.clone({ body: null });
      }

      if (isJson && body && typeof body === 'object' && 'isSuccess' in body && 'data' in body && 'code' in body) {
        const env = body as ApiEnvelope<any>;
        if (env.isSuccess) {
          return event.clone({ body: env.data ?? null });
        }
        // Convert server-declared failure into an HttpErrorResponse so catchError can normalize
        throw new HttpErrorResponse({
          status: env.code,
          statusText: event.statusText,
          url: event.url ?? undefined,
          error: env,
        });
      }

      // Non-JSON or already raw -> pass through
      return event;
    }),
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse) {
        const raw = err.error as any;
        if (raw && typeof raw === 'object' && 'isSuccess' in raw && 'data' in raw && 'code' in raw) {
          const env = raw as ApiEnvelope<any>;
          return throwError(() => ({
            message: env.message || 'Request failed',
            code: env.code || err.status,
            data: env.data ?? null,
            httpError: err,
          }));
        }
        return throwError(() => ({
          message: (raw && raw.message) || err.message || 'Request failed',
          code: err.status,
          data: null,
          httpError: err,
        }));
      }
      return throwError(() => err);
    })
  );