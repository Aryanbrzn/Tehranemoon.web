import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError(err => {
      console.error('HTTP Error:', err);
      console.error('Request URL:', req.url);
      console.error('Request Headers:', req.headers);

      // Handle different types of errors
      if (err.status === 401) {
        // Unauthorized - token might be expired
        console.log('401 Unauthorized - attempting token refresh...');
        authService.refreshTokenIfNeeded().then(refreshed => {
          if (!refreshed) {
            // If refresh failed, user needs to login again
            toastService.error('Session expired. Please login again.');
            // Optionally redirect to login page
          }
        });
      } else if (err.status === 403) {
        // Forbidden - user doesn't have permission
        toastService.error('You do not have permission to perform this action.');
      } else if (err.status === 404) {
        // Not found
        toastService.error('The requested resource was not found.');
      } else if (err.status === 500) {
        // Server error
        toastService.error('Server error occurred. Please try again later.');
      } else if (err.status === 0) {
        // Network error or CORS issue
        toastService.error('Network error. Please check your connection.');
      } else if (err.status >= 400 && err.status < 500) {
        // Client error
        const message = err.error?.message || err.message || 'Request failed';
        toastService.error(message);
      } else if (err.status >= 500) {
        // Server error
        toastService.error('Server error occurred. Please try again later.');
      } else {
        // Generic error handling
        toastService.handleApiError(err);
      }

      return throwError(() => err);
    })
  );
};