import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError(err => {

      // Handle different types of errors
      if (err.status === 401) {
        // Unauthorized - token might be expired

        // Attempt to refresh token and retry the request
        return from(authService.refreshTokenIfNeeded()).pipe(
          switchMap(refreshed => {
            if (refreshed) {
              // Retry the original request with the new token
              return next(req);
            } else {
              // If refresh failed, user needs to login again
              toastService.error('Session expired. Please login again.');
              return throwError(() => err);
            }
          }),
          catchError(() => {
            toastService.error('Session expired. Please login again.');
            return throwError(() => err);
          })
        );
      } else if (err.status === 403) {
        // Forbidden - user doesn't have permission
        toastService.error('You do not have permission to perform this action.');
      } else if (err.status === 401 && err.error?.code) {
        // Handle specific authentication error codes
        switch (err.error.code) {
          case 'INVALID_CREDENTIALS':
            toastService.error('Invalid username or password.');
            break;
          case 'LOCKED_OUT':
            toastService.error('Account is locked. Please contact support.');
            break;
          case 'INVALID_REFRESH':
            toastService.error('Session expired. Please login again.');
            break;
          default:
            toastService.error('Authentication failed. Please login again.');
        }
      } else if (err.status === 404) {
        // Not found
        toastService.error('The requested resource was not found.');
      } else if (err.status >= 500) {
        // Server error
        toastService.error('Server error occurred. Please try again later.');
      } else if (err.status === 0) {
        // Network error or CORS issue
        toastService.error('Network error. Please check your connection.');
      } else if (err.status >= 400 && err.status < 500) {
        // Client error
        const message = err.error?.message || err.message || 'Request failed';
        toastService.error(message);
      } else {
        // Generic error handling
        toastService.handleApiError(err);
      }

      return throwError(() => err);
    })
  );
};