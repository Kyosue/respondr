import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { davaoOrientalBorderGeoJson, DAVAO_ORIENTAL_MAX_BOUNDS } from '@/data/davaoOrientalBorderGeoJson';
import { DAVAO_ORIENTAL_CENTER, DAVAO_ORIENTAL_DEFAULT_ZOOM, getMunicipalities } from '@/data/davaoOrientalData';
import type { Municipality } from '@/data/davaoOrientalData';

// Match custom map: selected = blue; with operations = amber; base = teal
const STYLE_BASE = { color: '#1e4a6b', weight: 2, opacity: 0.9, fillColor: '#1a3a5c', fillOpacity: 0.35 };
const STYLE_OPERATIONS = { color: '#FBBF24', weight: 2, opacity: 0.9, fillColor: '#F59E0B', fillOpacity: 0.5 };
const STYLE_SELECTED = { color: '#3B82F6', weight: 3, opacity: 1, fillColor: '#60A5FA', fillOpacity: 0.5 };

export interface LeafletMapProps {
  width: number;
  height: number;
  center?: [number, number];
  zoom?: number;
  onMunicipalityPress?: (municipality: Municipality) => void;
  selectedMunicipality?: Municipality | null;
  operationsByMunicipality?: Record<string, any[]>;
}

export function LeafletMap({
  width,
  height,
  center = DAVAO_ORIENTAL_CENTER,
  zoom = DAVAO_ORIENTAL_DEFAULT_ZOOM,
  onMunicipalityPress,
  selectedMunicipality,
  operationsByMunicipality = {},
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const geoJsonLayerRef = useRef<import('leaflet').GeoJSON | null>(null);
  const onMunicipalityPressRef = useRef(onMunicipalityPress);
  onMunicipalityPressRef.current = onMunicipalityPress;

  const getStyleForFeatureId = useCallback((featureId: number) => {
    const isSelected = selectedMunicipality?.id === featureId;
    const ops = operationsByMunicipality[String(featureId)] ?? [];
    const hasOps = ops.length > 0;
    if (isSelected) return STYLE_SELECTED;
    if (hasOps) return STYLE_OPERATIONS;
    return STYLE_BASE;
  }, [selectedMunicipality?.id, operationsByMunicipality]);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const L = require('leaflet') as typeof import('leaflet');
    const municipalities = getMunicipalities();

    const [[south, west], [north, east]] = DAVAO_ORIENTAL_MAX_BOUNDS;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      maxBounds: L.latLngBounds(L.latLng(south, west), L.latLng(north, east)),
      maxBoundsViscosity: 1,
      minZoom: 7,
      maxZoom: 16,
    }).setView(center, zoom);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const geoJsonLayer = L.geoJSON(davaoOrientalBorderGeoJson as any, {
      style: (feature: any) => getStyleForFeatureId(Number(feature?.id ?? 0)),
      onEachFeature: (feature: any, layer: import('leaflet').Layer) => {
        const fid = feature?.id != null ? Number(feature.id) : undefined;
        (layer as any).on('click', () => {
          if (fid != null) {
            const m = municipalities.find((mu) => mu.id === fid);
            if (m && onMunicipalityPressRef.current) onMunicipalityPressRef.current(m);
          }
        });
        (layer as any).on('add', function (this: any) {
          const el = this.getElement?.();
          if (el) el.style.cursor = 'pointer';
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;
    mapRef.current = map;
    return () => {
      geoJsonLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = geoJsonLayerRef.current;
    if (!layer) return;
    layer.eachLayer((lyr: any) => {
      const fid = lyr.feature?.id;
      if (fid != null) lyr.setStyle(getStyleForFeatureId(Number(fid)));
    });
  }, [getStyleForFeatureId]);

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
