# Toast Notification System

This project now includes a comprehensive toast notification system with automatic error handling and Farsi language support.

## Features

- **Automatic Error Handling**: API errors are automatically caught and displayed as toast notifications
- **Farsi Language Support**: Error messages are displayed in Farsi with fallback messages for common scenarios
- **Multiple Toast Types**: Success, Error, Warning, and Info toasts with different colors and icons
- **Responsive Design**: Works on both desktop and mobile devices
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **Animations**: Smooth slide-in/slide-out animations with progress bars

## How It Works

### Automatic Error Handling

The toast system is integrated with the HTTP error interceptor (`error-interceptor.ts`). When any API call fails, the error is automatically processed and a toast notification is shown.

The system handles:

- API envelope errors (with `isSuccess: false`)
- HTTP status code errors (400, 401, 403, 404, 500, etc.)
- Network errors
- Timeout errors
- Generic errors

### Farsi Error Messages

The system provides Farsi translations for common error scenarios:

- **400**: درخواست نامعتبر است
- **401**: لطفاً ابتدا وارد شوید
- **403**: شما دسترسی لازم را ندارید
- **404**: منبع مورد نظر یافت نشد
- **500**: خطای داخلی سرور
- **Network Error**: خطا در اتصال به اینترنت
- **Timeout**: زمان انتظار به پایان رسید

## Usage

### Automatic Usage (Recommended)

No code changes needed! The toast system automatically handles all API errors.

### Manual Usage

You can also manually show toast notifications:

```typescript
import { ToastService } from '../Core/services/toast.service';

// Inject the service
private toastService = inject(ToastService);

// Show different types of toasts
this.toastService.success('عملیات با موفقیت انجام شد!');
this.toastService.error('خطایی رخ داده است');
this.toastService.warning('هشدار: این عمل قابل بازگشت نیست');
this.toastService.info('اطلاعات جدید در دسترس است');

// Handle API errors manually
this.toastService.handleApiError(errorObject);

// Clear all toasts
this.toastService.clear();
```

### Toast Configuration

```typescript
// Custom duration
this.toastService.success("پیام موفقیت", 5000);

// Custom configuration
this.toastService.show("پیام سفارشی", {
  type: "info",
  duration: 3000,
});
```

## Testing

Visit `/toast-demo` to test the toast system with different scenarios:

- Manual toast notifications
- Simulated API errors
- Network error simulation
- Custom messages

## Components

### ToastService (`src/Core/services/toast.service.ts`)

Main service that handles toast notifications and error processing.

### ToastContainerComponent (`src/Shared/toast/toast.component.ts`)

UI component that displays toast notifications with animations and progress bars.

### ToastDemoComponent (`src/Shared/toast/toast-demo.component.ts`)

Demo component for testing toast functionality.

## Integration

The toast system is automatically integrated into the application:

1. **Error Interceptor**: Catches all HTTP errors and shows appropriate toasts
2. **App Component**: Includes the toast container in the main layout
3. **Existing Components**: Can be updated to use toast instead of local error handling

## Customization

### Adding New Error Messages

Edit `src/Core/services/toast.service.ts` and add new entries to:

```typescript
private readonly farsiErrorMessages: Record<number, string> = {
  // Add new status codes here
  422: 'داده‌های ارسالی نامعتبر است'
};

private readonly farsiGenericMessages: Record<string, string> = {
  // Add new error types here
  'custom': 'پیام خطای سفارشی'
};
```

### Styling

Toast styles are in `src/Shared/toast/toast.component.css`. You can customize:

- Colors and themes
- Animations
- Positioning
- Responsive behavior
- Dark mode support

## Benefits

1. **Consistent UX**: All errors are handled uniformly across the application
2. **Better User Experience**: Users get immediate feedback in their language
3. **Reduced Code Duplication**: No need to handle errors in every component
4. **Accessibility**: Proper ARIA labels and keyboard support
5. **Maintainable**: Centralized error handling logic
