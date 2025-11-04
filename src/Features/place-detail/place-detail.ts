import { ChangeDetectionStrategy, Component, computed, inject, signal, DestroyRef, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MiniMapComponent } from '../mini-map.component/mini-map.component';
import { PlaceDetailService, PlaceDetailDto, ReviewDto } from '../services/place-detail';
import { CaptchaService, CaptchaChallenge } from '../../Core/services/captcha-service';
import { ReviewsService, UserRatingResponse } from '../services/reviews-service';
import { FingerprintService } from '../../Core/services/fingerprint.service';
import { MODAL_DATA } from '../../Shared/modal/modal.tokens';
import { ModalRef } from '../../Shared/modal/modal-ref';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faCamera, faRefresh, faTv, faTimes } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../Core/services/auth.service';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog';
import { ModalService } from '../../Shared/modal/modal.service';
import { ToastService } from '../../Core/services/toast.service';
import { CategoriesService } from '../services/categories.service';
import { ImageUrlService } from '../../Core/services/image-url.service';
import { SEOService } from '../../Core/services/seo.service';
import { environment } from '../../environments/environment';
import { finalize } from 'rxjs/operators';

type ReviewVM = ReviewDto & { replies?: ReviewDto[] };

@Component({
  selector: 'app-place-detail',
  standalone: true,
  imports: [MiniMapComponent, FormsModule, FontAwesomeModule],
  templateUrl: './place-detail.html',
  styleUrl: './place-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceDetailComponent implements OnInit {
  // Icons
  facamera = faCamera;
  tv = faTv;
  faRefresh = faRefresh;
  faTimes = faTimes;

  // Services
  private route = inject(ActivatedRoute);
  private api = inject(PlaceDetailService);
  private reviewsApi = inject(ReviewsService);
  private captcha = inject(CaptchaService);
  private auth = inject(AuthService);
  private modal = inject(ModalService);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);
  private fingerprintService = inject(FingerprintService);
  private categoriesService = inject(CategoriesService);
  private imageService = inject(ImageUrlService);
  private cdr = inject(ChangeDetectorRef);
  private seoService = inject(SEOService);

  // Modal
  private modalData = inject(MODAL_DATA, { optional: true }) as { id?: number } | null;
  private modalRef = inject(ModalRef, { optional: true });

  // ======= State =======
  place = signal<PlaceDetailDto | null>(null);
  private lastPlaceId: number | null = null; // ⬅️ کش شناسه
  userRating: UserRatingResponse | null = null;
  cap: CaptchaChallenge | null = null;

  likeBusyId: number | null = null;
  ratingBusy = false;
  rvBusy = signal(false);
  rvError: string | null = null;

  // Form & rating
  rvForm = { rating: 0, text: '', captchaAnswer: '' };
  starRange = [1, 2, 3, 4, 5];
  selectedRating = 0;
  tempRating = 0;
  hoverRating = 0;
  hasUserRated = false;
  hasUserDescription = false;


  // Categories for fallback images
  readonly categories = toSignal(this.categoriesService.getActive(), { initialValue: [] });

  // ⬇️ Hard re-mount flag for the reviews section
  reviewsVisible = signal(true);

  // ======= Computeds =======
  avgInt = computed(() => Math.max(0, Math.min(5, Math.floor(this.place()?.avgRating ?? 0))));
  get pidForReload() {
    return this.place()?.id ?? this.lastPlaceId ?? this.modalData?.id ?? null;
  }

  placeImageUrl = computed(() => {
    const p = this.place();
    if (!p) return 'images/location.png';
    if (p.coverImageUrl) return p.coverImageUrl;
    const cat = this.categories().find(c => c.name === p.categoryName);
    return cat?.imageUrl ? this.imageService.getImageUrl(cat.imageUrl) : 'images/location.png';
  });

  hasCoordinates = computed(() => {
    const coords = this.place()?.coordinates;
    if (!coords) return false;
    const [lat, lng] = coords.split(',').map(s => +s.trim());
    return !Number.isNaN(lat) && !Number.isNaN(lng);
  });

  hasMapUrls = computed(() => !!(this.place()?.googleMapsUrl || this.place()?.neshanUrl));

  reviews = computed<ReviewVM[]>(() => {
    const p = this.place();
    const flat = (p?.reviews ?? []).slice();
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

  amirReview = computed(() => this.reviews().find(r => r.authorType == 1) || null);
  userReviews = computed(() => this.reviews().filter(r => r.authorType != 1));

  // ======= Lifecycle =======
  ngOnInit() { this.reload(); }

  // ------- Robust ID Resolver -------
  private parseIdFromUrl(): number | null {
    // مسیر /place/123 یا /place/123-some-slug یا query ?id=123
    const snap = this.route.snapshot;
    const paramId = snap.paramMap.get('id');
    if (paramId && /^\d+$/.test(paramId)) return +paramId;

    const qp = snap.queryParamMap.get('id');
    if (qp && /^\d+$/.test(qp)) return +qp;

    // اگر id مثل "123-xyz" بود، عدد ابتداییش را بگیر
    if (paramId) {
      const m = /^(\d+)/.exec(paramId);
      if (m) return +m[1];
    }
    return null;
  }

  private resolvePlaceId(): number | null {
    // ترتیب: آرگومان پاس‌داده‌شده به reload → lastPlaceId → modalData.id → URL
    if (this.lastPlaceId && this.lastPlaceId > 0) return this.lastPlaceId;
    if (typeof this.modalData?.id === 'number' && this.modalData.id > 0) return this.modalData.id;
    return this.parseIdFromUrl();
  }

  reload(forceId?: number) {
    const id = typeof forceId === 'number' ? forceId : this.resolvePlaceId();
    if (!id) {
      this.toastService.error('شناسهٔ مکان یافت نشد.');
      return;
    }

    this.place.set(null);
    this.rvError = null;

    this.api.get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.place.set(p);
          this.lastPlaceId = p.id;

          // Update SEO tags for this place
          this.updatePlaceSEO(p);

          // Force change detection after setting place data
          this.cdr.markForCheck();

          const afterUserRating = () => {
            // 👇 کپچا را آخر کار بگیر تا همیشه بعدِ دیتا باشد
            this.refreshCaptcha();
            // Force change detection after all data is loaded
            this.cdr.markForCheck();
          };

          if (this.isAuthed()) {
            this.reviewsApi.getUserRating(p.id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (r) => {
                  this.userRating = r;
                  this.hasUserRated = !!r.hasRated;
                  this.hasUserDescription = !!r.hasDescription;
                  if (r.hasRated) {
                    this.selectedRating = r.rating;
                    this.rvForm.rating = r.rating;
                    this.rvForm.text = r.text || '';
                  } else {
                    this.selectedRating = 0;
                    this.rvForm.rating = 0;
                    this.rvForm.text = '';
                  }
                  afterUserRating();
                },
                error: () => {
                  this.userRating = null;
                  this.hasUserRated = false;
                  this.hasUserDescription = false;
                  afterUserRating();
                }
              });
          } else {
            this.userRating = null;
            this.hasUserRated = false;
            this.hasUserDescription = false;
            this.selectedRating = 0;
            this.rvForm.rating = 0;
            afterUserRating();
          }
        },
        error: (err) => {
          console.error('❌ Error loading place:', err);
          this.toastService.error('خطا در بارگذاری اطلاعات مکان');
          this.place.set(null);
          // حتی در خطا هم کپچا را تازه کن تا UI گیر نکند
          this.refreshCaptcha();
        }
      });
  }

  // ------- Auth / Modal -------
  isAuthed = () => this.auth.isAuthenticated();

  openLogin() {
    const ref = this.modal.open(AuthDialogComponent, {
      data: { mode: 'login' },
      panelClass: ['app-modal-panel', 'app-auth-panel'],
      backdropClass: 'app-modal-backdrop'
    });
    ref.afterClosed$?.subscribe(ok => { if (ok) this.auth.loadMe(); });
  }

  // ------- Helpers -------
  parseLatLng(coords?: string | null) {
    if (!coords) return null;
    const [a, b] = coords.split(',').map(s => +s.trim());
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return { lat: a, lng: b };
  }
  gmapsDirectionUrl() { return this.place()?.googleMapsUrl || '#'; }
  neshanDirectionUrl() { return this.place()?.neshanUrl || '#'; }

  async share() {
    const p = this.place();
    const data = { title: p?.title ?? 'Tehranemoon', text: p?.description ?? '', url: location.href };
    try {
      if ((navigator as any).share) await (navigator as any).share(data);
      else { await navigator.clipboard.writeText(data.url); alert('لینک کپی شد ✅'); }
    } catch { }
  }

  // ------- Captcha -------
  refreshCaptcha() {
    this.captcha.new()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: c => { this.cap = c; this.rvForm.captchaAnswer = ''; },
        error: () => { }
      });
  }

  // ------- Rating -------
  setHover(val: number) { this.hoverRating = val; }

  setRating(v: number) {
    const p = this.place(); if (!p || this.ratingBusy || this.hasUserRated) return;
    if (v < 1 || v > 5) { this.toastService.warning('امتیاز باید بین ۱ تا ۵ باشد'); return; }

    this.ratingBusy = true;
    this.selectedRating = v;
    this.rvForm.rating = v;

    (this.reviewsApi as any).rate?.(p.id, v)
      ?.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.ratingBusy = false))
      ?.subscribe({ next: () => this.afterActionRefresh(p.id), error: () => this.afterActionRefresh(p.id) });
  }

  // ⬇️ Hard re-mount helper (for reviews)
  private remountReviews() {
    this.reviewsVisible.set(false);
    // Use setTimeout instead of queueMicrotask for more reliable timing
    setTimeout(() => {
      this.reviewsVisible.set(true);
      this.cdr.markForCheck();
    }, 10);
  }

  private afterActionRefresh(placeId?: number) {
    // همیشه آی‌دی را پاس بده تا حتی اگر place=null شد، شناسه را داشته باشیم
    const id = placeId ?? this.place()?.id ?? this.lastPlaceId ?? this.modalData?.id ?? this.parseIdFromUrl();

    // Force the reviews section to fully re-mount first
    this.remountReviews();

    // Use setTimeout to ensure DOM updates complete before reloading data
    setTimeout(() => {
      if (id) this.reload(id); else this.reload();
    }, 0);
  }

  // ------- Like / Dislike -------
  like(reviewId: number) {
    if (this.likeBusyId) return;
    const p = this.place(); if (!p) return;

    this.likeBusyId = reviewId;
    this.reviewsApi.like(reviewId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.likeBusyId = null))
      .subscribe({ next: () => this.afterActionRefresh(p.id), error: () => { } });
  }

  dislike(reviewId: number) {
    if (this.likeBusyId) return;
    const p = this.place(); if (!p) return;

    this.likeBusyId = reviewId;
    this.reviewsApi.dislike(reviewId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.likeBusyId = null))
      .subscribe({ next: () => this.afterActionRefresh(p.id), error: () => { } });
  }

  // ------- Review Submit -------
  submitReview() {
    if (!this.isAuthed()) { this.toastService.warning('برای ثبت نظر ابتدا وارد شوید.'); return; }
    const p = this.place(); if (!p) return;

    if (this.hasUserRated && this.hasUserDescription) {
      this.toastService.warning('شما قبلاً برای این مکان نظر کامل ثبت کرده‌اید.'); return;
    }
    if (!this.rvForm.captchaAnswer.trim()) {
      this.toastService.warning('کد کپچا را وارد کنید.'); return;
    }

    const ratingToSend = this.selectedRating || Number(this.rvForm.rating);
    if (!this.hasUserRated && (!ratingToSend || ratingToSend < 1 || ratingToSend > 5)) {
      this.toastService.warning('لطفاً امتیازی بین ۱ تا ۵ انتخاب کنید.'); return;
    }

    this.rvBusy.set(true); this.rvError = null;
    const fingerprint = this.fingerprintService.getFingerprint();

    this.reviewsApi.addReview(p.id, {
      placeId: p.id,
      rating: ratingToSend,
      text: (this.rvForm.text || '').trim(),
      fingerprint,
      captchaToken: this.cap?.token ?? '',
      captchaAnswer: this.rvForm.captchaAnswer
    })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.rvBusy.set(false)))
      .subscribe({
        next: _ => {
          this.toastService.success('نظر شما با موفقیت ثبت شد!');
          // Close and reopen modal for clean refresh
          this.closeAndReopenModal(p.id);
        },
        error: err => {
          this.rvError = err?.message ?? 'خطا در ثبت نظر';
          this.refreshCaptcha();
          if (err?.status === 409) { this.toastService.error('شما قبلاً برای این مکان نظر ثبت کرده‌اید.'); this.hasUserRated = true; }
          else if (err?.status === 400) { this.toastService.error('کپچا نامعتبر است.'); }
          else if (err?.status === 401) { this.toastService.error('برای ثبت نظر ابتدا وارد شوید.'); }
        }
      });
  }


  // ------- Lightbox -------
  lbxOpen = false;
  lbxItems: string[] = [];
  lbxIndex = 0;

  placeImageUrls = computed(() => (this.place()?.images ?? []).map(im => (im as any).url ?? (im as any).filePath ?? ''));
  reviewImageUrls(r: ReviewDto): string[] {
    return (r?.images ?? []).map((im: any) => im.url ?? im.filePath ?? '');
  }

  openLightbox(urls: string[], index: number) {
    if (!urls?.length) return;
    this.lbxItems = urls; this.lbxIndex = index; this.lbxOpen = true;
  }
  closeLightbox() { this.lbxOpen = false; this.lbxItems = []; this.lbxIndex = 0; }
  prevLbx(e: Event) { e.stopPropagation(); this.lbxIndex = (this.lbxIndex + this.lbxItems.length - 1) % this.lbxItems.length; }
  nextLbx(e: Event) { e.stopPropagation(); this.lbxIndex = (this.lbxIndex + 1) % this.lbxItems.length; }

  // ------- Modal close and reopen -------
  private closeAndReopenModal(placeId: number) {
    if (!this.modalRef) return;

    // Close current modal
    this.modalRef.close();

    // Reopen modal with fresh data after a short delay
    setTimeout(() => {
      this.modal.open(PlaceDetailComponent, {
        data: { id: placeId },
        panelClass: ['app-modal-panel'],
        backdropClass: 'app-modal-backdrop'
      });
    }, 100);
  }

  // ------- SEO Update -------
  private updatePlaceSEO(place: PlaceDetailDto) {
    const placeTitle = `${place.title} - تهرانمون`;
    const placeDescription = place.description
      ? `${place.description.substring(0, 150)}...`
      : `اطلاعات و نظرات کاربران درباره ${place.title} در تهران. امتیاز: ${place.avgRating?.toFixed(1) || '0'} از 5.`;

    const placeImage = place.coverImageUrl || this.placeImageUrl();
    const placeUrl = `${environment.webUrl}/place/${place.id}`;

    const keywords = `${place.title}, ${place.categoryName}, تهران, مکان‌های تهران, نظرات, امتیاز`;

    // Parse coordinates for structured data
    let geoCoordinates: any = null;
    if (place.coordinates) {
      const coords = this.parseLatLng(place.coordinates);
      if (coords) {
        geoCoordinates = {
          "@type": "GeoCoordinates",
          "latitude": coords.lat,
          "longitude": coords.lng
        };
      }
    }

    // Build structured data
    const structuredData: any = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": place.title,
      "description": place.description || `اطلاعات ${place.title} در تهران`,
      "url": placeUrl,
      "image": placeImage,
      "aggregateRating": (place.reviewCount && place.reviewCount > 0) ? {
        "@type": "AggregateRating",
        "ratingValue": place.avgRating?.toFixed(1) || "0",
        "reviewCount": place.reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      } : undefined,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Tehran",
        "addressRegion": "Tehran",
        "addressCountry": "IR"
      }
    };

    if (geoCoordinates) {
      structuredData.geo = geoCoordinates;
    }

    this.seoService.updateTags({
      title: placeTitle,
      description: placeDescription,
      keywords: keywords,
      image: placeImage,
      url: placeUrl,
      type: 'article',
      structuredData: structuredData
    });
  }

  // ------- Modal close -------
  closeModal() { if (this.modalRef) this.modalRef.close(); }
}
