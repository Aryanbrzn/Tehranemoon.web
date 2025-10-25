import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Httpclient } from '../../Core/services/httpclient';
import { HttpParams } from '@angular/common/http';

export type LeaderboardItem = {
    id: number;
    title: string;
    categorySlug: string;
    coverImageUrl?: string | null;
    avgRating?: number | null;
    reviewCount: number;
    fiveStarCount: number;     // 👈 جدید
    rank: number;              // 👈 rank indicator (1-100, where 1 is best)
};

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
    constructor(private http: Httpclient) { }

    get(categoryId?: number, q?: string) {
        // فقط پارامترهای موجود ست می‌شوند؛ undefined/null ارسال نمی‌شود
        return this.http.get<LeaderboardItem[]>('/api/places/leaderboard', {
            categoryId,
            q: (q && q.trim().length >= 3) ? q.trim() : undefined,
            take: 50
        });
    }
}
