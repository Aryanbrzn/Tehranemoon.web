import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalRef } from '../../../Shared/modal/modal-ref';
import { MODAL_DATA } from '../../../Shared/modal/modal.tokens';
import { PlaceLookupService, PlaceLite } from './place-lookup.service';
import { finalize } from 'rxjs/operators';
import { FavoritesService } from '../../services/favorites.service';

export type FavoritePickResult = { placeId: number };

@Component({
  selector: 'app-favorite-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './favorite-picker.html',
  styleUrl: './favorite-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritePickerDialogComponent implements OnDestroy {
  private modalRef = inject(ModalRef) as ModalRef<FavoritePickResult>;
  private data = inject(MODAL_DATA) as { categoryId: number };
  private lookup = inject(PlaceLookupService);
  private favService = inject(FavoritesService);

  q = signal<string>('');
  busy = signal<boolean>(false);
  results = signal<PlaceLite[]>([]);
  catId = this.data?.categoryId ?? null;

  private debounced: any;

  constructor() {
    this.search('');
  }

  ngOnDestroy() {
    clearTimeout(this.debounced);
  }

  onInput(v: string) {
    this.q.set(v);
    this.debouncedSearch(v);
  }

  pick(item: PlaceLite) {
    this.favService.add(item.id);
    this.modalRef.close({ placeId: item.id });
  }
  close() { this.modalRef.close(); }

  private debouncedSearch(v: string) {
    clearTimeout(this.debounced);
    this.debounced = setTimeout(() => this.search(v), 300);
  }

  private search(q: string) {
    const query = (q ?? '').trim();


    this.busy.set(true);
    this.lookup.search(this.catId ?? undefined, query, 24)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (items) => {
          this.results.set(items ?? []);
        },
        error: (err) => {
          console.error('[favorite-picker] search failed:', err);
          this.results.set([]);
        }
      });
  }
}
