import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Httpclient } from '../../Core/services/httpclient';

export type FavoriteItem = {
    placeId: number;
    categoryId: number;
    title: string;
    coverImageUrl?: string | null;
    avgRating?: number | null;
};

@Injectable({ providedIn: 'root' })
export class FavoritesService {
    private http = inject(Httpclient);

    getAll(): Observable<FavoriteItem[]> {
        return this.http.get<FavoriteItem[]>('/api/user/favorites', {
            _t: Date.now() // Cache-buster
        });
    }
    has(placeId: number): Observable<boolean> {
        return this.http.get<boolean>('/api/user/favorites/has', {
            placeId,
            _t: Date.now() // Cache-buster
        });
    }
    add(placeId: number) {
        return this.http.postJson('/api/user/favorites/' + placeId, {});
    }
    remove(placeId: number) {
        return this.http.delete('/api/user/favorites/' + placeId);
    }
}