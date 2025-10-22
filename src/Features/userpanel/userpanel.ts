import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed,
  ViewChild, ElementRef,
  effect
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Core/services/auth.service';
import type html2canvasType from 'html2canvas';
import { FavoriteItem, FavoritesService } from '../services/favorites.service';
import { CategoriesService } from '../services/categories.service';
import { ModalService } from '../../Shared/modal/modal.service';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog';
import { FavoritePickerDialogComponent, FavoritePickResult } from './favorite-picker/favorite-picker';
import { ImageService } from '../../Core/services/image.service';

type Favorite = { id: number; title: string; poster: string; rating: number };

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './userpanel.html',
  styleUrl: './userpanel.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPanelComponent implements OnInit {


  auth = inject(AuthService);
  private catsApi = inject(CategoriesService);
  private favApi = inject(FavoritesService);
  private modal = inject(ModalService);
  private fb = inject(FormBuilder);
  private imageService = inject(ImageService);

  @ViewChild('captureEl') captureRef!: ElementRef<HTMLElement>;
  catsLoading = signal(true);
  // ---- state
  userName = computed(() => this.auth.user()?.userName ?? 'کاربر');
  isAuthed = () => this.auth.isAuthenticated();
  categories = signal<{ catId: number; title: string; poster: string }[]>([]);
  favByCat = signal<Map<number, Favorite[]>>(new Map());

  // فرمول رندر: برای هر کتگوری آرایه‌ای از 3 خانه (یا favor یا null)
  rowSlots = (catId: number): (Favorite | null)[] => {
    const items = (this.favByCat().get(catId) ?? []).slice(0, 3);
    while (items.length < 3) items.push(null as any);
    return items as (Favorite | null)[];
  };

  // ---- معمول‌های قبلی (دانلود/اشتراک/کپچر)
  private async captureBlob(): Promise<Blob> {
    const el = this.captureRef?.nativeElement;
    const html2canvas = (await import('html2canvas')).default as typeof html2canvasType;
    const scale = Math.min(2, window.devicePixelRatio || 1);
    const canvas = await html2canvas(el, {
      backgroundColor: '#183049',
      useCORS: true, scale, logging: false,
      windowWidth: el.scrollWidth, windowHeight: el.scrollHeight,
      ignoreElements: (node) => node instanceof HTMLElement && !!node.closest('[data-no-capture]')
    });
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpg', 0.95));
  }
  async downloadPanel() {
    try {
      const blob = await this.captureBlob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `user-panel-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { alert('دانلود عکس انجام نشد.'); }
  }
  async sharePanel() {
    try {
      const blob = await this.captureBlob();
      const file = new File([blob], 'user-panel.png', { type: 'image/png' });
      const navAny: any = navigator;
      if (navAny.canShare?.({ files: [file] }) && navAny.share) await navAny.share({ files: [file], title: 'پنل کاربری من' });
      else await this.downloadPanel();
    } catch { await this.downloadPanel(); }
  }

  // ---- lifecycle
  ngOnInit() {
    this.auth.loadMe();
    this.loadCategoriesAndFavorites();
  }
  constructor() {
    effect(() => {
      const user = this.auth.user();        // <— سیگنال (auth.user() باید سیگنال باشد)
      const cats = this.categories();       // <— سیگنال
      if (user && cats.length) this.refreshFavorites();
    });
  }
  private loadCategoriesAndFavorites() {
    this.catsApi.getActive().subscribe({
      next: cats => {
        this.categories.set(
          cats.map(c => ({
            catId: c.id,
            title: c.name,
            poster: this.imageService.getImageUrl(c.imageUrl)
          }))
        );
        // اینجا لازم نیست refreshFavorites صدا بزنی؛ effect بالایی خودش بعد از set تریگر می‌شود.
      },
      error: _ => { this.categories.set([]); this.favByCat.set(new Map()); },
      complete: () => this.catsLoading.set(false),
    });
  }

  private refreshFavorites() {
    this.favApi.getAll().subscribe({
      next: (items: FavoriteItem[]) => {
        const map = new Map<number, Favorite[]>();
        for (const c of this.categories()) map.set(c.catId, []);
        for (const it of items) {
          const arr = map.get(it.categoryId); if (!arr) continue;
          if (arr.length >= 3) continue;
          arr.push({
            id: it.placeId,
            title: it.title,
            poster: this.imageService.getImageUrl(it.coverImageUrl || 'images/location.png'),
            rating: it.avgRating ?? 0
          });
        }
        this.favByCat.set(map); // ✅ سیگنال set -> OnPush تریگر می‌شود
      },
      error: _ => {
        const map = new Map<number, Favorite[]>();
        for (const c of this.categories()) map.set(c.catId, []);
        this.favByCat.set(map);
      }
    });
  }

  // ---- مودال احراز هویت
  async openAuth(initial: 'login' | 'register' = 'login') {
    const ref = this.modal.open(AuthDialogComponent, {
      data: { mode: initial },
      panelClass: ['app-modal-panel', 'app-auth-panel'],
      backdropClass: 'app-modal-backdrop'
    });
    ref.afterClosed$?.subscribe((ok) => {
      if (ok) { this.auth.loadMe(); this.refreshFavorites(); }
    });
  }

  // ---- بازکردن مودال انتخاب علاقه‌مندی برای یک کتگوری
  openFavoritePicker(categoryId: number) {
    if (!this.isAuthed()) { this.openAuth('login'); return; }

    const ref = this.modal.open(FavoritePickerDialogComponent, {
      data: { categoryId },
      panelClass: ['app-modal-panel', 'app-auth-panel'],
      backdropClass: 'app-modal-backdrop'
    }) as unknown as import('../../Shared/modal/modal-ref').ModalRef<FavoritePickResult>;

    ref.afterClosed$.subscribe((res: FavoritePickResult | undefined) => {
      if (!res?.placeId) return;
      this.favApi.add(res.placeId).subscribe({
        next: () => this.refreshFavorites(),
        error: () => this.refreshFavorites()
      });
    });
  }

  openTile(title?: string) { if (!title) return; console.log('open', title); }

  // (فرم‌های قبلی اگر جایی استفاده می‌شدند، می‌تونی نگه داری)
  loginForm = this.fb.group({ userNameOrEmail: ['', [Validators.required]], password: ['', [Validators.required, Validators.minLength(6)]] });
  registerForm = this.fb.group({
    userName: ['', [Validators.required, Validators.maxLength(250)]],
    email: ['', [Validators.email]], phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });
}
