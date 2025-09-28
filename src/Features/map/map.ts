import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { MapPlaceDto, MapService } from '../services/map-service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class Map implements OnInit, OnDestroy {

  private el = inject(ElementRef<HTMLElement>);
  private data = inject(MapService);

  private map!: L.Map;
  private imageLayer!: L.ImageOverlay;
  private bounds!: L.LatLngBounds;    // [ [0,0], [H,W] ] in image CRS
  private W = 0; private H = 0;

  ngOnInit() {
    this.initMap();
  }
  ngOnDestroy() {
    this.map?.remove();
  }

  private async initMap() {
    const mapEl = this.el.nativeElement.querySelector('.map') as HTMLElement;

    // Load the image to read natural size
    const src = 'images/tehranMap.jpg';
    const { width, height } = await this.loadImage(src);
    this.W = width; this.H = height;

    // Build simple CRS with image coordinates
    this.bounds = L.latLngBounds(L.latLng(0, 0), L.latLng(this.H, this.W));

    this.map = L.map(mapEl, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 4,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 100,
      preferCanvas: true,
      maxBounds: this.bounds.pad(0.3)
    });

    this.imageLayer = L.imageOverlay(src, this.bounds).addTo(this.map);
    this.map.fitBounds(this.bounds);

    // Load pins
    this.data.getPlaces(['cafe', 'restaurant']).subscribe(items => this.renderPins(items));
  }

  private renderPins(items: MapPlaceDto[]) {
    for (const p of items) {
      if (p.x01 == null || p.y01 == null) continue;
      const x = p.x01 * this.W;
      const y = p.y01 * this.H;

      const kind = p.categorySlug.toLowerCase();
      const iconUrl = kind === 'cafe' ? 'assets/map/icons/cafe.svg' : 'assets/map/icons/restaurant.svg';
      const cls = kind === 'cafe' ? 'cafe' : 'restaurant';

      const icon = L.divIcon({
        className: `pin ${cls}`,
        html: `<img src="${iconUrl}" alt="">`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const m = L.marker([y, x], { icon });
      m.bindTooltip(p.title, { direction: 'top', opacity: 0.9 });
      m.addTo(this.map);
    }
  }

  private loadImage(url: string): Promise<{ width: number; height: number }> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = rej;
      img.src = url;
    });
  }
}
