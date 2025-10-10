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
};

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
    constructor(private http: Httpclient) { }

    get(categoryId: number, q?: string): Observable<LeaderboardItem[]> {

        return this.http.get<LeaderboardItem[]>('/api/places/leaderboard', { 'categoryId': categoryId });
    }
}
