# Tehranemoon Web - Production URL Configuration

This document describes the production URL configuration changes made to the Tehranemoon web application.

## Production URLs

- **API URL**: `https://api.tehranemoon.app`
- **Admin URL**: `https://admin.tehranemoon.app` (serves images)
- **Web Client**: `https://tehranemoon.app`

## Changes Made

### 1. Environment Configuration

Created environment files to manage different configurations:

- `src/environments/environment.ts` - Development environment
- `src/environments/environment.prod.ts` - Production environment

### 2. Image Service

Created `src/Core/services/image.service.ts` to handle image URLs:

- Automatically prepends admin URL to image paths
- Handles both relative and absolute URLs
- Provides fallback to default images
- Centralized image URL management

### 3. Updated Components

Updated the following components to use the image service:

- **Home Component** (`src/Features/home/home.ts`)

  - Category images now use admin URL
  - Place cover images use admin URL

- **User Panel Component** (`src/Features/userpanel/userpanel.ts`)

  - Avatar and poster images use admin URL
  - Dynamic favorite images use admin URL

- **Place Detail Component** (`src/Features/place-detail/place-detail.ts`)
  - Cover images use admin URL
  - Gallery images use admin URL
  - Review images use admin URL

### 4. Build Configuration

Updated `angular.json` to support environment-specific builds:

- Production build automatically uses production environment
- Development build uses development environment

## Usage

### Development

```bash
npm start
# or
ng serve
```

This will use development URLs:

- API: `http://localhost:5129`
- Admin: `http://localhost:5057`
- Web: `http://localhost:4200`

### Production Build

```bash
npm run build:prod
# or
ng build --configuration production
```

This will use production URLs:

- API: `https://api.tehranemoon.app`
- Admin: `https://admin.tehranemoon.app`
- Web: `https://tehranemoon.app`

## Image Service Usage

The `ImageService` provides methods to handle image URLs:

```typescript
// Inject the service
private imageService = inject(ImageService);

// Get image URL (handles both relative and absolute URLs)
const imageUrl = this.imageService.getImageUrl('images/example.png');
// Returns: https://admin.tehranemoon.app/images/example.png (in production)

// Get default image URL
const defaultImage = this.imageService.getDefaultImageUrl();
// Returns: https://tehranemoon.app/images/location.png (in production)

// Get admin base URL
const adminUrl = this.imageService.getAdminUrl();
// Returns: https://admin.tehranemoon.app (in production)
```

## Benefits

1. **Centralized Configuration**: All URLs are managed in environment files
2. **Automatic Image Handling**: Images are automatically served from admin URL
3. **Environment Separation**: Clear separation between development and production
4. **Easy Maintenance**: Changes to URLs only require updating environment files
5. **Type Safety**: TypeScript ensures proper usage of the image service

## Migration Notes

- All hardcoded localhost URLs have been replaced with environment-based URLs
- Image URLs are now automatically handled by the ImageService
- The application will work seamlessly in both development and production environments
- No manual URL changes are needed when deploying to production
