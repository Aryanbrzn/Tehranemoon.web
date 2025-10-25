import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalRef } from '../../../Shared/modal/modal-ref';
import { MODAL_DATA } from '../../../Shared/modal/modal.tokens';
import { PlaceRequestService } from '../../services/place-request.service';
import { CategoriesService, CategoryDto } from '../../services/categories.service';
import { CreatePlaceRequestDto } from '../../services/place-request.models';
import { finalize } from 'rxjs/operators';

export type PlaceRequestSubmitResult = { success: boolean; message?: string };

@Component({
    selector: 'app-place-request-submit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './place-request-submit.html',
    styleUrl: './place-request-submit.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlaceRequestSubmitComponent implements OnInit, OnDestroy {
    private modalRef = inject(ModalRef) as ModalRef<PlaceRequestSubmitResult>;
    private data = inject(MODAL_DATA) as { categoryId?: number };
    private placeRequestService = inject(PlaceRequestService);
    private categoriesService = inject(CategoriesService);
    private fb = inject(FormBuilder);

    form: FormGroup;
    categories = signal<CategoryDto[]>([]);
    busy = signal<boolean>(false);
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);

    constructor() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(200)]],
            description: ['', [Validators.maxLength(4000)]],
            categoryId: [this.data?.categoryId || null, [Validators.required]],
            instagramUrl: ['', [this.instagramUrlValidator]]
        });
    }

    ngOnInit() {
        this.loadCategories();
    }

    ngOnDestroy() {
        // Cleanup if needed
    }

    onSubmit() {
        if (this.form.invalid || this.busy()) {
            return;
        }

        this.busy.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        const formData: CreatePlaceRequestDto = {
            name: this.form.value.name.trim(),
            description: this.form.value.description?.trim() || undefined,
            categoryId: this.form.value.categoryId,
            instagramUrl: this.form.value.instagramUrl?.trim() || undefined
        };

        this.placeRequestService.submitPlaceRequest(formData)
            .pipe(finalize(() => this.busy.set(false)))
            .subscribe({
                next: (result) => {
                    this.successMessage.set('درخواست شما با موفقیت ثبت شد. پس از بررسی، نتیجه به شما اطلاع داده خواهد شد.');
                    setTimeout(() => {
                        this.modalRef.close({ success: true, message: result.message });
                    }, 2000);
                },
                error: (error) => {
                    this.errorMessage.set('خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.');
                }
            });
    }

    close() {
        this.modalRef.close({ success: false });
    }

    private loadCategories() {
        this.categoriesService.getActive().subscribe({
            next: (cats) => {
                this.categories.set(cats || []);
            },
            error: (error) => {
                this.errorMessage.set('خطا در بارگذاری دسته‌بندی‌ها');
            }
        });
    }

    private instagramUrlValidator(control: any) {
        if (!control.value) return null;

        const instagramPattern = /^https:\/\/www\.instagram\.com\/[a-zA-Z0-9._]+\/?$/;
        return instagramPattern.test(control.value) ? null : { invalidInstagramUrl: true };
    }

    getFieldError(fieldName: string): string | null {
        const field = this.form.get(fieldName);
        if (!field || !field.errors || !field.touched) return null;

        if (field.errors['required']) return 'این فیلد الزامی است';
        if (field.errors['maxlength']) return `حداکثر ${field.errors['maxlength'].requiredLength} کاراکتر مجاز است`;
        if (field.errors['invalidInstagramUrl']) return 'آدرس اینستاگرام نامعتبر است';

        return null;
    }
}
