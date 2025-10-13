export interface Municipality {
  id: number;
  name: string;
  type: 'Mun' | 'City';
  area: number;
  coordinates: number[][][];
  center: {
    latitude: number;
    longitude: number;
  };
}

export interface DavaoOrientalFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    adm1_psgc: number;
    adm2_psgc: number;
    adm3_psgc: number;
    adm3_en: string;
    geo_level: 'Mun' | 'City';
    len_crs: number;
    area_crs: number;
    len_km: number;
    area_km2: number;
  };
  id: number;
}

// Import the complete GeoJSON data
import davaoOrientalJson from '../assets/map/davao-oriental-medres.json';

export const davaoOrientalData = davaoOrientalJson;

// Helper function to get all municipalities
export const getMunicipalities = (): Municipality[] => {
  return davaoOrientalData.features.map(feature => ({
    id: feature.id,
    name: feature.properties.adm3_en,
    type: feature.properties.geo_level as 'Mun' | 'City',
    area: feature.properties.area_km2,
    coordinates: feature.geometry.coordinates as number[][][],
    center: calculateCenter(feature.geometry.coordinates as number[][][])
  }));
};

// Helper function to calculate center point
const calculateCenter = (coordinates: number[][][]): { latitude: number; longitude: number } => {
  if (!coordinates || coordinates.length === 0) return { latitude: 0, longitude: 0 };
  
  const polygon = coordinates[0];
  if (!polygon || polygon.length === 0) return { latitude: 0, longitude: 0 };
  
  let sumLat = 0;
  let sumLng = 0;
  
  polygon.forEach(([lng, lat]) => {
    sumLat += lat;
    sumLng += lng;
  });
  
  return {
    latitude: sumLat / polygon.length,
    longitude: sumLng / polygon.length
  };
};
