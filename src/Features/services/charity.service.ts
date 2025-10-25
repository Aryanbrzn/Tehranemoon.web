// app/features/charity/charity.service.ts
import { Injectable, inject } from '@angular/core';
import { Httpclient } from '../../Core/services/httpclient';

export type CharityProgressDto = {
    totalFavorites: number;
    totalAmountToman: number;
};

@Injectable({ providedIn: 'root' })
export class CharityService {
    private http = inject(Httpclient);
    getProgress() {
        return this.http.get<CharityProgressDto>('/api/charity/progress', {
            _t: Date.now() // Cache-buster
        });
    }
}
