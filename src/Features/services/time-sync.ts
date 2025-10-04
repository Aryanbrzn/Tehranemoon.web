import { computed, Injectable, OnDestroy, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimeSyncService implements OnDestroy {
  private _offsetMs = signal(0); // serverNow - clientNow
  readonly offsetMs = computed(() => this._offsetMs());

  private _timer?: any;

  constructor() {
    this.syncNow();
    this._timer = setInterval(() => this.syncNow(), 10 * 60_000); // هر 10 دقیقه
  }

  ngOnDestroy() { if (this._timer) clearInterval(this._timer); }

  async syncNow() {
    const samples: number[] = [];

    for (let i = 0; i < 5; i++) {
      const t0Perf = performance.now();
      let serverUtcMs: number | undefined;

      try {
        // ترجیحاً یک endpoint اختصاصی داشته باش: { utcMs: 1699999999999 }
        const res = await fetch('/api/time/utc', { cache: 'no-store', credentials: 'include' });
        const t1Perf = performance.now();

        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const j = await res.json().catch(() => null);
            serverUtcMs = j?.utcMs;
          }
          // fallback: اگر json نداشتی، از Date header استفاده کن
          if (!serverUtcMs) {
            const dh = res.headers.get('Date');
            if (dh) serverUtcMs = Date.parse(dh);
          }

          if (serverUtcMs) {
            const rtt = t1Perf - t0Perf;
            const clientReceive = Date.now();
            const estimatedServerNow = serverUtcMs + rtt / 2; // نیمه‌ی RTT
            const off = estimatedServerNow - clientReceive;    // serverNow - clientNow
            samples.push(off);
          }
        }
      } catch {
        // آخرین چاره: HEAD به روت و گرفتن Date header
        try {
          const t0 = performance.now();
          const resHead = await fetch('/', { method: 'HEAD', cache: 'no-store' });
          const t1 = performance.now();
          const dh = resHead.headers.get('Date');
          if (dh) {
            const serverMs = Date.parse(dh);
            const rtt = t1 - t0;
            const clientReceive = Date.now();
            const est = serverMs + rtt / 2;
            samples.push(est - clientReceive);
          }
        } catch { }
      }

      await new Promise(r => setTimeout(r, 120));
    }

    if (samples.length) {
      samples.sort((a, b) => a - b);
      const median = samples[Math.floor(samples.length / 2)];
      this._offsetMs.set(Math.trunc(median));
    }
  }
}