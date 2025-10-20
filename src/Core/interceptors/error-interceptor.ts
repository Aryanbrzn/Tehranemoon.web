import { HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError(err => {
      console.error('HTTP Error:', err);
      console.error('Request URL:', req.url);
      console.error('Request Headers:', req.headers);

      // Automatically show toast for API errors
      toastService.handleApiError(err);
      return throwError(() => err);
    })
  );
};