import { HttpInterceptorFn } from '@angular/common/http';

export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('tm_access');
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
}
