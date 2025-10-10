import { Observable, Subject } from 'rxjs';
import { OverlayRef } from '@angular/cdk/overlay';

export class ModalRef<R = unknown> {
    private readonly _afterClosed = new Subject<R | undefined>();
    readonly afterClosed$ = this._afterClosed.asObservable();
    afterClosed(): Observable<R | undefined> { return this.afterClosed$; }

    constructor(private overlayRef: OverlayRef) { }

    close(result?: R) {
        this._afterClosed.next(result);
        this._afterClosed.complete();
        this.overlayRef.dispose();
    }
}