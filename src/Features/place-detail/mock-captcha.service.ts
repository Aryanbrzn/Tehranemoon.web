import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MockCaptchaService {
    new() {
        const token = Math.random().toString(36).slice(2);
        // اگر تصویر کپچا نداری، یکی از تصاویر موجودت را بده یا data URL بساز
        return of({ token, imageUrl: 'images/captcha.png' }).pipe(delay(120));
    }
}
