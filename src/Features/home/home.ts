import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapComponent } from '../map/map';
import { UserPanelComponent } from '../userpanel/userpanel';
import { CountdownComponent } from '../countdown/countdown';
import { CategoriesService, CategoryDto } from '../services/categories.service';
import { AuthService } from '../../Core/services/auth.service';
import { ModalService } from '../../Shared/modal/modal.service';
import { PlaceDetailComponent } from '../place-detail/place-detail';
import { LeaderboardService, LeaderboardItem } from '../services/leaderboard.service';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { Footer } from "../../Shared/footer/footer";
import { Charity } from "../charity/charity";
type Cat = { id: number; name: string; slug: string; color: string; image: string };
type PlaceRow = {
  id: number,
  title: string;
  image: string;
  score: number,
  reviewCount: number,
  avgRating?: number,
  category: string
  roundedAvg: number;
  fiveStarCount: number;
};

@Component({
  selector: 'app-home',
  imports: [CommonModule, MapComponent, UserPanelComponent, CountdownComponent, FormsModule, FontAwesomeModule, Footer, Charity],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  @ViewChild(MapComponent) mapRef?: MapComponent;
  private catsApi = inject(CategoriesService);
  private auth = inject(AuthService);
  private modal = inject(ModalService);
  private lbApi = inject(LeaderboardService);
  faMagnify = faMagnifyingGlass;
  categories: Cat[] = [];
  loading = true;

  places: PlaceRow[] = [];
  loadingPlaces = false;

  searchText = '';

  reviewingIndex: number | null = null;
  starRange = [1, 2, 3, 4, 5];
  hoverRating = 0;
  tempRating = 0;

  modalOpen = false;
  modalPlace?: PlaceRow;
  reviewText = '';

  constructor() {
    this.loadCategories();
  }

  isAuthed() { true; }

  openPlaceDetail(placeId: number) {
    this.modal.open(PlaceDetailComponent, {
      data: { id: placeId },
      width: '92vw',
      maxHeight: '90vh',
      panelClass: ['app-modal-panel', 'paper-modal'],
    });
  }
  selected?: Cat;
  select(c: Cat) {
    this.selected = c;
    this.mapRef?.filterByCategorySlug(c.slug);
    setTimeout(() => this.mapRef?.invalidateSize(), 650);
    this.refreshPlaces();
  }

  clearSelection() {
    this.selected = undefined;
    this.mapRef?.filterByCategorySlug(undefined);
    setTimeout(() => this.mapRef?.invalidateSize(), 350);
    // اگر کاربر در حال جست‌وجوست و >=3 حرف دارد، نتایج سراسری را نشان بده
    if (this.searchText.trim().length >= 3) this.refreshPlaces();
    else this.places = [];
  }

  // --- Search ---
  doSearch() { this.refreshPlaces(); }

  private refreshPlaces() {
    const q = this.searchText.trim();

    // اگر کمتر از ۳ حرف است: هیچ درخواستی نفرست و لیست را خالی کن
    if (q && q.length < 3) { this.places = []; return; }

    // اگر عبارت جست‌وجو داریم، بین همهٔ دسته‌ها بگردیم (categoryId را نفرستیم)
    // اگر جست‌وجو نداریم، فقط دستهٔ انتخاب‌شده را بفرستیم
    const categoryId = q ? undefined : this.selected?.id;
    if (!categoryId && !q) { this.places = []; return; }

    this.loadingPlaces = true;
    this.lbApi.get(categoryId, q).subscribe({
      next: list => {
        this.places = list.map(x => {
          const avg = x.avgRating ?? 0;
          const rounded = Math.round(avg); // 2.6→3 ، 2.4→2
          return {
            id: x.id,
            title: x.title,
            category: x.categorySlug,
            image: x.coverImageUrl
              ? x.coverImageUrl
              : 'images/restaurant.png',
            reviewCount: x.reviewCount,
            avgRating: avg,
            roundedAvg: rounded,
            fiveStarCount: x.fiveStarCount
          } as PlaceRow;
        });
        this.loadingPlaces = false;
      },
      error: _ => { this.places = []; this.loadingPlaces = false; }
    });
  }

  pickRating(idx: number, val: number, row: PlaceRow) {
    if (this.reviewingIndex !== idx) return;
    this.tempRating = val; this.modalPlace = row; this.modalOpen = true;
  }
  closeModal() { this.modalOpen = false; this.reviewText = ''; this.reviewingIndex = null; this.hoverRating = 0; this.tempRating = 0; }

  async submitReview() {
    console.log('submit review', { place: this.modalPlace?.title, rating: this.tempRating, text: this.reviewText });
    this.closeModal();
  }

  // Image handlers for debugging
  onImageError(event: any, category: Cat) {
    console.error('Image failed to load:', category.image, event);
    // Fallback to default image
    event.target.src = 'images/location.png';
  }

  onImageLoad(event: any, category: Cat) {
    console.log('Image loaded successfully:', category.image);
  }

  // --- Categories load ---
  private loadCategories() {
    this.catsApi.getActive().subscribe({
      next: (list) => {
        console.log('Categories received:', list); // Debug log
        this.categories = list
          .sort((a, b) => (a.displayOrder - b.displayOrder) || (a.id - b.id))
          .map(this.toCat);
        console.log('Processed categories:', this.categories); // Debug log
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err); // Debug log
        this.categories = [];
        this.loading = false;
      }
    });
  }

  private toCat = (x: CategoryDto & Record<string, any>): Cat => {
    const img = x.thumbUrl ?? x.imageUrl ?? 'images/location.png';
    const fullImageUrl = img.startsWith('http') ? img : 'http://localhost:5057/' + img;
    console.log('Category image URL:', fullImageUrl); // Debug log
    return {
      id: x.id,
      name: x.name,
      slug: x.slug,
      image: fullImageUrl,
      color: this.pickColor(x.slug)
    };
  };
  private pickColor(slug: string): string {
    const map: Record<string, string> = { cafe: '#b24bff', restaurant: '#ff7a3d', park: '#4caf50' };
    return map[slug] ?? '#ffd166';
  }
}
