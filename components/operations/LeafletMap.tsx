import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { DAVAO_ORIENTAL_CENTER, DAVAO_ORIENTAL_DEFAULT_ZOOM } from '@/data/davaoOrientalData';

export interface LeafletMapProps {
  width: number;
  height: number;
  center?: [number, number];
  zoom?: number;
}

const getLeafletHTML = (lat: number, lng: number, zoom: number): string => `
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
    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${zoom});
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
  </script>
</body>
</html>
`;

export function LeafletMap({
  width,
  height,
  center = DAVAO_ORIENTAL_CENTER,
  zoom = DAVAO_ORIENTAL_DEFAULT_ZOOM,
}: LeafletMapProps) {
  const [lat, lng] = center;
  const html = useMemo(() => getLeafletHTML(lat, lng, zoom), [lat, lng, zoom]);

  return (
    <View style={[styles.container, { width, height }]}>
      <WebView
        source={{ html }}
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
