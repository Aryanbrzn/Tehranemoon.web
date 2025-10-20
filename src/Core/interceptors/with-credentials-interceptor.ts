import { HttpInterceptorFn } from '@angular/common/http';

export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('tm_access');
  console.log('Interceptor - URL:', req.url, 'Token:', token ? 'present' : 'missing');

  if (token) {
    // Check if token is valid JWT and not expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) {
        console.log('Interceptor - Token expired, removing from localStorage');
        localStorage.removeItem('tm_access');
        return next(req);
      }
    } catch {
      console.log('Interceptor - Invalid token format, removing from localStorage');
      localStorage.removeItem('tm_access');
      return next(req);
    }

    const modifiedReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    console.log('Interceptor - Added Authorization header');
    return next(modifiedReq);
  }

  console.log('Interceptor - No token, proceeding without Authorization header');
  return next(req);
}
