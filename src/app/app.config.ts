import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { withCredentialsInterceptor } from '../Core/interceptors/with-credentials-interceptor';
import { apiEnvelopeInterceptor } from '../Core/interceptors/api-envelope-interceptor';
import { errorInterceptor } from '../Core/interceptors/error-interceptor';
import { cacheInterceptor } from '../Core/interceptors/cache-interceptor';
import { API_BASE_URL } from '../Core/tokens';
import { OverlayModule } from '@angular/cdk/overlay';
import { SelectivePreloadingStrategy } from './preload-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    importProvidersFrom(OverlayModule),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
    { provide: API_BASE_URL, useValue: 'http://localhost:5129' },
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-CSRF-TOKEN' }),
      withInterceptors([
        withCredentialsInterceptor,
        cacheInterceptor,
        apiEnvelopeInterceptor,
        errorInterceptor]),
    ),
  ]
};
