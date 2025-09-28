import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { withCredentialsInterceptor } from '../Core/interceptors/with-credentials-interceptor';
import { apiEnvelopeInterceptor } from '../Core/interceptors/api-envelope-interceptor';
import { errorInterceptor } from '../Core/interceptors/error-interceptor';
import { API_BASE_URL } from '../Core/tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    { provide: API_BASE_URL, useValue: 'http://l.com' },
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-CSRF-TOKEN' }),
      withInterceptors([
        withCredentialsInterceptor,
        apiEnvelopeInterceptor,
        errorInterceptor]),
    ),
  ]
};
