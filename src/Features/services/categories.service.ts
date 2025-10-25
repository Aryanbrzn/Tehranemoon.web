import { inject, Injectable } from '@angular/core';
import { Httpclient } from '../../Core/services/httpclient';
import { Observable } from 'rxjs';

export interface CategoryDto {
    id: number;
    name: string;
    slug: string;
    imageUrl?: string | null;   // API might return PascalCase or camelCase
    thumbUrl?: string | null;   // we’ll normalize in the component
    displayOrder: number;
    isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
    private http = inject(Httpclient);

    /** GET /api/categories  -> active public categories */
    getActive(): Observable<CategoryDto[]> {
        return this.http.get<CategoryDto[]>('api/categories', {
            _t: Date.now() // Cache-buster
        });
    }
}
