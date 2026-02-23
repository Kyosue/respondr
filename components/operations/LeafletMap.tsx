import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { davaoOrientalBorderGeoJson, DAVAO_ORIENTAL_MAX_BOUNDS } from '@/data/davaoOrientalBorderGeoJson';
import { DAVAO_ORIENTAL_CENTER, DAVAO_ORIENTAL_DEFAULT_ZOOM, getMunicipalities } from '@/data/davaoOrientalData';
import type { Municipality } from '@/data/davaoOrientalData';

export interface LeafletMapProps {
  width: number;
  height: number;
  center?: [number, number];
  zoom?: number;
  onMunicipalityPress?: (municipality: Municipality) => void;
  selectedMunicipality?: Municipality | null;
  operationsByMunicipality?: Record<string, any[]>;
}

function escapeJsonForScript(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/<\/script>/gi, '<\\/script>');
}

const getLeafletHTML = (
  lat: number,
  lng: number,
  zoom: number,
  borderGeoJsonStr: string,
  bounds: [[number, number], [number, number]],
  operationsByMunicipalityStr: string,
  selectedMunicipalityId: number | null
): string => {
  const [[south, west], [north, east]] = bounds;
  const selectedId = selectedMunicipalityId === null ? 'null' : String(selectedMunicipalityId);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-control-zoom { border: none !important; }
    .leaflet-bar a { width: 36px !important; height: 36px !important; line-height: 36px !important; font-size: 22px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    var bounds = L.latLngBounds([${south}, ${west}], [${north}, ${east}]);
    var map = L.map('map', {
      zoomControl: false,
      maxBounds: bounds,
      maxBoundsViscosity: 1,
      minZoom: 7,
      maxZoom: 16
    }).setView([${lat}, ${lng}], ${zoom});
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    var borderGeoJson = JSON.parse('${borderGeoJsonStr}');
    var operationsByMunicipality = JSON.parse('${operationsByMunicipalityStr}');
    var selectedMunicipalityId = ${selectedId};
    var styleBase = { color: '#1e4a6b', weight: 2, opacity: 0.9, fillColor: '#1a3a5c', fillOpacity: 0.35 };
    var styleOps = { color: '#FBBF24', weight: 2, opacity: 0.9, fillColor: '#F59E0B', fillOpacity: 0.5 };
    var styleSelected = { color: '#3B82F6', weight: 3, opacity: 1, fillColor: '#60A5FA', fillOpacity: 0.5 };
    if (borderGeoJson && borderGeoJson.features && borderGeoJson.features.length) {
      L.geoJSON(borderGeoJson, {
        style: function(feature) {
          var id = feature && feature.id;
          if (id === selectedMunicipalityId) return styleSelected;
          if ((operationsByMunicipality[String(id)] || []).length > 0) return styleOps;
          return styleBase;
        },
        onEachFeature: function(feature, layer) {
          layer.on('click', function() {
            if (window.ReactNativeWebView && feature && feature.id != null) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'municipalityPress', id: feature.id }));
            }
          });
        }
      }).addTo(map);
    }
  </script>
</body>
</html>
`;
};

export function LeafletMap({
  width,
  height,
  center = DAVAO_ORIENTAL_CENTER,
  zoom = DAVAO_ORIENTAL_DEFAULT_ZOOM,
  onMunicipalityPress,
  selectedMunicipality,
  operationsByMunicipality = {},
}: LeafletMapProps) {
  const [lat, lng] = center;
  const html = useMemo(() => {
    const borderStr = escapeJsonForScript(JSON.stringify(davaoOrientalBorderGeoJson));
    const opsStr = escapeJsonForScript(JSON.stringify(operationsByMunicipality));
    return getLeafletHTML(lat, lng, zoom, borderStr, DAVAO_ORIENTAL_MAX_BOUNDS, opsStr, selectedMunicipality?.id ?? null);
  }, [lat, lng, zoom, selectedMunicipality?.id, operationsByMunicipality]);

  const handleMessage = useCallback((e: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'municipalityPress' && typeof msg.id === 'number' && onMunicipalityPress) {
        const m = getMunicipalities().find((mu) => mu.id === msg.id);
        if (m) onMunicipalityPress(m);
      }
    } catch (_) {}
  }, [onMunicipalityPress]);

  return (
    <View style={[styles.container, { width, height }]}>
      <WebView
        source={{ html }}
        onMessage={handleMessage}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback
        startInLoadingState
        scalesPageToFit={Platform.OS === 'android'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#1a3a5c',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
