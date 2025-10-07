import { Component, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';                // ← برای [(ngModel)] مودال
import { MapComponent } from '../map/map';
import { UserPanelComponent } from '../userpanel/userpanel';
import { CountdownComponent } from '../countdown/countdown';
import { CategoriesService, CategoryDto } from '../services/categories.service';
import { AuthService } from '../../Core/services/auth.service';  // ← چک لاگین
import { tr } from 'motion/react-client';

type Cat = { id: number; name: string; slug: string; color: string; image: string };
type PlaceRow = { title: string; image: string; score: number };

@Component({
  selector: 'app-home',
  imports: [MapComponent, UserPanelComponent, CountdownComponent, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  @ViewChild(MapComponent) mapRef?: MapComponent;
  private catsApi = inject(CategoriesService);
  private auth = inject(AuthService);

  categories: Cat[] = [];
  loading = true;

  // دادهٔ نمونه برای لیست لیدربورد (می‌تونی بعداً از API پرش کنی)
  places: PlaceRow[] = [
    { title: 'کافه نمونه ۱', image: 'images/restaurant.jpg', score: 5 },
    { title: 'کافه نمونه ۲', image: 'images/restaurant.jpg', score: 4 },
    { title: 'کافه نمونه ۳', image: 'images/restaurant.jpg', score: 3 },
    { title: 'کافه نمونه ۴', image: 'images/restaurant.jpg', score: 5 },
    { title: 'کافه نمونه ۵', image: 'images/restaurant.jpg', score: 4 },
  ];

  // --- وضعیت ثبت نظر/ستاره ---
  reviewingIndex: number | null = null;   // کدام ردیف در حالت ثبت نظر است
  starRange = [1, 2, 3, 4, 5];
  hoverRating = 0;
  tempRating = 0;

  // --- مودال ---
  modalOpen = false;
  modalPlace?: PlaceRow;
  reviewText = '';

  constructor() { this.loadCategories(); }

  isAuthed() {
    // return this.auth.isAuthenticated();
    return true;
  }

  startReview(idx: number, row: PlaceRow) {
    if (!this.isAuthed()) return;
    this.reviewingIndex = idx;
    this.hoverRating = 0;
    this.tempRating = 0;
  }

  pickRating(idx: number, val: number, row: PlaceRow) {
    if (this.reviewingIndex !== idx) return;
    this.tempRating = val;
    // پس از انتخاب ستاره، مودال باز شود
    this.modalPlace = row;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.reviewText = '';
    this.reviewingIndex = null;  // خروج از حالت انتخاب ستاره
    this.hoverRating = 0;
    this.tempRating = 0;
  }

  async submitReview() {
    // TODO: اینجا سرویس API ثبت نظر/امتیاز را صدا بزن
    // await this.reviews.add({ placeId, rating: this.tempRating, text: this.reviewText })

    console.log('submit review', {
      place: this.modalPlace?.title,
      rating: this.tempRating,
      text: this.reviewText
    });

    this.closeModal();
  }

  // ---------- موجود: بارگذاری دسته‌ها ----------
  private loadCategories() {
    this.catsApi.getActive().subscribe({
      next: (list) => {
        this.categories = list
          .sort((a, b) => (a.displayOrder - b.displayOrder) || (a.id - b.id))
          .map(this.toCat);
        this.loading = false;
      },
      error: () => { this.categories = []; this.loading = false; }
    });
  }

  private toCat = (x: CategoryDto & Record<string, any>): Cat => {
    const img = x.thumbUrl ?? x.thumbUrl ?? x.imageUrl ?? x.imageUrl ?? 'images/location.jpg';
    return { id: x.id, name: x.name, slug: x.slug, image: img, color: this.pickColor(x.slug) };
  };

  private pickColor(slug: string): string {
    const map: Record<string, string> = { cafe: '#b24bff', restaurant: '#ff7a3d', park: '#4caf50' };
    return map[slug] ?? '#ffd166';
  }

  selected?: Cat;
  select(c: Cat) {
    this.selected = c;
    this.mapRef?.filterByCategory(c.slug);
    this.mapRef?.fitToCategory(c.slug);
    setTimeout(() => this.mapRef?.invalidateSize(), 650);
  }
  clearSelection() {
    this.selected = undefined;
    this.mapRef?.filterByCategory(undefined);
    setTimeout(() => this.mapRef?.invalidateSize(), 350);
  }
}
