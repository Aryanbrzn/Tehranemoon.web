import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Httpclient } from './httpclient';

export interface FileUploadResponse {
    fileName: string;
    url: string;
    size: number;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
    private http = inject(Httpclient);

    /**
     * Upload a single file to the backend
     * @param file The file to upload
     * @param onProgress Optional progress callback
     * @returns Promise with upload response
     */
    async uploadFile(file: File, onProgress?: (progress: UploadProgress) => void): Promise<FileUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        // Create a custom request with progress tracking
        const response = await this.http.postForm<FileUploadResponse>('/api/files/upload', formData).toPromise();

        if (!response) {
            throw new Error('Upload failed - no response received');
        }

        return response;
    }

    /**
     * Upload multiple files to the backend
     * @param files Array of files to upload
     * @param onProgress Optional progress callback for each file
     * @returns Promise with array of upload responses
     */
    async uploadFiles(files: File[], onProgress?: (fileIndex: number, progress: UploadProgress) => void): Promise<FileUploadResponse[]> {
        const uploadPromises = files.map((file, index) =>
            this.uploadFile(file, onProgress ? (progress) => onProgress(index, progress) : undefined)
        );

        return Promise.all(uploadPromises);
    }

    /**
     * Get the full URL for an uploaded file
     * @param fileName The file name returned from upload
     * @returns Full URL to access the file
     */
    getFileUrl(fileName: string): string {
        if (!fileName) return '';

        // If it's already a full URL, return as is
        if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
            return fileName;
        }

        // Construct the full URL using the upload base URL
        return `${environment.uploadBaseUrl}/${fileName}`;
    }

    /**
     * Get the full URL for a file with proper fallback
     * @param fileName The file name
     * @param fallbackUrl Optional fallback URL if file doesn't exist
     * @returns Full URL to access the file
     */
    getFileUrlWithFallback(fileName: string, fallbackUrl?: string): string {
        const url = this.getFileUrl(fileName);
        return url || fallbackUrl || '';
    }

    /**
     * Validate file before upload
     * @param file The file to validate
     * @param maxSizeInMB Maximum file size in MB
     * @param allowedTypes Array of allowed MIME types
     * @returns Validation result
     */
    validateFile(file: File, maxSizeInMB: number = 10, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): { valid: boolean; error?: string } {
        // Check file size
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            return { valid: false, error: `File size must be less than ${maxSizeInMB}MB` };
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}` };
        }

        return { valid: true };
    }

    /**
     * Delete a file from the backend
     * @param fileName The file name to delete
     * @returns Promise indicating success
     */
    async deleteFile(fileName: string): Promise<boolean> {
        try {
            await this.http.delete(`/api/files/${fileName}`).toPromise();
            return true;
        } catch {
            return false;
        }
    }
}
