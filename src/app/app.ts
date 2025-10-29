import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faL, fas } from '@fortawesome/free-solid-svg-icons';
import { ToastContainerComponent } from '../Shared/toast/toast.component';
import { ModalService } from '../Shared/modal/modal.service';
import { WelcomeModalComponent } from '../Features/welcome-modal/welcome-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FontAwesomeModule, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private modalService = inject(ModalService);

  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas);
  }

  protected readonly title = signal('tehranemoon-web');

  ngOnInit() {
    // Check if this is the first time the user visits
    const hasVisitedKey = 'tehranemoon_has_visited';
    const hasVisited = localStorage.getItem(hasVisitedKey);

    if (!hasVisited) {
      // Show welcome modal on first visit
      setTimeout(() => {
        this.modalService.open(WelcomeModalComponent, {
          panelClass: ['app-modal-panel', 'app-welcome-panel'],
          backdropClass: 'app-modal-backdrop',
          closeOnBackdrop: true
        });

        // Mark that user has visited
        localStorage.setItem(hasVisitedKey, 'true');
      }, 500); // Small delay to ensure app is fully loaded
    }
  }
}
