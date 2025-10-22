import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ImageService {

    /**
     * Get the full URL for an image served from the admin
     * @param imagePath - The relative path to the image
     * @returns Full URL to the image
     */
    getImageUrl(imagePath: string | null | undefined): string {
        if (!imagePath) {
            return this.getDefaultImageUrl();
        }

        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // Remove leading slash if present
        const cleanPath = imagePath.replace(/^\/+/, '');

        return `${environment.adminUrl}/${cleanPath}`;
    }

    /**
     * Get the default image URL
     * @returns Default image URL
     */
    getDefaultImageUrl(): string {
        return `${environment.webUrl}/images/location.png`;
    }

    /**
     * Get the admin base URL
     * @returns Admin base URL
     */
    getAdminUrl(): string {
        return environment.adminUrl;
    }

    /**
     * Get the API base URL
     * @returns API base URL
     */
    getApiUrl(): string {
        return environment.apiUrl;
    }

    /**
     * Get the web base URL
     * @returns Web base URL
     */
    getWebUrl(): string {
        return environment.webUrl;
    }
}
