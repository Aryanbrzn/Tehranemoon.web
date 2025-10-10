import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Core/services/auth.service';
import { of, catchError, forkJoin, map } from 'rxjs';
import { PlaceDetailDto, PlaceDetailService } from '../services/place-detail';
import { CategoriesService, CategoryDto } from '../services/categories.service';
import type html2canvasType from 'html2canvas';
import { FavoriteItem, FavoritesService } from '../services/favorites.service';
import { ModalService } from '../../Shared/modal/modal.service';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog';

type Favorite = { id: number; title: string; poster: string; rating: number };
type FavoriteGroup = { category: string; items: Favorite[] };
type Activity =
  | { kind: 'rated'; title: string; poster: string; rating: number; when: string }
  | { kind: 'review'; title: string; poster: string; when: string }
  | { kind: 'photo'; title: string; poster: string; count: number; when: string };

type Tile = { title: string; poster: string };

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
  private placesApi = inject(PlaceDetailService);
  private catsApi = inject(CategoriesService);
  private favApi = inject(FavoritesService);
  private modal = inject(ModalService);

  private fb = inject(FormBuilder);
  @ViewChild('captureEl') captureRef!: ElementRef<HTMLElement>;

  favGroups = signal<FavoriteGroup[]>([]);
  private FAVORITES_KEY = 'fav/v1';
  mode = signal<'login' | 'register'>('login');
  isAuthed = () => this.auth.isAuthenticated();
  userName = computed(() => this.auth.user()?.userName ?? 'کاربر');
  authOpen = false;

  async openAuth(initial: 'login' | 'register' = 'login') {
    const ref = this.modal.open(AuthDialogComponent, {
      data: { mode: initial },
      panelClass: ['app-modal-panel', 'app-auth-panel'], // اختیاری: کلاس اضافه
      backdropClass: 'app-modal-backdrop',
      closeOnBackdrop: true,
      closeOnEscape: true,
      maxWidth: '95vw',
      maxHeight: '90vh'
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.auth.loadMe();
        this.loadFavoritesGroupedByCategories();
      }
    });
  } closeAuth() { this.authOpen = false; }
  avatar = 'images/avatar.png';
  loginForm = this.fb.group({
    userNameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  registerForm = this.fb.group({
    userName: ['', [Validators.required, Validators.maxLength(250)]],
    email: ['', [Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });
  favorites: Favorite[] = [
    { id: 1, title: 'لمیز', poster: 'images/restaurant.png', rating: 5 },
    { id: 2, title: 'کای', poster: 'images/coffee.png', rating: 5 },
    { id: 3, title: 'پارک نیاوران', poster: 'images/location.png', rating: 4.5 },
    { id: 4, title: 'کافه اتوبوسی', poster: 'images/restaurant.png', rating: 5 },
  ];
  activities: Activity[] = [
    { kind: 'rated', title: 'پارک آب‌و‌آتش', poster: 'images/location.png', rating: 4.5, when: '۲ ساعت پیش' },
    { kind: 'review', title: 'کای', poster: 'images/restaurant.png', when: 'دیروز' },
    { kind: 'photo', title: 'پل طبیعت', poster: 'images/location.png', count: 3, when: '۱ هفته پیش' },
  ];

  categories: any[] = [
    {
      catId: 1,
      title: 'کافه',
      poster: 'images/location.png'
    },
    {
      catId: 2,
      title: 'رستوران',
      poster: 'images/location.png'
    },
    {
      catId: 3,
      title: 'مکان',
      poster: 'images/location.png'
    }
  ];

  favoritesList: any[] = [
    {
      catId: 1,
      name: 'لمیز',
      poster: 'images/location.png'
    },
    {
      catId: 1,
      name: 'کای',
      poster: 'images/location.png'
    },
    {
      catId: 1,
      name: 'ساعدی نیا',
      poster: 'images/location.png'
    },
    {
      catId: 2,
      name: 'سنسو',
      poster: 'images/location.png'
    },
    {
      catId: 2,
      name: 'شیلا',
      poster: 'images/location.png'
    },
    {
      catId: 2,
      name: 'فلافلی',
      poster: 'images/location.png'
    },
    {
      catId: 3,
      name: 'پارک',
      poster: 'images/location.png'
    },
    {
      catId: 3,
      name: 'دریاچه',
      poster: 'images/location.png'
    },

    {
      catId: 3,
      name: 'دریاچه',
      poster: 'images/location.png'
    }
  ];

  grid = computed<Tile[] | (Tile | null)[]>(() => {
    const favs: Tile[] = this.favorites.map(f => ({ title: f.title, poster: f.poster }));
    const acts: Tile[] = this.activities.map(a => ({ title: a.title, poster: a.poster }));
    const merged = [...favs, ...acts].slice(0, 12);
    while (merged.length < 9) merged.push(null as any);
    return merged;
  });

  ngOnInit() {
    this.auth.loadMe();
    this.loadFavoritesGroupedByCategories();
  }
  Favorites(catId: number) {
    return this.favoritesList.filter(x => x.catId == catId);
  }
  private async captureBlob(): Promise<Blob> {
    const el = this.captureRef?.nativeElement;
    if (!el) throw new Error('capture element not ready');
    // لود تنبلِ html2canvas
    const html2canvas = (await import('html2canvas')).default as typeof html2canvasType;

    const scale = Math.min(2, window.devicePixelRatio || 1);
    const canvas = await html2canvas(el, {
      backgroundColor: '#183049',   // بک‌گراند شفاف؛ اگه سفید میخوای null رو "#fff" کن
      useCORS: true,
      scale,
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
      ignoreElements: (node) =>
        node instanceof HTMLElement && !!node.closest('[data-no-capture]')
    });

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpg', 0.95);
    });
  }

  async downloadPanel() {
    try {
      const blob = await this.captureBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-panel-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('دانلود عکس انجام نشد.');
    }
  }

  async sharePanel() {
    try {
      const blob = await this.captureBlob();
      const file = new File([blob], 'user-panel.png', { type: 'image/png' });
      const navAny: any = navigator;

      if (navAny.canShare?.({ files: [file] }) && navAny.share) {
        await navAny.share({ files: [file], title: 'پنل کاربری من' });
      } else {
        // اگر Web Share پشتیبانی نشه، دانلود می‌کنیم
        await this.downloadPanel();
      }
    } catch (e) {
      console.error(e);
      // fallback
      await this.downloadPanel();
    }
  }

  private loadFavoritesGroupedByCategories() {
    this.catsApi.getActive().subscribe({
      next: cats => {
        // 1) همه‌ی دسته‌ها را برای UI خالی آماده کن
        const baseGroups = cats.map(c => ({
          category: c.name,
          categoryId: c.id,
          items: [] as Favorite[]
        }));

        // 2) از سرور بخوان
        this.favApi.getAll().subscribe({
          next: (items: FavoriteItem[]) => {
            // تبدیل به ساختار مورد نیاز کارت‌ها
            const byCat = new Map<number, Favorite[]>();
            for (const g of baseGroups) byCat.set(g.categoryId, []);

            for (const it of items) {
              const arr = byCat.get(it.categoryId);
              if (!arr) continue;
              if (arr.length >= 3) continue; // فقط تا 3 نمایش
              arr.push({
                id: it.placeId,
                title: it.title,
                poster: it.coverImageUrl || 'images/location.png',
                rating: it.avgRating ?? 0
              });
            }

            // 3) به همان ترتیب دسته‌ها خروجی بده (اگر هیچ علاقه‌مندی نداشت، آیتم‌ها خالی می‌ماند)
            const groups = baseGroups.map(g => ({
              category: g.category,
              items: byCat.get(g.categoryId) ?? []
            }));
            this.favGroups.set(groups);

            // اگر از favoritesList استفاده می‌کنی برای حلقه‌ی فعلی UI:
            this.favoritesList = items.map(it => ({
              catId: it.categoryId,
              name: it.title,
              poster: it.coverImageUrl || 'images/location.png'
            }));
          },
          error: _ => this.favGroups.set(baseGroups.map(g => ({ category: g.category, items: [] })))
        });
      },
      error: _ => this.favGroups.set([])
    });
  }

  switchMode(to: 'login' | 'register') { this.mode.set(to); }

  async doLogin() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    const ok = await this.auth.login(this.loginForm.value as any);
    if (!ok) { alert('ورود ناموفق بود.'); return; }
    this.closeAuth();
  }

  async doRegister() {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    const { password, confirmPassword, ...rest } = this.registerForm.value as any;
    if (password !== confirmPassword) { alert('پسورد و تکرار آن برابر نیست.'); return; }
    const ok = await this.auth.register({ ...rest, password });
    if (!ok) { alert('ثبت‌نام ناموفق بود.'); return; }
    // می‌تونی بعد از ثبت‌نام خودکار لاگین کنی:
    // await this.auth.login({ userNameOrEmail: rest.userName, password });
    this.switchMode('login');
  }

  openTile(tile?: { title: string; poster: string } | null) {
    if (!tile) return;
    console.log('open', tile.title);
  }
}
