import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FavoriteChangeService {
    private favoriteAddedSubject = new Subject<number>();
    private favoriteRemovedSubject = new Subject<number>();

    // Observable streams for components to subscribe to
    favoriteAdded$ = this.favoriteAddedSubject.asObservable();
    favoriteRemoved$ = this.favoriteRemovedSubject.asObservable();

    // Methods to notify when favorites change
    notifyFavoriteAdded(placeId: number) {
        this.favoriteAddedSubject.next(placeId);
    }

    notifyFavoriteRemoved(placeId: number) {
        this.favoriteRemovedSubject.next(placeId);
    }
}
