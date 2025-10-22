import { HttpInterceptorFn } from '@angular/common/http';

export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add credentials for same-origin requests or specific API endpoints
  if (shouldIncludeCredentials(req)) {
    const modifiedReq = req.clone({
      withCredentials: true
    });
    return next(modifiedReq);
  }

  return next(req);
};

function shouldIncludeCredentials(req: any): boolean {
  // Include credentials for auth endpoints and API calls
  const authEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/revoke'];
  const isAuthEndpoint = authEndpoints.some(endpoint => req.url.includes(endpoint));

  // Include credentials for API calls to our backend
  const isApiCall = req.url.includes('/api/');

  return isAuthEndpoint || isApiCall;
}
