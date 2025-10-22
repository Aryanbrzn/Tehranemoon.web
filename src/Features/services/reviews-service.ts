import { inject, Injectable } from '@angular/core';
import { Httpclient } from '../../Core/services/httpclient';

export type ReviewAuthorType = 'AmirAli' | 'User';
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; }
export interface AddReviewBody {
  placeId: number;
  rating: number;
  text: string;
  fingerprint: string;
  captchaToken: string;
  captchaAnswer: string;
}

export interface UserRatingResponse {
  rating: number;  // 0 if not rated
  text: string | null;  // null if no text
  hasRated: boolean;  // boolean indicating if user has rated
  hasDescription: boolean;  // boolean indicating if user has submitted description
}
export interface AddReplyBody { text: string; }
export interface ReviewDto {
  id: number;
  author: string;
  authorType: ReviewAuthorType;
  text: string;
  rating: number;
  createdAtUtc: string;
  replies?: ReplyDto[];
}

export interface ReplyDto {
  id: number;
  author: string;
  text: string;
  createdAtUtc: string;
  parentReviewId: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private http = inject(Httpclient);

  /** ثبت نظر سطح اول برای یک مکان */
  addReview(placeId: number, dto: AddReviewBody) {
    return this.http.postJson<{ id: number }>(`api/places/${placeId}/reviews`, dto);
  }

  /** دریافت امتیاز کاربر برای یک مکان */
  getUserRating(placeId: number) {
    return this.http.get<UserRatingResponse>(`api/places/${placeId}/user-rating`);
  }
  list(placeId: number, page = 1, pageSize = 10) {
    return this.http.get<Paged<any>>('/api/reviews', { placeId, page, pageSize });
  }
  /** ریپلای به یک نظر */
  addReply(reviewId: number, dto: {
    text: string;
    captchaToken?: string;
    captchaAnswer?: string;
  }) {
    return this.http.postJson<{ id: number }>(`api/reviews/${reviewId}/replies`, dto);
  }

  /** ریپورت یک نظر یا ریپلای */
  report(reviewOrReplyId: number, reason: string) {
    return this.http.postJson<{ ok: true }>(`api/reviews/${reviewOrReplyId}/report`, { reason });
  }
  like(reviewId: number) {
    return this.http.postJson(`/api/reviews/${reviewId}/like`, {});
  }
  dislike(reviewId: number) {
    return this.http.postJson(`/api/reviews/${reviewId}/dislike`, {});
  }

}
