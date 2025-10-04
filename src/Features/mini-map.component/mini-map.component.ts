// src/Features/place-detail/mini-map.component.ts
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'mini-map',
  standalone: true,
  template: `<div class="mini-map"></div>`,
  styles: [`
    @import "leaflet/dist/leaflet.css";
    :host { display:block }
    .mini-map { height:260px;width:100%;border-radius:12px;overflow:hidden }
    .leaflet-container{ background:transparent }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniMapComponent implements OnChanges, OnDestroy {
  @Input() lat?: number;
  @Input() lng?: number;
  @Input() title = 'Location';

  private host = inject(ElementRef<HTMLElement>);
  private map?: L.Map;
  private marker?: L.Marker;

  ngOnChanges(_: SimpleChanges) {
    if (this.lat == null || this.lng == null) return;
    if (!this.map) this.init();
    const p = L.latLng(this.lat, this.lng);
    this.marker?.remove();
    this.marker = L.marker(p).addTo(this.map!).bindTooltip(this.title, { direction: 'top', opacity: .9 });
    this.map!.setView(p, 16, { animate: true });
  }
  ngOnDestroy() { this.map?.remove(); }

  private init() {
    const el = this.host.nativeElement.querySelector('.mini-map') as HTMLElement;
    this.map = L.map(el, { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' })
      .addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 50);
  }
}
