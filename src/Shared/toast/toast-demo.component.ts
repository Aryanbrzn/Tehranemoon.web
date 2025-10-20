import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../Core/services/toast.service';

@Component({
    selector: 'app-toast-demo',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="toast-demo">
      <h3>Toast Demo</h3>
      <div class="demo-controls">
        <button (click)="showSuccess()" class="btn btn-success">Success Toast</button>
        <button (click)="showError()" class="btn btn-error">Error Toast</button>
        <button (click)="showWarning()" class="btn btn-warning">Warning Toast</button>
        <button (click)="showInfo()" class="btn btn-info">Info Toast</button>
      </div>
      
      <div class="demo-controls">
        <input 
          [(ngModel)]="customMessage" 
          placeholder="Custom message..."
          class="input-field"
        >
        <button (click)="showCustom()" class="btn btn-primary">Show Custom</button>
      </div>
      
      <div class="demo-controls">
        <button (click)="simulateApiError()" class="btn btn-secondary">Simulate API Error</button>
        <button (click)="simulateNetworkError()" class="btn btn-secondary">Simulate Network Error</button>
        <button (click)="clearAll()" class="btn btn-danger">Clear All</button>
      </div>
    </div>
  `,
    styles: [`
    .toast-demo {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .demo-controls {
      margin: 15px 0;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .btn-success { background: #10b981; color: white; }
    .btn-error { background: #ef4444; color: white; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-info { background: #3b82f6; color: white; }
    .btn-primary { background: #8b5cf6; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .btn-danger { background: #dc2626; color: white; }
    
    .btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .input-field {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      flex: 1;
      min-width: 200px;
    }
    
    h3 {
      color: #374151;
      margin-bottom: 20px;
    }
  `]
})
export class ToastDemoComponent {
    private toastService = inject(ToastService);
    customMessage = '';

    showSuccess() {
        this.toastService.success('عملیات با موفقیت انجام شد!');
    }

    showError() {
        this.toastService.error('خطایی رخ داده است');
    }

    showWarning() {
        this.toastService.warning('هشدار: این عمل قابل بازگشت نیست');
    }

    showInfo() {
        this.toastService.info('اطلاعات جدید در دسترس است');
    }

    showCustom() {
        if (this.customMessage.trim()) {
            this.toastService.info(this.customMessage);
        } else {
            this.toastService.warning('لطفاً پیام خود را وارد کنید');
        }
    }

    simulateApiError() {
        // Simulate different API error scenarios
        const errors = [
            { code: 400, message: 'داده‌های ارسالی نامعتبر است' },
            { code: 401, message: '' }, // Empty message to test Farsi fallback
            { code: 403, message: 'شما دسترسی لازم را ندارید' },
            { code: 404, message: '' },
            { code: 500, message: '' },
            { httpError: { status: 422 }, message: '' },
            { name: 'TimeoutError', message: 'Request timeout' },
            { name: 'NetworkError', message: 'Network connection failed' }
        ];

        const randomError = errors[Math.floor(Math.random() * errors.length)];
        this.toastService.handleApiError(randomError);
    }

    simulateNetworkError() {
        this.toastService.handleApiError({
            name: 'NetworkError',
            message: 'Failed to fetch'
        });
    }

    clearAll() {
        this.toastService.clear();
    }
}
