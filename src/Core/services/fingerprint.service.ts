import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FingerprintService {

    /**
     * Generate a device fingerprint based on browser characteristics
     * This is a simple implementation - in production you might want to use a more robust library
     */
    generateFingerprint(): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Device fingerprint', 2, 2);
        }

        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            !!window.sessionStorage,
            !!window.localStorage,
            canvas.toDataURL()
        ].join('|');

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return Math.abs(hash).toString(36);
    }

    /**
     * Get cached fingerprint or generate new one
     */
    getFingerprint(): string {
        const cacheKey = 'device_fingerprint';
        let fingerprint = localStorage.getItem(cacheKey);

        if (!fingerprint) {
            fingerprint = this.generateFingerprint();
            localStorage.setItem(cacheKey, fingerprint);
        }

        return fingerprint;
    }
}
