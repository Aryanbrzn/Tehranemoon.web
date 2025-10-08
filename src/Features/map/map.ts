import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MapPlaceDto, MapService } from '../services/map-service';
import * as L from 'leaflet';

// گوشه‌های تصویرِ نقشه (مختصات جغرافیایی تهران روی گوگل)
// مقادیر را یک بار بر اساس تصویر خودت تنظیم کن:
const CALIB_BBOX = {
  // شمال‌غرب (lat بالا، lng چپ)
  maxLat: 35.8331,   // نمونه: حوالی شمال تهران
  minLat: 35.5727,   // نمونه: حوالی جنوب تهران
  minLng: 51.1188,   // غرب
  maxLng: 51.62388    // شرق
};
// تبدیل lat/lng به مختصات نرمال تصویر (0..1)
function latLngTo01(lat: number, lng: number) {
  const x01 = (lng - CALIB_BBOX.minLng) / (CALIB_BBOX.maxLng - CALIB_BBOX.minLng);
  const y01 = (lat - CALIB_BBOX.minLat) / (CALIB_BBOX.maxLat - CALIB_BBOX.minLat);
  // کلمپ
  return {
    x01: x01,
    y01: y01
  };
}
@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class MapComponent implements OnInit, OnDestroy {

  private el = inject(ElementRef<HTMLElement>);
  private data = inject(MapService);
  private map!: L.Map;
  private bounds!: L.LatLngBounds;
  private W = 0; private H = 0;

  // keep markers grouped by category
  private groups = new Map<string, L.LayerGroup>();

  ngOnInit() { this.initMap(); }
  ngOnDestroy() { this.map?.remove(); }

  async initMap() {
    const mapEl = this.el.nativeElement.querySelector('.map') as HTMLElement;
    L.DomEvent.disableScrollPropagation(mapEl);
    L.DomEvent.disableClickPropagation(mapEl);
    const src = 'images/tehranMap.png';           // your image
    const { width, height } = await this.loadImage(src);
    this.W = width;
    this.H = height;

    this.bounds = L.latLngBounds([0, 0], [this.H, this.W]);
    this.map = L.map(mapEl, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 3,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      zoomAnimation: false,
      maxBoundsViscosity: 0,
      inertia: false,
      wheelPxPerZoomLevel: 60,
      preferCanvas: true,
      maxBounds: this.bounds,
    });
    L.imageOverlay(src, this.bounds).addTo(this.map);
    this.map.fitBounds(this.bounds);
    setTimeout(() => this.map.invalidateSize(), 0);

    this.data.getPlaces(['cafe', 'restaurant']).subscribe(items => this.renderPins(items));
  }
  public invalidateSize() {
    // this.map?.invalidateSize();
  }
  private renderPins(items: MapPlaceDto[]) {
    this.groups.forEach(g => g.removeFrom(this.map));
    this.groups.clear();

    for (const p of items) {
      if (p.lat == null || p.lng == null) continue;
      const { x01, y01 } = latLngTo01(p.lat, p.lng);
      const x = this.W * x01, y = y01 * this.H;

      const kind = p.categorySlug.toLowerCase();
      let grp = this.groups.get(kind);
      if (!grp) { grp = L.layerGroup().addTo(this.map); this.groups.set(kind, grp); }

      const iconUrl = 'images/avatar.png';
      const icon = L.divIcon({
        className: `pin ${kind}`,
        html: `<img src="${iconUrl}" alt="">`,
        iconSize: [34, 34], iconAnchor: [17, 17]
      });

      L.marker([y, x], { icon })
        .bindTooltip(p.title, { direction: 'top', opacity: .9 })
        .addTo(grp);
    }
  }

  /** Show only a category (or all if undefined) */
  filterByCategory(slug?: string) {
    this.groups.forEach((g, k) => {
      if (!slug || k === slug) { g.addTo(this.map); } else { g.removeFrom(this.map); }
    });
    // ensure map reflows if container width changed
    setTimeout(() => this.map.invalidateSize(), 350);
  }

  fitToCategory(slug: string) {
    const g = this.groups.get(slug);
    if (!g) return;
    const b = (g as any).getBounds?.() as L.LatLngBounds | undefined;
    if (b && b.isValid()) this.map.fitBounds(b.pad(0.2));
  }

  private loadImage(url: string): Promise<{ width: number; height: number }> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () =>
        res({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      img.onerror = rej;
      img.src = url;
    });
  }
}
