import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MapPlaceDto, MapService } from '../services/map-service';
import * as L from 'leaflet';

/** BBOX جغرافیایی کل تصویری که طراحی کرده‌ای */
const CALIB_BBOX = {
  maxLat: 35.95,  // شمال
  minLat: 35.50,  // جنوب
  minLng: 51.15,  // غرب
  maxLng: 51.60   // شرق
};

function latLngTo01(lat: number, lng: number) {
  const x01 = (lng - CALIB_BBOX.minLng) / (CALIB_BBOX.maxLng - CALIB_BBOX.minLng);
  const y01 = (lat - CALIB_BBOX.minLat) / (CALIB_BBOX.maxLat - CALIB_BBOX.minLat);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return { x01: clamp(x01 + 0.05), y01: clamp(y01 + 0.1) };
}

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit, OnDestroy {

  @Output() placeClick = new EventEmitter<number>();
  @Input() iconMap: Record<string, string> = {
    cafe: 'images/coffee.png',
    restaurant: 'images/restaurant.png',
    park: 'images/location.png',
    default: 'images/location.png',
  };

  private el = inject(ElementRef<HTMLElement>);
  private data = inject(MapService);

  private map!: L.Map;
  private bounds!: L.LatLngBounds;
  private overlay!: L.ImageOverlay;

  // ابعاد مرجع (بر اساس کانتینر Leaflet)
  private W = 0;
  private H = 0;

  // گروه‌بندی مارکرها
  private groups = new Map<string, L.LayerGroup>();

  // رفرنس برای ریسایز
  private resizeObserver?: ResizeObserver;

  ngOnInit() { this.initMap(); }
  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  /** راه‌اندازی مپ + صبر برای load تصویر، و تراز کردن با ابعاد کانتینر Leaflet */
  async initMap() {
    const mapEl = this.el.nativeElement.querySelector('.map') as HTMLElement;
    L.DomEvent.disableScrollPropagation(mapEl);
    L.DomEvent.disableClickPropagation(mapEl);

    this.map = L.map(mapEl, {
      crs: L.CRS.Simple,
      minZoom: 0,
      maxZoom: 2,
      zoomSnap: 0.25,
      boxZoom: true,
      attributionControl: true,
      zoomDelta: 0.5,
      zoomAnimation: false,
      inertia: false,
      wheelPxPerZoomLevel: 60,
      preferCanvas: true
    });

    this.map.setView([0, 0], -1);

    const src = 'images/tehranMap.png';
    const tempBounds = L.latLngBounds([0, 0], [1, 1]);
    this.overlay = L.imageOverlay(src, tempBounds).addTo(this.map);

    // وقتی تصویر لود شد
    this.overlay.once('load', () => {
      // ابعاد از کانتینر Leaflet (چیزی که خودت گفتی درست‌تره)
      const container = this.map.getContainer() as HTMLElement;
      this.W = container.clientWidth;   // عرض مرجع
      this.H = container.clientHeight;  // ارتفاع مرجع (مثبت، رو به پایین)

      this.applyBoundsAndRender();

      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === container) {
            const cr = entry.contentRect;
            // اگر واقعاً تغییری رخ داده:
            if (Math.round(cr.width) !== Math.round(this.W) || Math.round(cr.height) !== Math.round(this.H)) {
              this.W = Math.max(1, Math.round(cr.width));
              this.H = Math.max(1, Math.round(cr.height));
              this.applyBoundsAndRender();
            }
          }
        }
      });
      this.resizeObserver.observe(container);
    });
  }
  private applyBoundsAndRender() {
    this.bounds = L.latLngBounds([0, 0], [this.H, this.W]);
    this.overlay.setBounds(this.bounds);
    this.map.setMaxBounds(this.bounds);
    this.map.fitBounds(this.bounds, { animate: false });
    this.map.invalidateSize({ pan: false });

    this.data.getPlaces(['cafe', 'restaurant']).subscribe(items => this.renderPins(items));
  }
  private renderPins(items: MapPlaceDto[]) {
    if (!this.W || !this.H) return;
    this.groups.forEach(g => g.removeFrom(this.map));
    this.groups.clear();

    for (const p of items) {
      if (p.lat == null || p.lng == null) continue;

      const { x01, y01 } = latLngTo01(p.lat, p.lng);
      const x = this.W * x01;
      const y = this.H * y01;

      const kind = (p.categorySlug ?? '').toLowerCase() || 'default';
      let grp = this.groups.get(kind);
      if (!grp) {
        grp = L.layerGroup().addTo(this.map);
        this.groups.set(kind, grp);
      }

      const iconUrl = this.iconMap[kind] || this.iconMap;

      const icon = L.divIcon({
        className: `pin ${kind}`,
        html: `<img src="${iconUrl}" alt="${kind}" style="width:100%;height:100%;object-fit:contain">`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const m = L.marker([y, x], { icon }).addTo(grp);
      m.on('click', () => this.placeClick.emit(p.id));
    }
  }

  filterByCategory(slug?: string) {
    this.groups.forEach((g, k) => {
      if (!slug || k === slug) { g.addTo(this.map); } else { g.removeFrom(this.map); }
    });
    setTimeout(() => this.map.invalidateSize(), 350);
  }

  fitToCategory(slug: string) {
    const g = this.groups.get(slug);
    if (!g) return;
    const b = (g as any).getBounds?.() as L.LatLngBounds | undefined;
    if (b && b.isValid()) this.map.fitBounds(b.pad(0.2));
  }

  invalidateSize() {
    this.map.invalidateSize();
  }
}
