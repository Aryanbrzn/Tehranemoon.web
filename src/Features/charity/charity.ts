// charity.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CharityService, CharityProgressDto } from '../services/charity.service';
import { FavoriteChangeService } from '../../Core/services/favorite-change.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-charity',
  imports: [],
  templateUrl: './charity.html',
  styleUrl: './charity.css'
})
export class Charity implements OnInit, OnDestroy {
  private api = inject(CharityService);
  private favoriteChangeService = inject(FavoriteChangeService);
  progress = signal<CharityProgressDto | null>(null);
  private subscriptions = new Subscription();

  ngOnInit() {
    this.loadProgress();

    // Listen to favorite changes and refresh progress
    this.subscriptions.add(
      this.favoriteChangeService.favoriteAdded$.subscribe(() => {
        this.loadProgress();
      })
    );

    this.subscriptions.add(
      this.favoriteChangeService.favoriteRemoved$.subscribe(() => {
        this.loadProgress();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadProgress() {
    this.api.getProgress().subscribe({
      next: p => this.progress.set(p),
      error: _ => this.progress.set({ totalFavorites: 0, totalAmountToman: 0 })
    });
  }

  // نمایش عدد با جداکننده
  fmt(n?: number | null) {
    return (n ?? 0).toLocaleString('fa-IR');
  }
}
