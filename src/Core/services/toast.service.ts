import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    timestamp: number;
}

export interface ToastConfig {
    duration?: number;
    type?: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
    public messages$ = this.messagesSubject.asObservable();

    // Reactive signals for components
    public messages = signal<ToastMessage[]>([]);
    public hasMessages = computed(() => this.messages().length > 0);

    // Default durations for different toast types
    private readonly defaultDurations = {
        success: 4000,
        error: 6000,
        warning: 5000,
        info: 4000
    };

    // Farsi error messages for common HTTP status codes
    private readonly farsiErrorMessages: Record<number, string> = {
        400: 'درخواست نامعتبر است',
        401: 'لطفاً ابتدا وارد شوید',
        403: 'شما دسترسی لازم را ندارید',
        404: 'منبع مورد نظر یافت نشد',
        409: 'تضاد در داده‌ها وجود دارد',
        422: 'داده‌های ارسالی نامعتبر است',
        429: 'تعداد درخواست‌ها بیش از حد مجاز است',
        500: 'خطای داخلی سرور',
        502: 'خطا در ارتباط با سرور',
        503: 'سرویس در دسترس نیست',
        504: 'زمان انتظار به پایان رسید'
    };

    // Farsi error messages for common error scenarios
    private readonly farsiGenericMessages: Record<string, string> = {
        'network': 'خطا در اتصال به اینترنت',
        'timeout': 'زمان انتظار به پایان رسید',
        'unknown': 'خطای نامشخص رخ داده است',
        'validation': 'داده‌های وارد شده نامعتبر است',
        'auth': 'خطا در احراز هویت',
        'permission': 'شما دسترسی لازم را ندارید',
        'server': 'خطای سرور رخ داده است',
        'client': 'خطا در سمت کلاینت'
    };

    constructor() {
        // Sync signals with BehaviorSubject
        this.messages$.subscribe(messages => {
            this.messages.set(messages);
        });
    }

    /**
     * Show a toast message
     */
    show(message: string, config: ToastConfig = {}): string {
        const id = this.generateId();
        const toastMessage: ToastMessage = {
            id,
            message,
            type: config.type || 'info',
            duration: config.duration || this.defaultDurations[config.type || 'info'],
            timestamp: Date.now()
        };

        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, toastMessage]);

        // Auto remove after duration
        if (toastMessage.duration && toastMessage.duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, toastMessage.duration);
        }

        return id;
    }

    /**
     * Show success toast
     */
    success(message: string, duration?: number): string {
        return this.show(message, { type: 'success', duration });
    }

    /**
     * Show error toast
     */
    error(message: string, duration?: number): string {
        return this.show(message, { type: 'error', duration });
    }

    /**
     * Show warning toast
     */
    warning(message: string, duration?: number): string {
        return this.show(message, { type: 'warning', duration });
    }

    /**
     * Show info toast
     */
    info(message: string, duration?: number): string {
        return this.show(message, { type: 'info', duration });
    }

    /**
     * Handle API error automatically
     * This method analyzes the error and shows appropriate Farsi message
     */
    handleApiError(error: any): string {
        let message = '';
        let type: 'error' | 'warning' = 'error';

        // Check if error has a message from API envelope
        if (error?.message && typeof error.message === 'string' && error.message.trim()) {
            message = error.message.trim();
        } else {
            // Generate Farsi message based on error code or type
            message = this.generateFarsiErrorMessage(error);
        }

        // Determine if it's a warning or error based on status code
        if (error?.code || error?.httpError?.status) {
            const statusCode = error.code || error.httpError?.status;
            if (statusCode >= 400 && statusCode < 500) {
                type = 'warning'; // Client errors are warnings
            }
        }

        return this.show(message, { type, duration: type === 'warning' ? 5000 : 6000 });
    }

    /**
     * Generate Farsi error message based on error object
     */
    private generateFarsiErrorMessage(error: any): string {
        // Check for HTTP status code
        const statusCode = error?.code || error?.httpError?.status || error?.status;
        if (statusCode && this.farsiErrorMessages[statusCode]) {
            return this.farsiErrorMessages[statusCode];
        }

        // Check for specific error types
        if (error?.name) {
            switch (error.name.toLowerCase()) {
                case 'timeouterror':
                case 'timeout':
                    return this.farsiGenericMessages['timeout'];
                case 'networkerror':
                case 'network':
                    return this.farsiGenericMessages['network'];
            }
        }

        // Check for error message patterns
        if (error?.message) {
            const message = error.message.toLowerCase();
            if (message.includes('network') || message.includes('connection')) {
                return this.farsiGenericMessages['network'];
            }
            if (message.includes('timeout')) {
                return this.farsiGenericMessages['timeout'];
            }
            if (message.includes('unauthorized') || message.includes('auth')) {
                return this.farsiGenericMessages['auth'];
            }
            if (message.includes('forbidden') || message.includes('permission')) {
                return this.farsiGenericMessages['permission'];
            }
            if (message.includes('validation') || message.includes('invalid')) {
                return this.farsiGenericMessages['validation'];
            }
            if (message.includes('server') || message.includes('internal')) {
                return this.farsiGenericMessages['server'];
            }
        }

        // Check for common error patterns in the error object
        if (error?.httpError) {
            const httpError = error.httpError;
            if (httpError.status && this.farsiErrorMessages[httpError.status]) {
                return this.farsiErrorMessages[httpError.status];
            }
        }

        // Default fallback
        return this.farsiGenericMessages['unknown'];
    }

    /**
     * Remove a specific toast by ID
     */
    remove(id: string): void {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next(currentMessages.filter(msg => msg.id !== id));
    }

    /**
     * Clear all toasts
     */
    clear(): void {
        this.messagesSubject.next([]);
    }

    /**
     * Generate unique ID for toast messages
     */
    private generateId(): string {
        return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current messages (for testing/debugging)
     */
    getCurrentMessages(): ToastMessage[] {
        return this.messagesSubject.value;
    }
}
