import { Injectable } from '@angular/core';
import { Httpclient } from '../../Core/services/httpclient';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  constructor(private http: Httpclient) { }

  getPlaces(categories?: string[]) {
    return this.http.get<MapPlaceDto[]>('api/map/places', {
      categories, pageSize: 5000   // tweak as you like
    });
  }
}
export interface MapPlaceDto {
  id: number;
  title: string;
  categorySlug: string;     // e.g., "cafe", "restaurant"
  x01: number;              // 0..1 (left -> right)
  y01: number;              // 0..1 (top  -> bottom)
}