// Barangay GeoJSON data structure
export interface BarangayFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    adm1_psgc: number;
    adm2_psgc: number;
    adm3_psgc: number;
    adm4_psgc: number;
    adm4_en: string;
    geo_level: 'Bgy';
    len_crs: number;
    area_crs: number;
    len_km: number;
    area_km2: number;
  };
  id: number;
}

export interface BarangayGeoJsonData {
  type: 'FeatureCollection';
  features: BarangayFeature[];
}

// Import all barangay GeoJSON data files
import bagangaBarangayJson from '../assets/map/municities/banganga-1102501000.json';
import banaybanayBarangayJson from '../assets/map/municities/banaybanay-1102502000.json';
import bostonBarangayJson from '../assets/map/municities/boston-1102503000.json';
import caragaBarangayJson from '../assets/map/municities/caraga-1102504000.json';
import cateelBarangayJson from '../assets/map/municities/cateel-1102505000.json';
import govgenBarangayJson from '../assets/map/municities/govgen-1102506000.json';
import luponBarangayJson from '../assets/map/municities/lupon-1102507000.json';
import manayBarangayJson from '../assets/map/municities/manay-1102508000.0.1.json';
import matiBarangayJson from '../assets/map/municities/mati-1102509000.0.1.json';
import sanIsidroBarangayJson from '../assets/map/municities/sanIsidro-1102510000.0.1.json';
import tarragonaBarangayJson from '../assets/map/municities/tarragona-1102511000.0.1.json';

// Map municipality names to their barangay data
export const barangayDataByMunicipality: { [key: string]: BarangayGeoJsonData } = {
  'Baganga': bagangaBarangayJson as BarangayGeoJsonData,
  'Banaybanay': banaybanayBarangayJson as BarangayGeoJsonData,
  'Boston': bostonBarangayJson as BarangayGeoJsonData,
  'Caraga': caragaBarangayJson as BarangayGeoJsonData,
  'Cateel': cateelBarangayJson as BarangayGeoJsonData,
  'Governor Generoso': govgenBarangayJson as BarangayGeoJsonData,
  'Lupon': luponBarangayJson as BarangayGeoJsonData,
  'Manay': manayBarangayJson as BarangayGeoJsonData,
  'City of Mati': matiBarangayJson as BarangayGeoJsonData,
  'Mati': matiBarangayJson as BarangayGeoJsonData, // Alias for Mati
  'San Isidro': sanIsidroBarangayJson as BarangayGeoJsonData,
  'Tarragona': tarragonaBarangayJson as BarangayGeoJsonData,
};

// Legacy export for backward compatibility
export const matiBarangayData = matiBarangayJson as BarangayGeoJsonData;

// Helper function to get barangay data for a municipality
export const getBarangayDataForMunicipality = (municipalityName: string): BarangayGeoJsonData | null => {
  return barangayDataByMunicipality[municipalityName] || null;
};

// Helper interface for barangay with map data
export interface Barangay {
  id: number;
  name: string;
  municipality: string;
  municipalityId: number;
  area: number;
  coordinates: number[][][] | number[][][][];
  center: {
    latitude: number;
    longitude: number;
  };
}

// Helper function to get all barangays from a municipality's GeoJSON
export const getBarangaysForMunicipality = (municipalityName: string): Barangay[] => {
  const barangayData = getBarangayDataForMunicipality(municipalityName);
  if (!barangayData) return [];
  
  return barangayData.features.map(feature => ({
    id: feature.id,
    name: feature.properties.adm4_en,
    municipality: municipalityName,
    municipalityId: feature.properties.adm3_psgc,
    area: feature.properties.area_km2,
    coordinates: feature.geometry.coordinates as number[][][] | number[][][][],
    center: calculateCenter(feature.geometry.coordinates as number[][][] | number[][][][])
  }));
};

// Legacy function for backward compatibility (returns Mati barangays)
export const getBarangays = (): Barangay[] => {
  return getBarangaysForMunicipality('City of Mati');
};

// Helper function to calculate center point
const calculateCenter = (coordinates: number[][][] | number[][][][]): { latitude: number; longitude: number } => {
  if (!coordinates || coordinates.length === 0) return { latitude: 0, longitude: 0 };
  
  let polygon: number[][];
  
  // Handle MultiPolygon
  if (Array.isArray(coordinates[0]?.[0]?.[0])) {
    const multiPolygon = coordinates as number[][][][];
    polygon = multiPolygon[0]?.[0] || [];
  } else {
    // Handle Polygon
    polygon = (coordinates as number[][][])[0] || [];
  }
  
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
