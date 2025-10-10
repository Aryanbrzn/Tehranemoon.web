// src/Features/place-detail/mock-place-detail.service.ts
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PlaceDetailDto, ReviewDto } from '../services/place-detail';

let seqId = 1000;

export const mockPlaceDb: { place: PlaceDetailDto & { reviews: ReviewDto[] } } = {
    place: {
        id: 101,
        title: 'کافه لمیز ولیعصر',
        categoryName: 'کافه',
        coverImageUrl: 'images/coffee.png',
        phoneNumber: '021-12345678',
        instagramUrl: 'https://instagram.com/lamiz',
        coordinates: '35.7005, 51.4083',
        description: 'یک کافه‌ی دنج با قهوه‌های عالی و دسرهای خوشمزه. اینترنت خوب، فضای کار، و موسیقی لایت.',
        images: [
            { id: 1, url: 'images/restaurant.png' },
            { id: 2, url: 'images/location.png' },
            { id: 3, url: 'images/business.png' },
            { id: 4, url: 'images/coffee.png' },
            { id: 5, url: 'images/restaurant.png' },
        ],
        avgRating: 0,
        reviewCount: 0,
        reviews: [] // پر می‌کنیم پایین
    }
};

function recalcStats() {
    const p = mockPlaceDb.place;
    const revs = p.reviews;
    p.reviewCount = revs.length;
    p.avgRating = revs.length ? (revs.reduce((s, r) => s + (r.rating ?? 0), 0) / revs.length) : 0;
}

// seeding
(function seed() {
    const now = Date.now();
    const pid = mockPlaceDb.place.id;

    mockPlaceDb.place.reviews = [
        {
            id: ++seqId,
            placeId: pid,
            parentId: null,
            author: 'AmirAli',
            authorType: 'AmirAli',
            rating: 4.5,
            text: 'اسپرسو عالی بود؛ فضا هم حس نوستالژی داره. کیک هویج رو حتماً امتحان کنید.',
            createdAtUtc: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
            likes: 12,
            dislikes: 1,
            images: [
                { id: 11, url: 'images/restaurant.png' },
                { id: 12, url: 'images/coffee.png' },
            ],
        },
        {
            id: ++seqId,
            placeId: pid,
            parentId: null,
            author: 'سارا',
            authorType: 'User',
            rating: 5,
            text: 'برخورد پرسنل عالی و قهوه ترک با باقلوا واقعاً درجه‌یک!',
            createdAtUtc: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
            likes: 4,
            dislikes: 0,
            images: []
        },
        {
            id: ++seqId,
            placeId: pid,
            parentId: null,
            author: 'مینا',
            authorType: 'User',
            rating: 3,
            text: 'صندلی‌ها کمی ناراحت بود ولی طعم لاته خوب بود.',
            createdAtUtc: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
            likes: 1,
            dislikes: 0,
            images: []
        },

        // یک ریپلایِ نمونه به کامنت «سارا» (parentId = id سارا)
        {
            id: ++seqId,
            placeId: pid,
            parentId: seqId - 1, // ↖️ دقت: parentId ریپلای باید به id آیتم قبل (سارا) اشاره کند
            author: 'علی',
            authorType: 'User',
            rating: 0,
            text: 'سرویس‌دهی‌شون هم سریع بود.',
            createdAtUtc: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
            likes: 0,
            dislikes: 0,
            images: []
        }
    ];

    recalcStats();
})();

function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

@Injectable({ providedIn: 'root' })
export class MockPlaceDetailService {
    get(id: number) {
        return of(deepClone(mockPlaceDb.place)).pipe(delay(200));
    }
}
