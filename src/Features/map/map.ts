import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MapPlaceDto, MapService } from '../services/map-service';
import * as L from 'leaflet';

const CALIB_BBOX = { maxLat: 35.95, minLat: 35.50, minLng: 51.15, maxLng: 51.60 };
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

  // رنگ‌ها بر اساس slug (fallback به default)
  @Input() dotColorMap: Record<string, string> = {
    cafe: '#ff7b89',
    restaurant: '#ffd166',
    park: '#4cd964',
    business: '#5da9ff',
  };

  dotRadius = 7;

  // Responsive pin sizes based on screen size
  getResponsiveDotRadius(): number {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 380) return 5;      // Small mobile
      if (width <= 480) return 6;      // Medium mobile
      if (width <= 768) return 7;      // Tablet
      return 8;                        // Desktop
    }
    return 7;
  }
  private el = inject(ElementRef<HTMLElement>);
  private data = inject(MapService);

  private map!: L.Map;
  private bounds!: L.LatLngBounds;
  private overlay!: L.ImageOverlay;

  private W = 0;
  private H = 0;
  private groups = new Map<string, L.LayerGroup>();
  private resizeObserver?: ResizeObserver;
  // Add marker cache to avoid recreating markers
  private markerCache = new Map<number, L.CircleMarker>();

  ngOnInit() { this.initMap(); }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.map?.remove();
    // Clear marker cache
    this.markerCache.clear();
  }

  private async initMap() {
    const mapEl = this.el.nativeElement.querySelector('.map') as HTMLElement;
    L.DomEvent.disableScrollPropagation(mapEl);
    L.DomEvent.disableClickPropagation(mapEl);

    this.map = L.map(mapEl, {
      crs: L.CRS.Simple,
      minZoom: 0,
      maxZoom: 2,
      zoomSnap: 0.25,
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

    this.overlay.once('load', () => {
      const container = this.map.getContainer() as HTMLElement;
      this.W = container.clientWidth;
      this.H = container.clientHeight;

      this.bounds = L.latLngBounds([0, 0], [this.H, this.W]);
      this.overlay.setBounds(this.bounds);
      this.map.setMaxBounds(this.bounds);
      this.map.fitBounds(this.bounds, { animate: false });
      this.map.invalidateSize({ pan: false });

      // ⬅️ فقط یکبار کل نقاط را بگیر
      this.data.getPlaces().subscribe(items => this.renderPins(items));

      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === container) {
            const cr = entry.contentRect;
            if (Math.round(cr.width) !== Math.round(this.W) || Math.round(cr.height) !== Math.round(this.H)) {
              this.W = Math.max(1, Math.round(cr.width));
              this.H = Math.max(1, Math.round(cr.height));
              this.bounds = L.latLngBounds([0, 0], [this.H, this.W]);
              this.overlay.setBounds(this.bounds);
              this.map.setMaxBounds(this.bounds);
              this.map.fitBounds(this.bounds, { animate: false });
              this.map.invalidateSize({ pan: false });
              // نیازی به رندر مجدد نیست؛ leaflet خودش لایه‌ها رو reproject می‌کند
            }
          }
        }
      });
      this.resizeObserver.observe(container);
    });
  }

  private renderPins(items: MapPlaceDto[]) {
    if (!this.W || !this.H) return;

    // Create a set of current item IDs for efficient lookup
    const currentIds = new Set(items.map(p => p.id));

    // Remove markers that are no longer needed
    for (const [id, marker] of this.markerCache) {
      if (!currentIds.has(id)) {
        marker.remove();
        this.markerCache.delete(id);
      }
    }

    // Add or update markers for current items
    for (const p of items) {
      if (p.lat == null || p.lng == null) continue;

      const { x01, y01 } = latLngTo01(p.lat, p.lng);
      const x = this.W * x01;
      const y = this.H * y01;

      const slug = p.categorySlug?.toLowerCase() ?? 'default';

      let grp = this.groups.get(slug);
      if (!grp) {
        grp = L.layerGroup().addTo(this.map);
        this.groups.set(slug, grp);
      }

      // Check if marker already exists
      let marker = this.markerCache.get(p.id);
      if (!marker) {
        const color = this.dotColorMap[slug] ?? '#ffd166';
        marker = L.circleMarker([y, x], {
          radius: this.getResponsiveDotRadius(),
          color,
          weight: 0,
          fillColor: color,
          fillOpacity: 1
        });

        marker.on('click', () => this.placeClick.emit(p.id));
        this.markerCache.set(p.id, marker);
      } else {
        // Update position if needed
        marker.setLatLng([y, x]);
      }

      // Ensure marker is in the correct group
      marker.addTo(grp);
    }
  }

  filterByCategorySlug(slug?: string) {
    const normalized = slug?.toLowerCase();
    this.groups.forEach((g, k) => {
      if (!normalized || k === normalized) {
        g.addTo(this.map);
      } else {
        g.removeFrom(this.map);
      }
    });
    // برای رفع گلیچ‌های بصری ریز
    setTimeout(() => this.map.invalidateSize(), 0);
  }

  fitToCategory(_id: number) {
  }

  invalidateSize() { this.map.invalidateSize(); }
}
