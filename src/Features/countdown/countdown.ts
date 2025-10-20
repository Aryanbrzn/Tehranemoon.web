import { ChangeDetectionStrategy, Component, computed, effect, inject, Input, OnDestroy, signal } from '@angular/core';
import { TimeSyncService } from '../services/time-sync';

@Component({
  selector: 'app-countdown',
  imports: [],
  templateUrl: './countdown.html',
  styleUrl: './countdown.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class CountdownComponent implements OnDestroy {
  private sync = inject(TimeSyncService);

  /** تاریخ هدف (UTC). مثال: "2027-04-10T00:00:00Z" */
  @Input() set targetUtc(v: string | Date) {
    this._targetMs = this.parseUtc(v);
    this.targetIso = new Date(this._targetMs).toISOString();
    this.alignAndStart();
  }
  @Input() label = 'تا واگذاری سایت';

  targetIso = '';
  private _targetMs = 0;

  // "اکنون" به میلی‌ثانیه؛ با offset سرور اعمال‌شده
  private nowWallMs = signal(Date.now());

  // اختلاف باقی‌مانده
  remainMs = computed(() => Math.max(0, this._targetMs - (this.nowWallMs() + this.sync.offsetMs())));

  days = computed(() => Math.floor(this.remainMs() / 86_400_000));
  hours = computed(() => Math.floor((this.remainMs() % 86_400_000) / 3_600_000));
  minutes = computed(() => Math.floor((this.remainMs() % 3_600_000) / 60_000));
  seconds = computed(() => Math.floor((this.remainMs() % 60_000) / 1000));

  private _intId: any;

  constructor() {
    // اگر زمان به صفر رسید، تایمر را خاموش کن
    effect(() => {
      if (this.remainMs() === 0) this.stop();
    });
  }

  ngOnDestroy() {
    this.stop();
  }

  private stop() {
    if (this._intId) {
      clearInterval(this._intId);
      this._intId = null;
    }
  }

  /** تراز روی لبه‌ی ثانیه + جلوگیری از دریفت */
  private alignAndStart() {
    this.stop();
    // یک آپدیت فوری
    this.nowWallMs.set(Date.now());

    const firstDelay = 1000 - (Date.now() % 1000); // تا لبه‌ی ثانیه بعد
    setTimeout(() => {
      this.nowWallMs.set(Date.now());
      // هر 1000ms اما با تصحیح دریفت
      let expected = Date.now() + 1000;
      this._intId = setInterval(() => {
        // drift correction:
        const drift = Date.now() - expected;
        this.nowWallMs.set(Date.now());
        expected += 1000;
        // اگر دریفت زیاد شد، تراز مجدد
        if (Math.abs(drift) > 150) {
          clearInterval(this._intId);
          this.alignAndStart();
        }
      }, 1000);
    }, firstDelay);
  }

  private parseUtc(v: string | Date): number {
    if (v instanceof Date) return v.getTime();
    // پیشنهاد: ISO بده. اگر "dd/MM/yyyy" دادی، اینجا 00:00:00 UTC در نظر می‌گیریم
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
      const [dd, mm, yyyy] = v.split('/').map(Number);
      return Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0);
    }
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : Date.now();
  }

  fa(n: number) {
    const map: Record<string, string> = { '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹' };
    return String(n).replace(/[0-9]/g, d => map[d]);
  }
}