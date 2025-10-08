import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { ComponentPortal } from '@angular/cdk/portal';
import { ModalRef } from './modal-ref';
import { MODAL_DATA } from './modal.tokens';
import { createInjector } from './utils';

export interface ModalConfig<D = any> {
    data?: D;
    width?: string;
    height?: string;
    maxWidth?: string;
    maxHeight?: string;
    panelClass?: string | string[];
    backdropClass?: string | string[];
    closeOnBackdrop?: boolean;   // default: true
    closeOnEscape?: boolean;     // default: true
}

@Injectable({ providedIn: 'root' })
export class ModalService {
    constructor(private overlay: Overlay, private injector: Injector) { }

    open<T, R = unknown, D = any>(
        component: ComponentType<T>,
        cfg: ModalConfig<D> = {}
    ): ModalRef<R> {
        const position = this.overlay.position().global()
            .centerHorizontally().centerVertically();

        const overlayRef = this.overlay.create(new OverlayConfig({
            hasBackdrop: true,
            backdropClass: cfg.backdropClass ?? 'app-modal-backdrop',
            panelClass: cfg.panelClass ?? 'app-modal-panel',
            width: cfg.width, height: cfg.height,
            maxWidth: cfg.maxWidth ?? '95vw',
            maxHeight: cfg.maxHeight ?? '90vh',
            positionStrategy: position,
            scrollStrategy: this.overlay.scrollStrategies.block()
        }));

        const modalRef = new ModalRef<R>(overlayRef);

        // بستن با کلیک روی بک‌دراپ
        if (cfg.closeOnBackdrop !== false) {
            overlayRef.backdropClick().subscribe(() => modalRef.close());
        }
        // بستن با ESC
        if (cfg.closeOnEscape !== false) {
            overlayRef.keydownEvents().subscribe(ev => {
                if (ev.key === 'Escape') modalRef.close();
            });
        }

        const inj = createInjector(this.injector, [
            { provide: ModalRef, useValue: modalRef },
            { provide: MODAL_DATA, useValue: cfg.data }
        ]);

        overlayRef.attach(new ComponentPortal(component, null, inj));
        return modalRef;
    }
}
