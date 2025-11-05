import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImageUrlService {

    /**
     * Get the full URL for an image
     * @param imagePath The image path or filename
     * @param fallbackUrl Optional fallback URL if image doesn't exist
     * @returns Full URL to the image
     */
    getImageUrl(imagePath: string | null | undefined, fallbackUrl?: string): string {
        if (!imagePath) {
            return fallbackUrl || this.getDefaultImageUrl();
        }

        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // If it starts with /uploads/, use the upload base URL
        if (imagePath.startsWith('/uploads/')) {
            return `${environment.uploadBaseUrl}${imagePath}`;
        }

        // If it's just a filename, construct the full path
        if (!imagePath.startsWith('/')) {
            return `${environment.uploadBaseUrl}/${imagePath}`;
        }

        // For other paths, use the upload base URL
        return `${environment.uploadBaseUrl}${imagePath}`;
    }

    /**
     * Get the default/placeholder image URL
     * @returns Default image URL
     */
    getDefaultImageUrl(): string {
        return '/images/no-image.png';
    }

    /**
     * Get avatar URL with fallback
     * @param avatarPath The avatar path
     * @returns Avatar URL or default avatar
     */
    getAvatarUrl(avatarPath: string | null | undefined): string {
        if (!avatarPath) {
            return '/images/no-image.png';
        }

        return this.getImageUrl(avatarPath, '/images/no-image.png');
    }

    /**
     * Get cover image URL with fallback
     * @param coverPath The cover image path
     * @returns Cover image URL or default cover
     */
    getCoverImageUrl(coverPath: string | null | undefined): string {
        if (!coverPath) {
            return '/images/no-image.png';
        }

        return this.getImageUrl(coverPath, '/images/no-image.png');
    }

    /**
     * Check if an image URL is valid
     * @param imageUrl The image URL to check
     * @returns True if the URL appears to be valid
     */
    isValidImageUrl(imageUrl: string | null | undefined): boolean {
        if (!imageUrl) return false;

        // Basic URL validation
        try {
            new URL(imageUrl);
            return true;
        } catch {
            // If it's not a full URL, check if it's a valid path
            return imageUrl.length > 0 && !imageUrl.includes('..');
        }
    }

    /**
     * Get optimized image URL with size parameters (if your backend supports it)
     * @param imagePath The image path
     * @param width Desired width
     * @param height Desired height
     * @param quality Image quality (0-100)
     * @returns Optimized image URL
     */
    getOptimizedImageUrl(
        imagePath: string | null | undefined,
        width?: number,
        height?: number,
        quality: number = 80
    ): string {
        const baseUrl = this.getImageUrl(imagePath);

        if (!baseUrl || baseUrl === this.getDefaultImageUrl()) {
            return baseUrl;
        }

        // Add query parameters for image optimization (adjust based on your backend)
        const params = new URLSearchParams();
        if (width) params.append('w', width.toString());
        if (height) params.append('h', height.toString());
        params.append('q', quality.toString());

        const queryString = params.toString();
        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    }
}
