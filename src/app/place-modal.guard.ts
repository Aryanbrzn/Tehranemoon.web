import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, CanActivateFn } from '@angular/router';
import { ModalService } from '../Shared/modal/modal.service';
import { PlaceDetailComponent } from '../Features/place-detail/place-detail';

export const placeModalGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const router = inject(Router);
    const modalService = inject(ModalService);

    // Extract place ID from route params
    const placeId = route.paramMap.get('id');

    // Handle both numeric IDs and IDs with slugs (e.g., "123" or "123-some-slug")
    let id: number | null = null;
    if (placeId) {
        if (/^\d+$/.test(placeId)) {
            id = +placeId;
        } else {
            // Extract numeric ID from slug format (e.g., "123-slug" -> 123)
            const match = /^(\d+)/.exec(placeId);
            if (match) {
                id = +match[1];
            }
        }
    }

    if (id && id > 0) {
        // Open the place detail modal
        modalService.open(PlaceDetailComponent, {
            data: { id },
            width: '92vw',
            maxHeight: '90vh',
            panelClass: ['app-modal-panel', 'paper-modal'],
            backdropClass: 'app-modal-backdrop'
        });

        // Navigate to home and prevent route activation
        router.navigate(['/'], { replaceUrl: true });
        return false;
    }

    // If invalid ID, navigate to home
    router.navigate(['/'], { replaceUrl: true });
    return false;
};

