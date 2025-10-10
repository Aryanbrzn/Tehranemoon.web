import { inject, Injectable } from '@angular/core';
import { Httpclient } from '../../Core/services/httpclient';

export type ReviewAuthorType = 'AmirAli' | 'User';

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
  addReview(placeId: number, dto: {
    rating: number;
    text: string;
    captchaToken: string;
    captchaAnswer: string;
  }) {
    return this.http.postJson<{ id: number }>(`api/places/${placeId}/reviews`, dto);
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
