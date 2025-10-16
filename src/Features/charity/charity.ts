// charity.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CharityService, CharityProgressDto } from '../services/charity.service';

@Component({
  selector: 'app-charity',
  imports: [],
  templateUrl: './charity.html',
  styleUrl: './charity.css'
})
export class Charity implements OnInit {
  private api = inject(CharityService);
  progress = signal<CharityProgressDto | null>(null);

  ngOnInit() {
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
