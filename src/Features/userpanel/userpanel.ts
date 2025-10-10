import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Core/services/auth.service';
import { of, catchError, forkJoin, map } from 'rxjs';
import { PlaceDetailDto, PlaceDetailService } from '../services/place-detail';
import { CategoriesService, CategoryDto } from '../services/categories.service';

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
  private fb = inject(FormBuilder);

  favGroups = signal<FavoriteGroup[]>([]);
  private FAVORITES_KEY = 'fav/v1';
  mode = signal<'login' | 'register'>('login');
  isAuthed = () => this.auth.isAuthenticated();
  username = 'ALI';
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

  private loadFavoritesGroupedByCategories() {
    // خواندن localStorage: { [slug]: number[] }
    let store: Record<string, number[]> = {};
    try { store = JSON.parse(localStorage.getItem(this.FAVORITES_KEY) || '{}'); } catch { store = {}; }

    this.catsApi.getActive().subscribe({
      next: (cats: CategoryDto[]) => {
        // برای هر کتگوری، تا 3 آیتم علاقه‌مندی همان اسلاگ را می‌گیریم
        const perCatLoaders = cats.map(cat => {
          const slug = cat.slug;
          const favIds = (store[slug] ?? []).slice(0, 3); // فقط 3 تا برای نمایش

          // اگر خالی بود هم یک آرایه‌ی خالی برمی‌گردانیم که ردیف ساخته شود
          const calls = favIds.length
            ? favIds.map(id => this.placesApi.get(id).pipe(catchError(() => of(null))))
            : [of(null)];

          return forkJoin(calls).pipe(
            map(results => {
              const items: Favorite[] = (results || [])
                .filter((p): p is PlaceDetailDto => !!p)
                .map(p => ({
                  id: p.id,
                  title: p.title,
                  poster: p.coverImageUrl || 'images/location.png',
                  rating: (p.avgRating ?? 0)
                }));

              const group: FavoriteGroup = {
                category: cat.name,
                // categoryImage: (cat.thumbUrl || cat.imageUrl || 'images/location.png') as string,
                items
              };
              return group;
            })
          );
        });

        forkJoin(perCatLoaders).subscribe(groups => {
          // همان ترتیب کتگوری‌ها (یا اگر displayOrder داری، backend همان‌جا سورت کند)
          this.favGroups.set(groups);
        });
      },
      error: _ => this.favGroups.set([])
    });
  }
  switchMode(to: 'login' | 'register') { this.mode.set(to); }

  async doLogin() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    const ok = await this.auth.login(this.loginForm.value as any);
    if (!ok) alert('ورود ناموفق بود.');
  }

  async doRegister() {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    const { password, confirmPassword, ...rest } = this.registerForm.value as any;
    if (password !== confirmPassword) { alert('پسورد و تکرار آن برابر نیست.'); return; }
    const ok = await this.auth.register({ ...rest, password });
    if (!ok) alert('ثبت‌نام ناموفق بود.');
  }

  openTile(tile?: { title: string; poster: string } | null) {
    if (!tile) return;
    console.log('open', tile.title);
  }
}
