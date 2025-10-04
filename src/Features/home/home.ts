import { Component, ViewChild } from '@angular/core';
import { MapComponent } from "../map/map";
import { UserPanelComponent } from "../userpanel/userpanel";
import { CountdownComponent } from "../countdown/countdown";

type Cat = { id: number; name: string; slug: 'cafe' | 'restaurant' | 'park'; color: string; image: string };


@Component({
  selector: 'app-home',
  imports: [
    MapComponent,
    UserPanelComponent,
    CountdownComponent
  ],
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
    this.mapRef?.filterByCategory(c.slug);
    this.mapRef?.fitToCategory(c.slug);
    setTimeout(() => this.mapRef?.invalidateSize(), 650); // بعد از انیمیشن
  }

  clearSelection() {
    this.selected = undefined;
    this.mapRef?.filterByCategory(undefined);
    setTimeout(() => this.mapRef?.invalidateSize(), 350);
  }

}
