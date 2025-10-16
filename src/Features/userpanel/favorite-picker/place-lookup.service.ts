import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Httpclient } from '../../../Core/services/httpclient';

export interface PlaceLite {
    id: number;
    title: string;
    coverImageUrl?: string;
    avgRating?: number;
}


@Injectable({ providedIn: 'root' })
export class PlaceLookupService {
    private http = inject(Httpclient);

    search(categoryId: number | undefined, q: string, take = 24): Observable<PlaceLite[]> {
        return this.http.get<PlaceLite[]>(`/api/places/lookup?categoryId=${categoryId}&q=${q}`,);
    }
}
