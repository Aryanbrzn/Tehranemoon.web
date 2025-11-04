import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountdownComponent } from '../countdown/countdown';
import { RouterModule } from '@angular/router';
import { Footer } from '../../Shared/footer/footer';
import { BugReportService, CreateBugReportRequest } from '../services/bug-report.service';
import { SEOService } from '../../Core/services/seo.service';
import { environment } from '../../environments/environment';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-report-bugs',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CountdownComponent, Footer],
    templateUrl: './report-bugs.html',
    styleUrl: './report-bugs.css'
})
export class ReportBugsComponent implements OnInit {
    private bugReportService = inject(BugReportService);
    private seoService = inject(SEOService);

    ngOnInit() {
        this.seoService.updateTags({
            title: 'گزارش مشکل - تهرانمون',
            description: 'گزارش مشکل یا باگ در سایت تهرانمون. اگر مشکلی در سایت مشاهده کردید، لطفاً از طریق این صفحه برای ما گزارش دهید تا ما آن را برطرف کنیم.',
            keywords: 'گزارش مشکل, گزارش باگ, گزارش خطا, مشکلات سایت تهرانمون',
            url: `${environment.webUrl}/report-bugs`,
            type: 'website',
            structuredData: {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "گزارش مشکل",
                "description": "صفحه گزارش مشکل در سایت تهرانمون",
                "url": `${environment.webUrl}/report-bugs`
            }
        });
    }

    bugReport = {
        title: '',
        description: '',
        page: '',
        steps: '',
        browser: '',
        email: ''
    };

    submitted = signal(false);
    isSubmitting = signal(false);
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);
    validationErrors = signal<string[]>([]);
    bugReportId = signal<number | null>(null);

    onSubmit() {
        if (this.isSubmitting()) {
            return;
        }

        // Client-side validation
        if (!this.bugReport.title || !this.bugReport.description) {
            this.errorMessage.set('عنوان و توضیحات مشکل الزامی هستند');
            return;
        }

        if (this.bugReport.title.length > 200) {
            this.errorMessage.set('عنوان نباید بیشتر از ۲۰۰ کاراکتر باشد');
            return;
        }

        if (this.bugReport.description.length > 4000) {
            this.errorMessage.set('توضیحات نباید بیشتر از ۴۰۰۰ کاراکتر باشد');
            return;
        }

        if (this.bugReport.page && this.bugReport.page.length > 200) {
            this.errorMessage.set('فیلد صفحه نباید بیشتر از ۲۰۰ کاراکتر باشد');
            return;
        }

        if (this.bugReport.steps && this.bugReport.steps.length > 2000) {
            this.errorMessage.set('فیلد مراحل بازتولید نباید بیشتر از ۲۰۰۰ کاراکتر باشد');
            return;
        }

        if (this.bugReport.browser && this.bugReport.browser.length > 100) {
            this.errorMessage.set('فیلد مرورگر نباید بیشتر از ۱۰۰ کاراکتر باشد');
            return;
        }

        if (this.bugReport.email && this.bugReport.email.length > 255) {
            this.errorMessage.set('ایمیل نباید بیشتر از ۲۵۵ کاراکتر باشد');
            return;
        }

        // Email format validation
        if (this.bugReport.email && !this.isValidEmail(this.bugReport.email)) {
            this.errorMessage.set('فرمت ایمیل نامعتبر است');
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);
        this.validationErrors.set([]);
        this.successMessage.set(null);

        // Trim all string fields before submission
        const formData: CreateBugReportRequest = {
            title: this.bugReport.title.trim(),
            description: this.bugReport.description.trim(),
            page: this.bugReport.page?.trim() || undefined,
            steps: this.bugReport.steps?.trim() || undefined,
            browser: this.bugReport.browser?.trim() || undefined,
            email: this.bugReport.email?.trim() || undefined
        };

        this.bugReportService.createBugReport(formData)
            .pipe(finalize(() => this.isSubmitting.set(false)))
            .subscribe({
                next: (response) => {
                    this.successMessage.set(response.message);
                    this.bugReportId.set(response.id);
                    this.submitted.set(true);

                    // Reset form after 5 seconds
                    setTimeout(() => {
                        this.submitted.set(false);
                        this.successMessage.set(null);
                        this.bugReportId.set(null);
                        this.bugReport = {
                            title: '',
                            description: '',
                            page: '',
                            steps: '',
                            browser: '',
                            email: ''
                        };
                    }, 5000);
                },
                error: (error) => {
                    // Handle validation errors (400)
                    if (error.status === 400) {
                        if (error.error?.errors && Array.isArray(error.error.errors)) {
                            this.validationErrors.set(error.error.errors);
                            this.errorMessage.set('لطفاً خطاهای اعتبارسنجی را برطرف کنید');
                        } else if (error.error?.message) {
                            this.errorMessage.set(error.error.message);
                        } else {
                            this.errorMessage.set('خطا در ثبت گزارش. لطفاً دوباره تلاش کنید.');
                        }
                    } else if (error.status === 500) {
                        // Handle server errors
                        if (error.error?.message) {
                            this.errorMessage.set(error.error.message);
                        } else {
                            this.errorMessage.set('خطای سرور. لطفاً بعداً تلاش کنید.');
                        }
                    } else {
                        // Handle other errors
                        this.errorMessage.set('خطا در ثبت گزارش. لطفاً دوباره تلاش کنید.');
                    }
                }
            });
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

