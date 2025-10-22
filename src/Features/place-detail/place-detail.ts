import { ChangeDetectionStrategy, Component, computed, inject, effect, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MiniMapComponent } from '../mini-map.component/mini-map.component';
import { PlaceDetailService, PlaceDetailDto, ReviewDto } from '../services/place-detail';
import { CaptchaService, CaptchaChallenge } from '../../Core/services/captcha-service';
import { ReviewsService } from '../services/reviews-service';
import { MODAL_DATA } from '../../Shared/modal/modal.tokens';
import { ModalRef } from '../../Shared/modal/modal-ref';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faCamera, faHeart, faRefresh, faTv, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FavoritesService } from '../services/favorites.service';
import { AuthService } from '../../Core/services/auth.service';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog';
import { ModalService } from '../../Shared/modal/modal.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../Core/services/toast.service';

type ReviewVM = ReviewDto & { replies?: ReviewDto[] };

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [MiniMapComponent, FormsModule, FontAwesomeModule],
  templateUrl: './place-detail.html',
  styleUrl: './place-detail.css',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceDetailComponent {

  facamera = faCamera;
  tv = faTv;
  faheart = faHeart;
  faRefresh = faRefresh;
  faTimes = faTimes;
  private route = inject(ActivatedRoute);
  private api = inject(PlaceDetailService);
  private reviewsApi = inject(ReviewsService);
  private captcha = inject(CaptchaService);
  private favApi = inject(FavoritesService);
  private auth = inject(AuthService);
  private modal = inject(ModalService);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  private modalData = inject(MODAL_DATA, { optional: true }) as { id?: number } | null;
  private modalRef = inject(ModalRef, { optional: true });
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

  avgInt = () => {
    const a = this.place()?.avgRating ?? 0;
    return Math.max(0, Math.min(5, Math.floor(a)));
  };

  // ---------- reviews (threaded) ----------
  readonly reviews = computed<ReviewVM[]>(() => {
    const flat = (this.place()?.reviews ?? []).slice();
    const byParent = new Map<number | null, ReviewDto[]>();
    for (const r of flat) {
      const k = (r.parentId ?? null);
      (byParent.get(k) ?? byParent.set(k, []).get(k)!).push(r);
    }
    const roots = (byParent.get(null) ?? []).slice().sort((a, b) => {
      const pa = a.authorType === 1 ? 0 : 1;
      const pb = b.authorType === 1 ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return +new Date(b.createdAtUtc) - +new Date(a.createdAtUtc);
    });
    return roots.map(r => ({
      ...r,
      replies: (byParent.get(r.id) ?? []).sort((a, b) => +new Date(a.createdAtUtc) - +new Date(b.createdAtUtc))
    }));
  });

  favLabel = 'افزودن به لیست مورد علاقه';
  favTitle = '';
  favDisabled = false;
  amirReview = computed(() => this.reviews().find(r => r.authorType == 1) || null);
  userReviews = computed(() => this.reviews().filter(r => r.authorType != 1));
  private FAVORITES_KEY = 'fav/v1';

  openLogin() {
    const ref = this.modal.open(AuthDialogComponent, {
      data: { mode: 'login' },
      panelClass: ['app-modal-panel', 'app-auth-panel'],
      backdropClass: 'app-modal-backdrop'
    });
    ref.afterClosed$?.subscribe((ok) => {
      if (ok) { this.auth.loadMe(); }
    });
  }

  private refreshFavState() {
    const p = this.place(); if (!p) return;
    this.favBusy = true;
    this.favApi.has(p.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: has => { this.favOn = has; this.favBusy = false; },
      error: _ => { this.favOn = false; this.favBusy = false; }
    });
    this.favLabel = this.favOn ? 'در علاقه‌مندی‌ها هست' : 'افزودن به لیست مورد علاقه';
  }

  like(reviewId: number) {
    if (this.likeBusyId) return;
    this.likeBusyId = reviewId;
    this.reviewsApi.like(reviewId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: any) => {
        const r = (this.place()?.reviews ?? []).find(x => x.id === reviewId);
        if (r) { r.likes = res.likes; r.dislikes = res.dislikes; (this as any).place.set(this.place()!); }
        this.likeBusyId = null;
      },
      error: _ => { this.likeBusyId = null; }
    });
  }

  dislike(reviewId: number) {
    if (this.likeBusyId) return;
    this.likeBusyId = reviewId;
    this.reviewsApi.dislike(reviewId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: any) => {
        const r = (this.place()?.reviews ?? []).find(x => x.id === reviewId);
        if (r) { r.likes = res.likes; r.dislikes = res.dislikes; (this as any).place.set(this.place()!); }
        this.likeBusyId = null;
      },
      error: _ => { this.likeBusyId = null; }
    });
  }

  private refreshPlaceAfterAction() {
    const p = this.place(); if (!p) { this.likeBusyId = null; return; }
    this.api.get(p.id).subscribe(np => {
      (this as any).place.set(np);
      this.likeBusyId = null;
    });
  }

  toggleFavorite() {
    const p = this.place(); if (!p || this.favBusy) return;
    this.favBusy = true;
    const done = (ok = true) => {
      this.favBusy = false;
      this.refreshFavState();
    };
    const call$ = this.favOn ? this.favApi.remove(p.id) : this.favApi.add(p.id);
    call$.subscribe({
      next: () => done(),
      error: (err) => {
        if (err?.message?.includes('حداکثر ۳')) alert('حداکثر ۳ مورد در هر دسته می‌توانید ثبت کنید.');
        done(false);
      }
    });
  }

  constructor() {
    this.refreshCaptcha();
    effect(() => { if (this.place()) this.refreshFavState(); });
  }

  // ---------- rating (interactive) ----------
  starRange = [1, 2, 3, 4, 5];
  selectedRating = 0;
  tempRating = 0;
  ratingBusy = false;

  setHover(val: number) {
    this.hoverRating = val;
  }
  setRating(v: number) {
    const p = this.place(); if (!p || this.ratingBusy) return;
    this.ratingBusy = true;
    this.selectedRating = v;
    this.rvForm.rating = v;
    (this.reviewsApi as any).rate?.(p.id, v)?.subscribe?.({
      next: () => this.afterRateSaved(p.id, v),
      error: () => this.afterRateSaved(p.id, v)
    }) ?? this.afterRateSaved(p.id, v);
  }

  private afterRateSaved(placeId: number, v: number) {
    this.selectedRating = v;
    this.tempRating = v;
    this.ratingBusy = false;
    this.api.get(placeId).subscribe(np => (this as any).place.set(np));
  }

  // ---------- review text ----------
  rvForm = { rating: 0, text: '', captchaAnswer: '' };
  rvBusy = signal(false);
  rvError: string | null = null;
  cap: CaptchaChallenge | null = null;
  hoverRating = 0;

  // Reply
  replyingFor: number | null = null;
  replyText = '';
  replyBusy = false;
  isAuthed = () => this.auth.isAuthenticated();

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
    return this.place()?.googleMapsUrl;
  }
  neshanDirectionUrl() {
    const ll = this.parseLatLng(this.place()?.coordinates); if (!ll) return '#';
    return this.place()?.neshanUrl;
  }

  async share() {
    const p = this.place();
    const data = { title: p?.title ?? 'Tehranemoon', text: p?.description ?? '', url: location.href };
    try {
      if ((navigator as any).share) await (navigator as any).share(data);
      else { await navigator.clipboard.writeText(data.url); alert('لینک کپی شد ✅'); }
    } catch { /* silent */ }
  }

  // CAPTCHA
  refreshCaptcha() {
    this.captcha.new().subscribe(c => {
      this.cap = c;
      this.rvForm.captchaAnswer = '';
    });
  }

  submitReview() {
    if (!this.isAuthed()) {
      this.toastService.warning('برای ثبت نظر ابتدا وارد شوید.');
      return;
    }
    const p = this.place(); if (!p) return;
    if (!this.rvForm.captchaAnswer.trim()) {
      this.toastService.warning('کد کپچا را وارد کنید.');
      return;
    }

    const ratingToSend = this.selectedRating || Number(this.rvForm.rating) || 0;

    this.rvBusy.set(true);
    this.rvError = null;
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
          this.selectedRating = 0;
          this.rvBusy.set(false);
          this.rvError = null;
          this.refreshPlaceAfterAction();
          this.refreshCaptcha();
          this.toastService.success('نظر شما با موفقیت ثبت شد!');
          window.location.reload()
        });
      },
      error: err => {
        this.rvBusy.set(false);
        this.rvError = err?.message ?? 'خطا در ثبت نظر';
        this.refreshCaptcha();
        // Toast will be shown automatically by the error interceptor
      }, complete: () => {
        this.rvBusy.set(false);
        this.rvError = null;
        this.refreshPlaceAfterAction();
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

  // Close modal method
  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }
}
