import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

export const apiEnvelopeInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
        const b = event.body;
        // if ('StatusCode' in b && 'IsValid' in b) {
        //   if (b.IsValid === true) {
        //     return event.clone({ body: b.Data }); // pass only Data to callers
        //   }
        //   // force error so downstream catchError handles it
        //   throw { status: b.StatusCode ?? 400, message: b.Message ?? 'Error', envelope: b };
        // }
      }
      return event;
    })
  );