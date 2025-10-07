import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Core/services/auth.service';

type Favorite = { id: number; title: string; poster: string; rating: number };
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
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  // تب فعلی فرم
  mode = signal<'login' | 'register'>('login');
  isAuthed = () => this.auth.isAuthenticated();

  // پروفایل نمایشی
  username = 'ALI';
  avatar = 'images/avatar.png';

  // فرم‌ها
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

  // داده‌ی نمونه (می‌تونی از API خودت پرش کنی)
  favorites: Favorite[] = [
    { id: 1, title: 'لمیز', poster: 'images/restaurant.jpg', rating: 5 },
    { id: 2, title: 'کای', poster: 'images/coffee.jpg', rating: 5 },
    { id: 3, title: 'پارک نیاوران', poster: 'images/location.jpg', rating: 4.5 },
    { id: 4, title: 'کافه اتوبوسی', poster: 'images/restaurant.jpg', rating: 5 },
  ];
  activities: Activity[] = [
    { kind: 'rated', title: 'پارک آب‌و‌آتش', poster: 'images/location.jpg', rating: 4.5, when: '۲ ساعت پیش' },
    { kind: 'review', title: 'کای', poster: 'images/restaurant.jpg', when: 'دیروز' },
    { kind: 'photo', title: 'پل طبیعت', poster: 'images/location.jpg', count: 3, when: '۱ هفته پیش' },
  ];

  /** ۱۲ اسلات: ابتدا علاقه‌مندی‌ها، بعد فعالیت‌ها، بقیه خالی */
  grid = computed<Tile[] | (Tile | null)[]>(() => {
    const favs: Tile[] = this.favorites.map(f => ({ title: f.title, poster: f.poster }));
    const acts: Tile[] = this.activities.map(a => ({ title: a.title, poster: a.poster }));
    const merged = [...favs, ...acts].slice(0, 12);
    while (merged.length < 9) merged.push(null as any);
    return merged;
  });

  ngOnInit() {
    this.auth.loadMe();
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

  openTile(tile?: Tile | null) {
    if (!tile) return; // اسلات خالی
    // TODO: می‌تونی اینجا ناوبری به صفحه‌ی مکان/کافه را انجام بدهی
    // this.router.navigate(['/place', someId]);
    console.log('open', tile.title);
  }
}
