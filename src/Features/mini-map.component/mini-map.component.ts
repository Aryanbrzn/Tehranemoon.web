import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'assets/leaflet/marker-icon.png',
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
(L.Marker.prototype as any).options.icon = DefaultIcon;

@Component({
  selector: 'mini-map',
  standalone: true,
  templateUrl: './mini-map.component.html',
  styleUrl: './mini-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  @Input() lat?: number;
  @Input() lng?: number;
  @Input() title = 'Location';
  @Input() zoom = 15;

  private map?: L.Map;
  private marker?: L.CircleMarker;
  private ro?: ResizeObserver;
  private rafId = 0;

  ngAfterViewInit() {
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: false })
      .setView([this.lat ?? 0, this.lng ?? 0], this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    if (this.lat != null && this.lng != null) {
      this.marker = L.circleMarker([this.lat, this.lng], {
        radius: 7,
        color: 'red',
        fillColor: 'red',
        fillOpacity: 0.9,
        weight: 1
      }).addTo(this.map)
        .bindTooltip(this.title, { direction: 'left', opacity: .9 });
    }

    const bump = () => this.map && this.map.invalidateSize();
    this.map.whenReady(bump);
    requestAnimationFrame(bump);
    setTimeout(bump, 0);
    setTimeout(bump, 200);

    this.ro = new ResizeObserver(() => {
      cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(bump);
    });
    this.ro.observe(this.mapEl.nativeElement);
  }

  ngOnChanges(_: SimpleChanges) {
    if (!this.map || this.lat == null || this.lng == null) return;
    const p = L.latLng(this.lat, this.lng);
    if (!this.marker) this.marker = L.circleMarker(p).addTo(this.map);
    this.marker.setLatLng(p).unbindTooltip().bindTooltip(this.title, { direction: 'left', opacity: .9 });
    this.map.setView(p, this.zoom, { animate: true });
    requestAnimationFrame(() => this.map!.invalidateSize());
  }

  ngOnDestroy() {
    this.ro?.disconnect();
    cancelAnimationFrame(this.rafId);
    this.map?.remove();
  }
}
