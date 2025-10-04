import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Core/services/auth.service';

type Favorite = { id: number; title: string; poster: string; rating: number };
type Activity =
  | { kind: 'rated'; title: string; poster: string; rating: number; when: string }
  | { kind: 'review'; title: string; poster: string; when: string }
  | { kind: 'photo'; title: string; poster: string; count: number; when: string };

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

  // UI state: login | register
  mode = signal<'login' | 'register'>('login');
  isAuthed = computed(() => this.auth.isAuthenticated());

  // Forms
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

  // نمایش فعلی‌ات (وقتی لاگین باشد)
  username = 'امیرعلی';
  tagline = 'امیرعلی';
  avatar = 'images/avatar.png';

  favorites: Favorite[] = [
    { id: 1, title: 'لمیز', poster: 'assets/mock/posters/whiplash.jpg', rating: 5 },
    { id: 2, title: 'کای', poster: 'assets/mock/posters/spiderverse.jpg', rating: 5 },
    { id: 3, title: 'کافه اتوبوسی ', poster: 'assets/mock/posters/hp.jpg', rating: 4.5 },
    { id: 4, title: 'کافه سرکوچه', poster: 'assets/mock/posters/lalaland.jpg', rating: 5 },
    { id: 5, title: 'کافه ته کوچه', poster: 'assets/mock/posters/inception.jpg', rating: 4.5 },
  ];

  activities: Activity[] = [
    { kind: 'rated', title: 'لمیز', poster: 'assets/mock/posters/intouchables.jpg', rating: 4.5, when: '۲ ساعت پیش' },
    { kind: 'review', title: 'کای', poster: 'assets/mock/posters/dps.jpg', when: 'دیروز' },
    { kind: 'rated', title: 'کافه اتوبوسی', poster: 'assets/mock/posters/incredibles.jpg', rating: 5, when: '۳ روز پیش' },
    { kind: 'photo', title: 'پارک نیاوران', poster: 'assets/mock/posters/lifeofchuck.jpg', count: 3, when: '۱ هفته پیش' },
  ];

  ngOnInit() {
    // تلاش برای لود پروفایل (اگه لاگین نباشه، null میاد)
    this.auth.loadMe();
  }

  /** درصد پرشدن ستاره‌ها برای CSS */
  pct(n: number) { return `${Math.max(0, Math.min(5, n)) / 5 * 100}%`; }

  // Actions
  async doLogin() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    const ok = await this.auth.login(this.loginForm.value as any);
    if (!ok) alert('ورود ناموفق بود.');
    // اگر موفق شد، UI اتوماتیک بخش پروفایل را نشان می‌دهد
  }

  async doRegister() {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    const { password, confirmPassword, ...rest } = this.registerForm.value as any;
    if (password !== confirmPassword) { alert('پسورد و تکرار آن برابر نیست.'); return; }
    const ok = await this.auth.register({ ...rest, password });
    if (!ok) alert('ثبت‌نام ناموفق بود.');
  }

  switchMode(to: 'login' | 'register') { this.mode.set(to); }
}
