import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ModalRef } from '../../Shared/modal/modal-ref';

@Component({
    selector: 'app-welcome-modal',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './welcome-modal.html',
    styleUrl: './welcome-modal.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeModalComponent {
    private modalRef = inject(ModalRef);

    close() {
        this.modalRef.close();
    }
}

