import { ChangeDetectionStrategy, Component, computed, inject, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MiniMapComponent } from '../mini-map.component/mini-map.component';
import { PlaceDetailService, PlaceDetailDto, ReviewDto } from '../services/place-detail';
import { CaptchaService, CaptchaChallenge } from '../../Core/services/captcha-service';
import { ReviewsService } from '../services/reviews-service';
import { MODAL_DATA } from '../../Shared/modal/modal.tokens';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faCamera, faHeart, faRefresh } from '@fortawesome/free-solid-svg-icons'
type ReviewVM = ReviewDto & { replies?: ReviewDto[] };

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [MiniMapComponent, DatePipe, FormsModule, FontAwesomeModule],
  templateUrl: './place-detail.html',
  styleUrl: './place-detail.css',
  providers: [
    // { provide: PlaceDetailService, useClass: MockPlaceDetailService },
    // { provide: ReviewsService, useClass: MockReviewsService },
    // { provide: CaptchaService, useClass: MockCaptchaService },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceDetailComponent {

  facamera = faCamera;
  faheart = faHeart;
  faRefresh = faRefresh;
  private route = inject(ActivatedRoute);
  private api = inject(PlaceDetailService);
  private reviewsApi = inject(ReviewsService);
  private captcha = inject(CaptchaService);
  private modalData = inject(MODAL_DATA, { optional: true }) as { id?: number } | null;
  likeBusyId: number | null = null;
  favOn = false;
  favBusy = false;
  // ---------- place ----------
  readonly place = toSignal<PlaceDetailDto | null>(
    (this.modalData?.id
      ? this.api.get(this.modalData.id)
      : this.route.paramMap.pipe(map(pm => Number(pm.get('id'))), switchMap(id => this.api.get(id)))
    ),
    { initialValue: null }
  );
  // میانگین را به 1..5 تبدیل کن (بدون اعشار)
  avgInt = () => {
    const a = this.place()?.avgRating ?? 0;
    // اگر avg از 0..5 است:
    return Math.max(0, Math.min(5, Math.floor(a)));
  };
  // ---------- reviews (threaded) ----------
  readonly reviews = computed<ReviewVM[]>(() => {
    const flat = (this.place()?.reviews ?? []).slice();
    const byParent = new Map<number | null, ReviewDto[]>();
    for (const r of flat) {
      const k = (r.parentId ?? null);
      const bucket = byParent.get(k) ?? [];
      bucket.push(r);
      byParent.set(k, bucket);
    }
    const roots = (byParent.get(null) ?? []);
    roots.sort((a, b) => {
      const pa = a.authorType === 'AmirAli' ? 0 : 1;
      const pb = b.authorType === 'AmirAli' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return +new Date(b.createdAtUtc) - +new Date(a.createdAtUtc);
    });
    return roots.map(r => ({
      ...r,
      replies: (byParent.get(r.id) ?? []).sort((a, b) => +new Date(a.createdAtUtc) - +new Date(b.createdAtUtc))
    }));
  });

  // ---------- favorite logic (localStorage demo؛ سمت سرور وصل کن) ----------
  favLabel = 'افزودن به لیست مورد علاقه';
  favTitle = '';
  favDisabled = false;

  private FAVORITES_KEY = 'fav/v1'; // { [categorySlug]: number[] }

  private readFav(): Record<string, number[]> {
    try { return JSON.parse(localStorage.getItem(this.FAVORITES_KEY) || '{}'); }
    catch { return {}; }
  }
  private writeFav(d: Record<string, number[]>) {
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(d));
  }
  private refreshFavState() {
    const p = this.place(); if (!p) return;
    const slug = (p.categoryName || '').toString().trim();
    const store = this.readFav();
    const list = store[slug] ?? [];
    const has = list.includes(p.id);
    const left = Math.max(0, 5 - list.length);
    this.favOn = has;
    this.favLabel = has ? 'در علاقه‌مندی‌ها هست' : 'افزودن به لیست مورد علاقه';
    this.favTitle = has ? 'قبلاً اضافه شده' : (left ? `می‌توانید ${left} مورد دیگر برای این دسته اضافه کنید` : 'حداکثر ۵ مورد برای هر دسته');
    this.favDisabled = !has && list.length >= 5;
  }


  like(reviewId: number) {
    if (this.likeBusyId) return;
    this.likeBusyId = reviewId;
    this.reviewsApi.like(reviewId).subscribe({
      next: _ => this.refreshPlaceAfterAction(),
      error: _ => this.likeBusyId = null
    });
  }

  dislike(reviewId: number) {
    if (this.likeBusyId) return;
    this.likeBusyId = reviewId;
    this.reviewsApi.dislike(reviewId).subscribe({
      next: _ => this.refreshPlaceAfterAction(),
      error: _ => this.likeBusyId = null
    });
  }
  private refreshPlaceAfterAction() {
    const p = this.place(); if (!p) { this.likeBusyId = null; return; }
    this.api.get(p.id).subscribe(np => { (this as any).place.set(np); this.likeBusyId = null; });
  }
  toggleFavorite() {
    const p = this.place(); if (!p) return;
    const slug = (p.categoryName || '').toString().trim();
    const store = this.readFav();
    const list = store[slug] ?? [];

    // اگر هست حذف؛ اگر نیست اضافه (با سقف ۵)
    if (this.favOn) {
      store[slug] = list.filter(id => id !== p.id);
    } else {
      if (list.length >= 5) { this.refreshFavState(); return; }
      if (!list.includes(p.id)) list.push(p.id);
      store[slug] = list;
    }
    this.writeFav(store);
    this.refreshFavState();
  }

  // همگام‌سازی وضعیت علاقه‌مندی وقتی place لود شد
  constructor() {
    this.refreshCaptcha();
    effect(() => { if (this.place()) this.refreshFavState(); });
  }

  // ---------- rating (interactive) ----------
  starRange = [1, 2, 3, 4, 5];
  selectedRating = 0;         // امتیاز فعلی کاربر برای این مکان (اگر صفر = هنوز نداده)
  tempRating = 0;             // برای hover
  ratingBusy = false;

  setHover(val: number) {
    this.hoverRating = val;
  }
  setRating(v: number) {
    const p = this.place(); if (!p || this.ratingBusy) return;
    this.ratingBusy = true;

    this.selectedRating = v;     // ← برای نمایش بعد از کلیک
    this.rvForm.rating = v;      // ← برای ارسال به API
    (this.reviewsApi as any).rate?.(p.id, v)?.subscribe?.({
      next: () => this.afterRateSaved(p.id, v),
      error: () => this.afterRateSaved(p.id, v) // برای دمو
    }) ?? this.afterRateSaved(p.id, v);
  }

  private afterRateSaved(placeId: number, v: number) {
    this.selectedRating = v;
    this.tempRating = v;
    this.ratingBusy = false;

    // رفرش لیست/میانگین
    this.api.get(placeId).subscribe(np => (this as any).place.set(np));
  }

  // ---------- review text (اختیاری) ----------
  rvForm = { rating: 0, text: '', captchaAnswer: '' };
  rvBusy = false;
  rvError: string | null = null;
  cap: CaptchaChallenge | null = null;
  hoverRating = 0;

  // Reply
  replyingFor: number | null = null;
  replyText = '';
  replyBusy = false;

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
    return `https://neshan.org/maps/search/${ll.lat},${ll.lng}`;
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

  // ثبت متنِ نظر (rating قبلاً ذخیره شده؛ اگر هم ذخیره نشده بود، از selectedRating استفاده می‌کنیم)
  submitReview() {
    const p = this.place(); if (!p) return;
    if (!this.rvForm.captchaAnswer.trim()) { this.rvError = 'کد کپچا را وارد کنید.'; return; }

    const ratingToSend = this.selectedRating || Number(this.rvForm.rating) || 0;

    this.rvBusy = true; this.rvError = null;
    this.reviewsApi.addReview(p.id, {
      rating: ratingToSend,
      text: (this.rvForm.text || '').trim(),
      captchaToken: this.cap?.token ?? '',
      captchaAnswer: this.rvForm.captchaAnswer
    }).subscribe({
      next: _ => {
        this.api.get(p.id).subscribe(np => {
          (this as any).place.set(np);
          this.rvForm = { rating: 0, text: '', captchaAnswer: '' };
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
        this.api.get(p.id).subscribe(np => { (this as any).place.set(np); this.replyBusy = false; this.cancelReply(); });
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

  // ---------- Lightbox ----------
  lbxOpen = false;
  lbxItems: string[] = [];
  lbxIndex = 0;
  placeImageUrls(): string[] {
    const p = this.place();
    return (p?.images ?? []).map(im => (im as any).url ?? (im as any).filePath ?? '');
  }

  // آرایهٔ URLهای گالریِ عکس‌های یک نظر
  reviewImageUrls(r: ReviewDto): string[] {
    return (r?.images ?? []).map((im: any) => im.url ?? im.filePath ?? '');
  }
  openLightbox(urls: string[], index: number) {
    if (!urls?.length) return;
    this.lbxItems = urls;
    this.lbxIndex = index;
    this.lbxOpen = true;
  }
  closeLightbox() { this.lbxOpen = false; this.lbxItems = []; this.lbxIndex = 0; }
  prevLbx(e: Event) { e.stopPropagation(); this.lbxIndex = (this.lbxIndex + this.lbxItems.length - 1) % this.lbxItems.length; }
  nextLbx(e: Event) { e.stopPropagation(); this.lbxIndex = (this.lbxIndex + 1) % this.lbxItems.length; }
}
