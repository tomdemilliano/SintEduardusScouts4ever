import { useEffect, useRef } from 'react';
import { colors } from '../lib/theme';

export default function CampMap({ pins }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || pins.length === 0) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return;

      // voorkom dubbele init bij snelle re-renders (bv. React strict mode)
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current, { scrollWheelZoom: false });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap-bijdragers',
        maxZoom: 18,
      }).addTo(map);

      const markerIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${colors.campfire};border:3px solid ${colors.paper};box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const bounds = [];
      pins.forEach((pin) => {
        const marker = L.marker([pin.lat, pin.lng], { icon: markerIcon }).addTo(map);
        marker.bindPopup(
          `<strong>${pin.naam}</strong><br/>${pin.count} vermelding${pin.count === 1 ? '' : 'en'}`
        );
        bounds.push([pin.lat, pin.lng]);
      });

      if (bounds.length === 1) {
        map.setView(bounds[0], 9);
      } else {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pins]);

  if (pins.length === 0) return null;

  return <div ref={containerRef} style={{ width: '100%', height: 360, borderRadius: 4 }} />;
}
