# Angular Backend Configuration Guide

This document outlines the configuration changes made to connect your Angular project to your .NET Core API backend.

## 🚀 Configuration Summary

Your Angular project has been configured to work seamlessly with your .NET Core API backend with the following features:

- ✅ **Environment-based API URLs** (dev: localhost:5057, prod: yourdomain.com)
- ✅ **Automatic JWT token management** with refresh logic
- ✅ **File upload handling** for your backend's upload system
- ✅ **CORS configuration** with proxy for development
- ✅ **Enhanced error handling** for backend responses
- ✅ **Image URL management** with fallbacks

## 📁 Files Created/Modified

### Environment Files

- `src/environments/environment.ts` - Development environment
- `src/environments/environment.prod.ts` - Production environment

### Interceptors

- `src/Core/interceptors/jwt-token-interceptor.ts` - Automatic JWT token attachment
- `src/Core/interceptors/with-credentials-interceptor.ts` - CORS credentials handling
- `src/Core/interceptors/error-interceptor.ts` - Enhanced error handling

### Services

- `src/Core/services/auth.service.ts` - Updated with token refresh logic
- `src/Core/services/file-upload.service.ts` - File upload management
- `src/Core/services/image-url.service.ts` - Image URL handling

### Configuration Files

- `src/app/app.config.ts` - Updated with new interceptors
- `angular.json` - Added proxy configuration
- `proxy.conf.json` - Development proxy settings

## 🔧 Environment Configuration

### Development Environment (`src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiBaseUrl: "http://localhost:5057",
  uploadBaseUrl: "http://localhost:5057/uploads",
  adminBaseUrl: "http://localhost:5057/admin",
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
  accessTokenKey: "tm_access",
  refreshTokenKey: "tm_refresh",
};
```

### Production Environment (`src/environments/environment.prod.ts`)

```typescript
export const environment = {
  production: true,
  apiBaseUrl: "https://yourdomain.com/api",
  uploadBaseUrl: "https://yourdomain.com/uploads",
  adminBaseUrl: "https://yourdomain.com/admin",
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
  accessTokenKey: "tm_access",
  refreshTokenKey: "tm_refresh",
};
```

## 🔐 Authentication & JWT Token Management

### Automatic Token Attachment

The `jwtTokenInterceptor` automatically attaches Bearer tokens to API requests:

- Skips auth endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`)
- Skips external URLs
- Validates token before attaching

### Token Refresh Logic

The `AuthService` now handles automatic token refresh:

- Checks token validity before API calls
- Automatically refreshes tokens 5 minutes before expiry
- Handles refresh failures gracefully
- Prevents multiple simultaneous refresh attempts

### Usage Example

```typescript
// Login automatically stores both access and refresh tokens
await authService.login({ userNameOrEmail: "user", password: "pass" });

// Tokens are automatically attached to subsequent API calls
const places = await httpClient.get("/api/places").toPromise();
```

## 📁 File Upload Configuration

### File Upload Service

The `FileUploadService` provides comprehensive file upload functionality:

```typescript
// Upload a single file
const result = await fileUploadService.uploadFile(file);

// Upload multiple files
const results = await fileUploadService.uploadFiles([file1, file2]);

// Get file URL
const fileUrl = fileUploadService.getFileUrl(result.fileName);

// Validate file before upload
const validation = fileUploadService.validateFile(file, 10, ["image/jpeg", "image/png"]);
```

### File Validation

- File size limits (default: 10MB)
- MIME type validation
- Filename sanitization

## 🖼️ Image URL Management

### Image URL Service

The `ImageUrlService` handles image URLs with fallbacks:

```typescript
// Get image URL with fallback
const imageUrl = imageUrlService.getImageUrl(imagePath, "/images/placeholder.png");

// Get avatar URL
const avatarUrl = imageUrlService.getAvatarUrl(avatarPath);

// Get optimized image URL
const optimizedUrl = imageUrlService.getOptimizedImageUrl(imagePath, 300, 200, 80);
```

## 🌐 CORS Configuration

### Development Proxy

A proxy configuration (`proxy.conf.json`) handles CORS issues in development:

```json
{
  "/api/*": {
    "target": "http://localhost:5057",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### Credentials Handling

The `withCredentialsInterceptor` automatically includes credentials for:

- Auth endpoints
- API calls to your backend

## ⚠️ Error Handling

### Enhanced Error Interceptor

The `errorInterceptor` provides comprehensive error handling:

- **401 Unauthorized**: Automatic token refresh attempt
- **403 Forbidden**: Permission denied message
- **404 Not Found**: Resource not found message
- **500 Server Error**: Generic server error message
- **Network Errors**: Connection issue messages

### User-Friendly Messages

All errors are displayed to users via the `ToastService` with appropriate messages.

## 🚀 Running the Application

### Development

```bash
ng serve
```

The proxy will automatically handle CORS issues by forwarding API calls to `http://localhost:5057`.

### Production Build

```bash
ng build --configuration production
```

Make sure to update the production environment URLs in `src/environments/environment.prod.ts`.

## 🔧 Backend Requirements

Your .NET Core API should have the following endpoints:

### Authentication Endpoints

- `POST /api/auth/login` - Returns `{ accessToken, refreshToken, expires }`
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh with `{ refreshToken }`
- `POST /api/auth/revoke` - Token revocation
- `GET /api/auth/me` - Get current user profile

### File Upload Endpoints

- `POST /api/files/upload` - Upload files (multipart/form-data)
- `DELETE /api/files/{fileName}` - Delete files

### CORS Configuration

Your backend should allow:

- Origin: `http://localhost:4200` (development)
- Origin: `https://yourdomain.com` (production)
- Credentials: `true`
- Methods: `GET, POST, PUT, DELETE, OPTIONS`
- Headers: `Authorization, Content-Type`

## 📝 Next Steps

1. **Update Production URLs**: Replace `yourdomain.com` with your actual domain
2. **Test Authentication**: Verify login/logout functionality
3. **Test File Uploads**: Ensure file uploads work correctly
4. **Test Token Refresh**: Verify automatic token refresh
5. **Configure CORS**: Update your backend CORS settings
6. **Test Error Handling**: Verify error messages display correctly

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your backend CORS is configured correctly
2. **Token Refresh Fails**: Check that refresh endpoint returns both tokens
3. **File Upload Issues**: Verify multipart/form-data handling in backend
4. **Image URLs**: Ensure upload base URL matches your backend configuration

### Debug Tips

- Check browser network tab for API calls
- Verify token storage in localStorage
- Check console for error messages
- Use proxy logs to debug development issues

## 📞 Support

If you encounter any issues, check:

1. Browser console for errors
2. Network tab for failed requests
3. Backend logs for server errors
4. CORS configuration in your .NET Core API
