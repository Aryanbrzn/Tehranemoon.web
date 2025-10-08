import { Injectable } from '@angular/core';
import { Httpclient } from '../../Core/services/httpclient';
export interface MapPlaceDto {
  id: number;
  title: string;
  categorySlug: string;
  lat: number | null;
  lng: number | null;
}
@Injectable({
  providedIn: 'root'
})
export class MapService {
  constructor(private http: Httpclient) { }

  getPlaces(categories?: string[]) {
    return this.http.get<MapPlaceDto[]>('api/map', {
      categories
    });
  }
}