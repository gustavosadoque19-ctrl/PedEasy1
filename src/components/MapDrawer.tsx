import { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

interface MapDrawerProps {
  coordinates?: [number, number][];
  onChange: (coords: [number, number][]) => void;
  height?: number;
}

export default function MapDrawer({ coordinates, onChange, height = 350 }: MapDrawerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const drawnLayerRef = useRef<L.FeatureGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-23.5505, -46.6333],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnLayerRef.current = drawnItems;

    if (coordinates && coordinates.length > 0) {
      const polygon = L.polygon(coordinates as L.LatLngExpression[], { color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.2 });
      drawnItems.addLayer(polygon);
      map.fitBounds(polygon.getBounds().pad(0.1));
    }

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        polyline: false,
        rectangle: { shapeOptions: { color: '#2563eb' } },
        circle: false,
        circlemarker: false,
        marker: false,
      },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: L.LeafletEvent) => {
      const createdEvent = e as L.LeafletEvent & { layer: L.Layer };
      drawnItems.clearLayers();
      drawnItems.addLayer(createdEvent.layer);
      const poly = createdEvent.layer as L.Polygon;
      const coords = (poly.getLatLngs()[0] as L.LatLng[]).map((ll: L.LatLng) => [ll.lat, ll.lng] as [number, number]);
      onChange(coords);
    });

    map.on(L.Draw.Event.EDITED, () => {
      const layers: L.Layer[] = [];
      drawnItems.eachLayer((layer) => layers.push(layer));
      if (layers.length > 0) {
        const poly = layers[0] as L.Polygon;
        const coords = (poly.getLatLngs()[0] as L.LatLng[]).map((ll: L.LatLng) => [ll.lat, ll.lng] as [number, number]);
        onChange(coords);
      }
    });

    map.on(L.Draw.Event.DELETED, () => {
      onChange([]);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        Desenhe a região no mapa (polígono)
      </Typography>
      <Box ref={containerRef} sx={{ height, width: '100%', borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'divider' }} />
    </Box>
  );
}