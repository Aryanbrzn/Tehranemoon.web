// src/Features/services/captcha.service.ts
import { inject, Injectable } from '@angular/core';
import { Httpclient } from '../../Core/services/httpclient';

export interface CaptchaChallenge {
  token: string;      // توکنِ چالش (به همراه پاسخ ارسال می‌شود)
  imageUrl: string;   // آدرس تصویر کپچا
}

@Injectable({ providedIn: 'root' })
export class CaptchaService {
  private http = inject(Httpclient);

  new() {
    return this.http.get<CaptchaChallenge>('api/captcha/new', { t: Date.now() }); // cache-buster
  }
}
