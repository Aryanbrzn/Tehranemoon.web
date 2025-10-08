import { Subject } from 'rxjs';
import { OverlayRef } from '@angular/cdk/overlay';

export class ModalRef<R = unknown> {
    private readonly _afterClosed = new Subject<R | undefined>();
    afterClosed$ = this._afterClosed.asObservable();

    constructor(private overlayRef: OverlayRef) { }

    close(result?: R) {
        this._afterClosed.next(result);
        this._afterClosed.complete();
        this.overlayRef.dispose();
    }
}
