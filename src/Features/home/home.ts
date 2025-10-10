import { Component, ViewChild, inject } from '@angular/core';
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
type Cat = { id: number; name: string; slug: string; color: string; image: string };
type PlaceRow = { id: number, title: string; image: string; score: number, reviewCount: number, avgRating?: number, category: string };

@Component({
  selector: 'app-home',
  imports: [MapComponent, UserPanelComponent, CountdownComponent, FormsModule, FontAwesomeModule, Footer],
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

  constructor() { this.loadCategories(); }

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
    this.mapRef?.filterByCategory(c.slug);
    this.mapRef?.fitToCategory(c.slug);
    setTimeout(() => this.mapRef?.invalidateSize(), 650);
    this.refreshPlaces();
  }
  clearSelection() {
    this.selected = undefined;
    this.mapRef?.filterByCategory(undefined);
    setTimeout(() => this.mapRef?.invalidateSize(), 350);
    this.places = [];
  }

  // --- Search ---
  doSearch() { this.refreshPlaces(); }

  private refreshPlaces() {
    const q = this.searchText.trim();
    const cat = q ? undefined : this.selected?.slug;
    if (!cat && !q) { this.places = []; return; }

    this.loadingPlaces = true;
    this.lbApi.get(this.selected?.id ?? 0).subscribe({
      next: list => {
        this.places = list.map(x => ({
          id: x.id,
          title: x.title,
          category: x.categorySlug,
          image: x.coverImageUrl || 'images/restaurant.png',
          score: x.avgRating ?? 0,
          reviewCount: x.reviewCount
        }));
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

  // --- Categories load ---
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
    const img = x.thumbUrl ?? x.thumbUrl ?? x.imageUrl ?? x.imageUrl ?? 'images/location.png';
    return { id: x.id, name: x.name, slug: x.slug, image: img, color: this.pickColor(x.slug) };
  };
  private pickColor(slug: string): string {
    const map: Record<string, string> = { cafe: '#b24bff', restaurant: '#ff7a3d', park: '#4caf50' };
    return map[slug] ?? '#ffd166';
  }
}
