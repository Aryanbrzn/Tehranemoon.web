import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../Core/services/toast.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faCheckCircle,
    faExclamationCircle,
    faExclamationTriangle,
    faInfoCircle,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    template: `
    <div class="toast-container" *ngIf="hasMessages()">
      <div 
        *ngFor="let message of messages(); trackBy: trackByMessageId"
        class="toast toast-{{ message.type }}"
        [class.toast-entering]="isEntering(message)"
        [class.toast-leaving]="isLeaving(message)"
        (click)="removeMessage(message.id)"
      >
        <div class="toast-icon">
          <fa-icon [icon]="getIcon(message.type)"></fa-icon>
        </div>
        <div class="toast-content">
          <div class="toast-message">{{ message.message }}</div>
        </div>
        <button 
          class="toast-close" 
          (click)="removeMessage(message.id); $event.stopPropagation()"
          type="button"
          aria-label="بستن"
        >
          <fa-icon [icon]="faTimes"></fa-icon>
        </button>
        <div class="toast-progress" *ngIf="message.duration && message.duration > 0">
          <div 
            class="toast-progress-bar" 
            [style.animation-duration]="message.duration + 'ms'"
          ></div>
        </div>
      </div>
    </div>
  `,
    styleUrls: ['./toast.component.css']
})
export class ToastContainerComponent {
    private toastService = inject(ToastService);

    // FontAwesome icons
    faCheckCircle = faCheckCircle;
    faExclamationCircle = faExclamationCircle;
    faExclamationTriangle = faExclamationTriangle;
    faInfoCircle = faInfoCircle;
    faTimes = faTimes;

    // Reactive signals
    messages = this.toastService.messages;
    hasMessages = this.toastService.hasMessages;

    // Track entering/leaving animations
    private enteringMessages = new Set<string>();
    private leavingMessages = new Set<string>();

    constructor() {
        // Track new messages for animation using effect
        effect(() => {
            const messages = this.messages();
            const currentIds = new Set(messages.map((m: ToastMessage) => m.id));

            // Mark new messages as entering
            currentIds.forEach((id: string) => {
                if (!this.enteringMessages.has(id) && !this.leavingMessages.has(id)) {
                    this.enteringMessages.add(id);
                    setTimeout(() => this.enteringMessages.delete(id), 300);
                }
            });
        });
    }

    trackByMessageId(index: number, message: ToastMessage): string {
        return message.id;
    }

    isEntering(message: ToastMessage): boolean {
        return this.enteringMessages.has(message.id);
    }

    isLeaving(message: ToastMessage): boolean {
        return this.leavingMessages.has(message.id);
    }

    removeMessage(id: string): void {
        this.leavingMessages.add(id);
        setTimeout(() => {
            this.toastService.remove(id);
            this.leavingMessages.delete(id);
        }, 300);
    }

    getIcon(type: ToastMessage['type']) {
        switch (type) {
            case 'success':
                return this.faCheckCircle;
            case 'error':
                return this.faExclamationCircle;
            case 'warning':
                return this.faExclamationTriangle;
            case 'info':
            default:
                return this.faInfoCircle;
        }
    }
}
