// src/Features/services/place-detail.ts
import { inject, Injectable } from '@angular/core';
import { Httpclient } from '../../Core/services/httpclient';

export type AuthorType = 'AmirAli' | 'User';

export interface ReviewImageDto {
  id: number;
  url: string;
  isCover?: boolean;
}

export interface ReviewDto {
  id: number;
  placeId: number;
  parentId?: number | null;
  author: string;
  authorType: AuthorType;
  rating: number;
  text: string;
  createdAtUtc: string;
  likes: number;
  dislikes: number;
  reported?: boolean;
  images?: ReviewImageDto[];
}

export interface PlaceDetailDto {
  id: number;
  title: string;
  categoryName: string;
  coverImageUrl?: string | null;
  description?: string | null;
  instagramUrl?: string | null;
  phoneNumber?: string | null;
  googleMapsUrl?: string | null;
  neshanUrl?: string | null;
  coordinates?: string | null; // "lat,lng"
  avgRating?: number | null;
  reviewCount?: number | null;

  images?: { id: number; url: string }[];
  reviews?: ReviewDto[]; // اختیاری؛ اگر API جداگانه برای ریویوها داری
}

export interface AddReviewPayload {
  placeId: number;
  parentId?: number | null;
  rating: number;
  text: string;
  captchaToken: string;   // از سرویس کپچا
  captchaAnswer: string;  // جواب کاربر
}

@Injectable({ providedIn: 'root' })
export class PlaceDetailService {
  private http = inject(Httpclient);

  get(placeId: number) {
    // اگر APIِ Place، خودِ Reviews را هم برمی‌گرداند، همین کافی است
    return this.http.get<PlaceDetailDto>(`api/places/${placeId}`);
  }

  getReviews(placeId: number) {
    // اگر ریویوها endpoint جدا دارند:
    return this.http.get<ReviewDto[]>(`api/places/${placeId}/reviews`);
  }

  addReview(p: AddReviewPayload) {
    return this.http.postJson<{ id: number }>(`api/places/${p.placeId}/reviews`, p);
  }

  reportReview(reviewId: number, reason?: string) {
    return this.http.postJson<{ ok: true }>(`api/reviews/${reviewId}/report`, { reason: reason ?? null });
  }
}
