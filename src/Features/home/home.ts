import { Component, ViewChild } from '@angular/core';
import { MapComponent } from "../map/map";

type Cat = { id: number; name: string; slug: 'cafe' | 'restaurant' | 'park'; color: string; image: string };


@Component({
  selector: 'app-home',
  imports: [MapComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  @ViewChild(MapComponent) mapRef?: MapComponent;

  // mock categories (image + name)
  categories: Cat[] = [
    { id: 1, name: 'کافه‌ها', slug: 'cafe', color: '#b24bff', image: 'images/coffee.jpg' },
    { id: 2, name: 'رستوران‌ها', slug: 'restaurant', color: '#ff7a3d', image: 'images/restaurant.jpg' },
    { id: 3, name: 'پارک‌ها', slug: 'park', color: '#4caf50', image: 'images/location.jpg' },
    { id: 3, name: 'کسب و کار', slug: 'park', color: '#4caf50', image: 'images/business.jpg' },
  ];

  selected?: Cat;

  select(c: Cat) {
    this.selected = c;
    // tell the map to filter+fit
    this.mapRef?.filterByCategory(c.slug);
    this.mapRef?.fitToCategory(c.slug);
  }
  clearSelection() {
    this.selected = undefined;
    this.mapRef?.filterByCategory(undefined);
  }

}
