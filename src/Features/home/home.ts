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
import { ImageService } from '../../Core/services/image.service';
import { PlaceRequestSubmitComponent, PlaceRequestSubmitResult } from '../userpanel/place-request-submit/place-request-submit';
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
  rank: number;              // 👈 rank indicator (1-100, where 1 is best)
  originalIndex?: number; // Store original position in leaderboard
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
  private imageService = inject(ImageService);
  faMagnify = faMagnifyingGlass;
  categories: Cat[] = [];
  loading = true;

  places: PlaceRow[] = [];
  originalPlaces: PlaceRow[] = []; // Store original unsorted data
  loadingPlaces = false;
  isSearching = false; // Track if we're currently searching
  hasSearchResults = true; // Track if search has results

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

    // If less than 3 characters, don't make API call and don't empty the list
    if (q && q.length < 3) {
      this.isSearching = false;
      this.hasSearchResults = true;
      return;
    }

    // Always send categoryId if a category is selected, even during search
    // If no category is selected and no search query, don't make API call
    const categoryId = this.selected?.id;
    if (!categoryId && !q) { this.places = []; return; }

    // Set search state
    this.isSearching = !!q;
    this.loadingPlaces = true;

    this.lbApi.get(categoryId, q).subscribe({
      next: list => {
        // API already returns sorted data with rank indicators
        const processedList = list.map((x, index) => {
          const avg = x.avgRating ?? 0;
          const rounded = Math.round(avg); // 2.6→3 ، 2.4→2

          // If we have original data and this is a search, find the original index
          let originalIndex = index;
          if (q && this.originalPlaces.length > 0) {
            const originalPlace = this.originalPlaces.find(op => op.id === x.id);
            originalIndex = originalPlace ? originalPlace.originalIndex || 0 : index;
          }

          // Use category image as fallback if place has no image
          let imageUrl = x.coverImageUrl;
          if (!imageUrl && this.selected) {
            imageUrl = this.selected.image;
          }
          if (!imageUrl) {
            imageUrl = 'images/restaurant.png'; // Final fallback
          }

          return {
            id: x.id,
            title: x.title,
            category: x.categorySlug,
            image: imageUrl,
            reviewCount: x.reviewCount,
            avgRating: avg,
            roundedAvg: rounded,
            fiveStarCount: x.fiveStarCount,
            rank: x.rank,
            originalIndex: originalIndex // Store original position
          } as PlaceRow & { originalIndex: number };
        });

        // If this is not a search (category selection), store as original data
        if (!q) {
          this.originalPlaces = processedList;
        }

        this.places = processedList;
        this.hasSearchResults = processedList.length > 0;
        this.loadingPlaces = false;
      },
      error: _ => {
        this.places = [];
        this.hasSearchResults = false;
        this.loadingPlaces = false;
      }
    });
  }

  // Check if a place is in the actual top 3 (not filtered results)
  isActualTopThree(place: PlaceRow): boolean {
    if (!place.originalIndex && place.originalIndex !== 0) return false;
    return place.originalIndex < 3;
  }

  // Get the actual rank of a place (1-based)
  getActualRank(place: PlaceRow): number {
    if (!place.originalIndex && place.originalIndex !== 0) return 0;
    return place.originalIndex + 1;
  }

  pickRating(idx: number, val: number, row: PlaceRow) {
    if (this.reviewingIndex !== idx) return;
    this.tempRating = val; this.modalPlace = row; this.modalOpen = true;
  }
  closeModal() { this.modalOpen = false; this.reviewText = ''; this.reviewingIndex = null; this.hoverRating = 0; this.tempRating = 0; }

  async submitReview() {
    this.closeModal();
  }

  // Image handlers for debugging
  onImageError(event: any, category: Cat) {
    // Fallback to default image
    event.target.src = 'images/location.png';
  }

  onImageLoad(event: any, category: Cat) {
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
      error: (err) => {
        this.categories = [];
        this.loading = false;
      }
    });
  }

  private toCat = (x: CategoryDto & Record<string, any>): Cat => {
    const img = x.thumbUrl ?? x.imageUrl ?? 'images/location.png';
    return {
      id: x.id,
      name: x.name,
      slug: x.slug,
      image: this.imageService.getImageUrl(img),
      color: this.pickColor(x.slug)
    };
  };
  private pickColor(slug: string): string {
    const map: Record<string, string> = { cafe: '#b24bff', restaurant: '#ff7a3d', park: '#4caf50' };
    return map[slug] ?? '#ffd166';
  }

  openPlaceRequestModal() {
    const ref = this.modal.open(PlaceRequestSubmitComponent, {
      data: { categoryId: this.selected?.id },
      panelClass: ['app-modal-panel', 'app-place-request-panel'],
      backdropClass: 'app-modal-backdrop'
    }) as unknown as import('../../Shared/modal/modal-ref').ModalRef<PlaceRequestSubmitResult>;

    ref.afterClosed$.subscribe((result: PlaceRequestSubmitResult | undefined) => {
      if (result?.success) {
        // Optionally show a success message or refresh the search
      }
    });
  }
}
