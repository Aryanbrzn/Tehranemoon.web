// src/Features/place-detail/mock-reviews.service.ts
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { mockPlaceDb } from './mock-place-detail.service';
import { ReviewDto } from '../services/place-detail';

let rid = 9000;

@Injectable({ providedIn: 'root' })
export class MockReviewsService {

    addReview(placeId: number, dto: { rating: number; text: string; captchaToken: string; captchaAnswer: string; }) {
        const p = mockPlaceDb.place;
        const item: ReviewDto = {
            id: ++rid,
            placeId,
            parentId: null,
            author: 'کاربر مهمان',
            authorType: 'User',
            rating: dto.rating ?? 0,
            text: dto.text,
            createdAtUtc: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            images: []
        };
        p.reviews.unshift(item);
        // آمار را آپدیت کن
        p.reviewCount = p.reviews.length;
        p.avgRating = p.reviews.length
            ? p.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / p.reviews.length
            : 0;

        return of({ id: item.id }).pipe(delay(300));
    }

    addReply(reviewId: number, dto: { text: string }) {
        const p = mockPlaceDb.place;
        const parent = p.reviews.find(x => x.id === reviewId);
        if (parent) {
            const reply: ReviewDto = {
                id: ++rid,
                placeId: p.id,
                parentId: reviewId,
                author: 'کاربر مهمان',
                authorType: 'User',
                rating: 0,
                text: dto.text,
                createdAtUtc: new Date().toISOString(),
                likes: 0,
                dislikes: 0,
                images: []
            };
            // می‌تونی کنار والد قرار بدی؛ اینجا بعد از والد push می‌کنیم
            const idx = p.reviews.findIndex(x => x.id === reviewId);
            p.reviews.splice(idx + 1, 0, reply);
        }
        return of({ id: rid }).pipe(delay(250));
    }

    report(id: number, reason: string) {
        const p = mockPlaceDb.place;
        const r = p.reviews.find(x => x.id === id);
        if (r) (r as any).reported = true;
        console.log('Mock report:', id, reason);
        return of({ ok: true }).pipe(delay(150));
    }
}
