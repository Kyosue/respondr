import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

// Davao Oriental approximate center
const DEFAULT_CENTER: [number, number] = [7.0731, 126.4358];
const DEFAULT_ZOOM = 9;

export interface LeafletMapProps {
  width: number;
  height: number;
  center?: [number, number];
  zoom?: number;
}

export function LeafletMap({
  width,
  height,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const L = require('leaflet') as typeof import('leaflet');

    const map = L.map(containerRef.current, {
      zoomControl: false,
    }).setView(center, zoom);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, [width, height]);

  if (typeof document === 'undefined') {
    return <View style={{ width, height, backgroundColor: '#1a3a5c' }} />;
  }

  return (
    <View style={{ width, height }}>
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        style={{ width: '100%', height: '100%', minHeight: height }}
      />
    </View>
  );
}
