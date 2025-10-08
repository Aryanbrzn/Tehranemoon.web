import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MiniMapComponent } from '../mini-map.component/mini-map.component';
import { PlaceDetailService, PlaceDetailDto, ReviewDto } from '../services/place-detail';
import { CaptchaService, CaptchaChallenge } from '../../Core/services/captcha-service';
import { ReviewsService } from '../services/reviews-service';

// موک‌ها فقط برای تست UI
import { MockCaptchaService } from './mock-captcha.service';
import { MockPlaceDetailService } from './mock-place-detail.service';
import { MockReviewsService } from './mock-reviews.service';
import { MODAL_DATA } from '../../Shared/modal/modal.tokens';

type ReviewVM = ReviewDto & { replies?: ReviewDto[] };

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [MiniMapComponent, DatePipe, FormsModule],
  templateUrl: './place-detail.html',
  styleUrl: './place-detail.css',
  // ⬇️ در حالت واقعی این providers را حذف کن تا به سرویس‌های واقعی وصل شود.
  providers: [
    { provide: PlaceDetailService, useClass: MockPlaceDetailService },
    { provide: ReviewsService, useClass: MockReviewsService },
    { provide: CaptchaService, useClass: MockCaptchaService },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceDetailComponent {
  private route = inject(ActivatedRoute);
  private api = inject(PlaceDetailService);
  private reviewsApi = inject(ReviewsService);
  private captcha = inject(CaptchaService);

  private modalData = inject(MODAL_DATA, { optional: true }) as { id?: number } | null;

  readonly place = toSignal<PlaceDetailDto | null>(
    (this.modalData?.id
      ? this.api.get(this.modalData.id)
      : this.route.paramMap.pipe(
        map(pm => Number(pm.get('id'))),
        switchMap(id => this.api.get(id))
      )
    ),
    { initialValue: null }
  );

  /** ویومدل Threaded: ریشه‌ها + ریپلای‌ها */
  readonly reviews = computed<ReviewVM[]>(() => {
    const flat = (this.place()?.reviews ?? []).slice();

    // گروه‌بندی بر اساس parentId
    const byParent = new Map<number | null, ReviewDto[]>();
    for (const r of flat) {
      const k = (r.parentId ?? null);
      const bucket = byParent.get(k) ?? [];
      bucket.push(r);
      byParent.set(k, bucket);
    }

    // ریشه‌ها
    const roots = (byParent.get(null) ?? []);

    // سورت: اول AmirAli، بعد جدیدتر جلوتر
    roots.sort((a, b) => {
      const pa = a.authorType === 'AmirAli' ? 0 : 1;
      const pb = b.authorType === 'AmirAli' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return +new Date(b.createdAtUtc) - +new Date(a.createdAtUtc);
    });

    // ریپلای‌ها (قدیمی‌تر جلوتر برای خوانایی)
    return roots.map(r => ({
      ...r,
      replies: (byParent.get(r.id) ?? []).sort((a, b) => +new Date(a.createdAtUtc) - +new Date(b.createdAtUtc))
    }));
  });

  // فرم ثبت نظر
  rvForm = { rating: 5, text: '', captchaAnswer: '' };
  rvBusy = false;
  rvError: string | null = null;
  cap: CaptchaChallenge | null = null;

  // وضعیت ریپلای
  replyingFor: number | null = null;
  replyText = '';
  replyBusy = false;

  constructor() { this.refreshCaptcha(); }

  // Helpers
  readonly hasCoord = computed(() => !!this.parseLatLng(this.place()?.coordinates));
  parseLatLng(coords?: string | null) {
    if (!coords) return null;
    const [a, b] = coords.split(',').map(s => +s.trim());
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return { lat: a, lng: b };
  }

  gmapsDirectionUrl() {
    const ll = this.parseLatLng(this.place()?.coordinates); if (!ll) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${ll.lat},${ll.lng}`;
  }
  neshanDirectionUrl() {
    const ll = this.parseLatLng(this.place()?.coordinates); if (!ll) return '#';
    return `https://neshan.org/maps/@${ll.lat},${ll.lng},16.0z`;
  }

  async share() {
    const p = this.place();
    const data = { title: p?.title ?? 'Tehranemoon', text: p?.description ?? '', url: location.href };
    try {
      if ((navigator as any).share) await (navigator as any).share(data);
      else { await navigator.clipboard.writeText(data.url); alert('لینک کپی شد ✅'); }
    } catch { /* بی‌صدا */ }
  }

  // CAPTCHA
  refreshCaptcha() {
    this.captcha.new().subscribe(c => {
      this.cap = c;
      this.rvForm.captchaAnswer = '';
    });
  }

  // ثبت نظر
  submitReview() {
    const p = this.place();
    if (!p) return;
    if (!this.rvForm.text.trim()) { this.rvError = 'متن نظر را وارد کنید.'; return; }
    if (!this.rvForm.captchaAnswer.trim()) { this.rvError = 'کد کپچا را وارد کنید.'; return; }

    this.rvBusy = true;
    this.reviewsApi.addReview(p.id, {
      rating: Number(this.rvForm.rating),
      text: this.rvForm.text,
      captchaToken: this.cap?.token ?? '',
      captchaAnswer: this.rvForm.captchaAnswer
    }).subscribe({
      next: _ => {
        this.api.get(p.id).subscribe(np => {
          // NOTE: چون place از toSignal ساخته شده، با هک زیر ریفرش می‌کنیم
          (this as any).place.set(np);
          this.rvForm = { rating: 5, text: '', captchaAnswer: '' };
          this.rvBusy = false; this.rvError = null;
          this.refreshCaptcha();
        });
      },
      error: err => {
        this.rvBusy = false;
        this.rvError = err?.message ?? 'خطا در ثبت نظر';
        this.refreshCaptcha();
      }
    });
  }

  // Reply
  startReply(reviewId: number) { this.replyingFor = reviewId; this.replyText = ''; }
  cancelReply() { this.replyingFor = null; this.replyText = ''; }

  submitReply(reviewId: number) {
    const txt = this.replyText.trim();
    if (!txt) return;
    this.replyBusy = true;
    this.reviewsApi.addReply(reviewId, { text: txt }).subscribe({
      next: _ => {
        const p = this.place(); if (!p) return;
        this.api.get(p.id).subscribe(np => {
          (this as any).place.set(np);
          this.replyBusy = false; this.cancelReply();
        });
      },
      error: _ => { this.replyBusy = false; }
    });
  }

  // Report
  report(id: number) {
    const reason = prompt('دلیل گزارش را بنویسید (اختیاری):') ?? '';
    this.reviewsApi.report(id, reason).subscribe({
      next: _ => alert('گزارش ثبت شد ✅'),
      error: _ => alert('ثبت گزارش ناموفق بود')
    });
  }
}
