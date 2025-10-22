import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalRef } from '../../../Shared/modal/modal-ref';
import { MODAL_DATA } from '../../../Shared/modal/modal.tokens';
import { PlaceLookupService, PlaceLite } from './place-lookup.service';
import { finalize } from 'rxjs/operators';
import { CategoriesService, CategoryDto } from '../../services/categories.service';


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
  private categories = inject(CategoriesService);

  q = signal<string>('');
  busy = signal<boolean>(false);
  results = signal<PlaceLite[]>([]);
  catId = this.data?.categoryId ?? null;
  categoryName = signal<string | null>(null);

  private debounced: any;

  constructor() {
    this.search('');
    if (this.catId != null) {
      this.loadCategoryName(this.catId);
    }
  }

  ngOnDestroy() {
    clearTimeout(this.debounced);
  }

  onInput(v: string) {
    this.q.set(v);
    this.debouncedSearch(v);
  }

  pick(item: PlaceLite) {
    // parent will add the favorite and refresh
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

  private loadCategoryName(categoryId: number) {
    this.categories.getActive().subscribe({
      next: (cats: CategoryDto[]) => {
        const found = (cats ?? []).find(c => c.id === categoryId);
        this.categoryName.set(found?.name ?? null);
      },
      error: () => this.categoryName.set(null)
    });
  }
}
