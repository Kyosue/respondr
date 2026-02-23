/**
 * GeoJSON for Davao Oriental province border (polygon overlay on map).
 * Uses high-resolution boundary from assets/map/davao-oriental-hires.json.
 */
import davaoOrientalBorder from '../assets/map/davao-oriental-hires.json';

export const davaoOrientalBorderGeoJson = davaoOrientalBorder as GeoJSON.FeatureCollection;

type Coord = number[] | number[][] | number[][][];

function extractLngLat(coord: Coord, lngs: number[], lats: number[]): void {
  if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
    lngs.push(coord[0]);
    lats.push(coord[1]);
    return;
  }
  for (let i = 0; i < coord.length; i++) {
    extractLngLat((coord as number[][])[i], lngs, lats);
  }
}

/**
 * Bounds for Davao Oriental: [[south, west], [north, east]] in lat/lng for Leaflet maxBounds.
 * Keeps map exploration within the province.
 */
export function getDavaoOrientalBounds(): [[number, number], [number, number]] {
  const lngs: number[] = [];
  const lats: number[] = [];
  const fc = davaoOrientalBorderGeoJson;
  if (fc.features) {
    for (const f of fc.features) {
      if (f.geometry?.coordinates) {
        extractLngLat(f.geometry.coordinates as Coord, lngs, lats);
      }
    }
  }
  if (lngs.length === 0 || lats.length === 0) {
    return [[6.2, 125.9], [8.1, 126.7]];
  }
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const pad = 0.02;
  return [
    [minLat - pad, minLng - pad],
    [maxLat + pad, maxLng + pad],
  ];
}

export const DAVAO_ORIENTAL_MAX_BOUNDS = getDavaoOrientalBounds();
