import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../Core/services/auth.service';
import { ModalRef } from '../../Shared/modal/modal-ref';
import { MODAL_DATA } from '../../Shared/modal/modal.tokens';

type Mode = 'login' | 'register';

@Component({
    selector: 'app-auth-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './auth-dialog.html',
    styleUrl: './auth-dialog.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthDialogComponent {
    private fb = inject(FormBuilder);
    private modalRef = inject(ModalRef<boolean>);
    private data = inject(MODAL_DATA, { optional: true }) as { mode?: Mode } | null;
    auth = inject(AuthService);

    mode = signal<Mode>(this.data?.mode ?? 'login');
    switchMode(m: Mode) { this.mode.set(m); }

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

    busy = signal(false);
    err = signal<string | null>(null);
    showLoginPw = signal(false);
    showRegPw = signal(false);
    showRegPw2 = signal(false);
    async doLogin() {
        if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
        this.err.set(null); this.busy.set(true);
        const ok = await this.auth.login(this.loginForm.value as any);
        this.busy.set(false);
        if (!ok) { this.err.set('ورود ناموفق بود.'); return; }
        this.modalRef.close(true);
    }

    async doRegister() {
        if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
        const { password, confirmPassword, ...rest } = this.registerForm.value as any;
        if (password !== confirmPassword) { this.err.set('پسورد و تکرار آن برابر نیست.'); return; }
        this.err.set(null); this.busy.set(true);
        const ok = await this.auth.register({ ...rest, password });
        this.busy.set(false);
        if (!ok) { this.err.set('ثبت‌نام ناموفق بود.'); return; }
        // بعد از ثبت‌نام می‌تونی خودکار لاگین هم کنی؛ اگر خواستی:
        // const ok2 = await this.auth.login({ userNameOrEmail: rest.userName, password });
        // if (ok2) return this.modalRef.close(true);
        this.switchMode('login');
    }

    close() { this.modalRef.close(false); }
}
