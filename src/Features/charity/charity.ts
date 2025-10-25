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

  // Constants for progress calculation
  readonly MAX_AMOUNT = 20000000; // 20 million toman
  readonly AMOUNT_PER_POLAROID = 5000; // 5000 toman per polaroid

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

  // Calculate current amount based on polaroid count
  getCurrentAmount(): number {
    const polaroidCount = this.progress()?.totalFavorites ?? 0;
    return polaroidCount * this.AMOUNT_PER_POLAROID;
  }

  // Calculate progress percentage
  getProgressPercentage(): number {
    const currentAmount = this.getCurrentAmount();
    return Math.min((currentAmount / this.MAX_AMOUNT) * 100, 100);
  }
}
