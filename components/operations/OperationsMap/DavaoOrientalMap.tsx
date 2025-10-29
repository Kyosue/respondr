import { Colors } from '@/constants/Colors';
import { davaoOrientalData, getMunicipalities, Municipality } from '@/data/davaoOrientalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import SvgPanZoom from 'react-native-svg-pan-zoom';

// Suppress componentWillMount warning for react-native-svg-pan-zoom
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.('componentWillMount') && args[0]?.includes?.('SvgPanZoom')) {
      return;
    }
    originalWarn(...args);
  };
}

// TypeScript declaration for missing children prop
declare module 'react-native-svg-pan-zoom' {
  interface Props {
    children?: React.ReactNode;
  }
}

// Type-safe wrapper component
const SvgPanZoomWithChildren = SvgPanZoom as React.ComponentType<any>;

// Enhanced TypeScript interfaces
interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface ProcessedFeature {
  id: string;
  pathData: string;
  center: { x: number; y: number };
  municipality: Municipality | undefined;
  isSelected: boolean;
  labelPosition: { x: number; y: number };
}

// Cache for processed features
const featureCache = new Map<string, ProcessedFeature>();

// Priority hierarchy and color mapping
const PRIORITY_HIERARCHY = {
  'critical': 4,
  'high': 3,
  'medium': 2,
  'low': 1
} as const;

// LGU-specific color variants based on #273c47 with consistent stroke
const LGU_COLORS = {
  'Baganga': {
    fill: '#273c47', // Base color
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'Banaybanay': {
    fill: '#2a4049', // Slightly lighter
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'Boston': {
    fill: '#31434b', // Lighter variant
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'Caraga': {
    fill: '#2d3e46', // Medium variant
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'Cateel': {
    fill: '#2f4048', // Medium-light variant
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'Governor Generoso': {
    fill: '#33454d', // Lighter variant
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'Lupon': {
    fill: '#2b3d45', // Medium-dark variant
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'Manay': {
    fill: '#2e3f47', // Medium variant
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'City of Mati': {
    fill: '#32444c', // Lighter variant
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'San Isidro': {
    fill: '#30424a', // Medium-light variant
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  },
  'Tarragona': {
    fill: '#2c3e46', // Medium-dark variant
    stroke: '#aa6f38' // Consistent stroke for all LGUs
  }
} as const;

const PRIORITY_COLORS = {
  'critical': {
    fill: '#DC2626', // Red-600
    stroke: '#EF4444' // Red-500
  },
  'high': {
    fill: '#EA580C', // Orange-600
    stroke: '#F97316' // Orange-500
  },
  'medium': {
    fill: '#D97706', // Amber-600
    stroke: '#F59E0B' // Amber-500
  },
  'low': {
    fill: '#059669', // Emerald-600
    stroke: '#10B981' // Emerald-500
  },
  'none': {
    fill: '#273c47', // Base color for no operations
    stroke: '#aa6f38' // Darker variant
  }
} as const;

type PriorityLevel = keyof typeof PRIORITY_HIERARCHY;

// Function to get the highest priority operation for a municipality
const getHighestPriorityOperation = (operations: any[]): PriorityLevel | 'none' => {
  if (!operations || operations.length === 0) {
    return 'none';
  }

  let highestPriority: PriorityLevel = 'low';
  let highestPriorityValue: number = PRIORITY_HIERARCHY.low;

  operations.forEach(operation => {
    if (operation.priority && PRIORITY_HIERARCHY[operation.priority as PriorityLevel]) {
      const priorityValue = PRIORITY_HIERARCHY[operation.priority as PriorityLevel];
      if (priorityValue > highestPriorityValue) {
        highestPriorityValue = priorityValue;
        highestPriority = operation.priority as PriorityLevel;
      }
    }
  });

  return highestPriority;
};

interface DavaoOrientalMapProps {
  width?: number;
  height?: number;
  onMunicipalityPress?: (municipality: Municipality) => void;
  selectedMunicipality?: Municipality | null;
  operationsByMunicipality?: Record<string, any[]>;
}

// Enhanced function to convert GeoJSON coordinates to SVG path with error handling
const coordinatesToPath = (coordinates: number[][][] | number[][][][]): string => {
  try {
    if (!coordinates || coordinates.length === 0) return '';
    
    // Handle both Polygon and MultiPolygon geometries
    if (Array.isArray(coordinates[0]?.[0]?.[0])) {
      // MultiPolygon - take the first polygon
      const multiPolygon = coordinates as number[][][][];
      const polygon = multiPolygon[0]?.[0];
      if (!polygon || polygon.length === 0) return '';
      
      // Use array join for better performance than string concatenation
      const pathCommands = polygon.map(([x, y], index) => 
        index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
      );
      return pathCommands.join(' ') + ' Z';
    } else {
      // Polygon
      const polygon = coordinates[0] as number[][];
      if (!polygon || polygon.length === 0) return '';
      
      // Use array join for better performance than string concatenation
      const pathCommands = polygon.map(([x, y], index) => 
        index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
      );
      return pathCommands.join(' ') + ' Z';
    }
  } catch (error) {
    console.warn('Error processing coordinates:', error);
    return '';
  }
};

// Enhanced function to calculate bounding box with error handling
const calculateOverallBounds = (features: any[]): Bounds => {
  try {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    features.forEach(feature => {
      if (!feature?.geometry?.coordinates) return;
      
      const coordinates = feature.geometry.coordinates;
      let coords: number[][];
      
      if (feature.geometry.type === 'MultiPolygon') {
        coords = coordinates[0]?.[0] || [];
      } else {
        coords = coordinates[0] || [];
      }
      
      coords.forEach(([x, y]) => {
        if (typeof x === 'number' && typeof y === 'number') {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      });
    });
    
    // Fallback bounds if no valid coordinates found
    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }
    
    return { minX, minY, maxX, maxY };
  } catch (error) {
    console.warn('Error calculating bounds:', error);
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }
};

// Enhanced function to scale coordinates with error handling
const scaleCoordinates = (
  coordinates: number[][][] | number[][][][], 
  bounds: Bounds, 
  width: number, 
  height: number, 
  padding: number = 30
): number[][] => {
  try {
    const scaleX = (width - padding * 2) / (bounds.maxX - bounds.minX);
    const scaleY = (height - padding * 2) / (bounds.maxY - bounds.minY);
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (width - (bounds.maxX - bounds.minX) * scale) / 2;
    const offsetY = (height - (bounds.maxY - bounds.minY) * scale) / 2;
    
    let coords: number[][];
    
    if (Array.isArray(coordinates[0]?.[0]?.[0])) {
      // MultiPolygon
      const multiPolygon = coordinates as number[][][][];
      coords = multiPolygon[0]?.[0] || [];
    } else {
      // Polygon
      coords = coordinates[0] as number[][];
    }
    
    return coords.map(([x, y]) => [
      (x - bounds.minX) * scale + offsetX,
      // Flip vertically: height - (scaled y)
      height - ((y - bounds.minY) * scale + offsetY)
    ]);
  } catch (error) {
    console.warn('Error scaling coordinates:', error);
    return [];
  }
};

// Enhanced function to calculate center point with error handling
const calculateCenter = (coordinates: number[][]): { x: number; y: number } => {
  try {
    if (!coordinates || coordinates.length === 0) {
      return { x: 0, y: 0 };
    }
    
    let sumX = 0, sumY = 0;
    let validPoints = 0;
    
    coordinates.forEach(([x, y]) => {
      if (typeof x === 'number' && typeof y === 'number') {
        sumX += x;
        sumY += y;
        validPoints++;
      }
    });
    
    return validPoints > 0 ? {
      x: sumX / validPoints,
      y: sumY / validPoints
    } : { x: 0, y: 0 };
  } catch (error) {
    console.warn('Error calculating center:', error);
    return { x: 0, y: 0 };
  }
};

// Enhanced function to get custom label positions with error handling
const getLabelPosition = (
  municipalityName: string, 
  center: { x: number; y: number }
): { x: number; y: number } => {
  try {
    const customPositions: { [key: string]: { x: number; y: number } } = {
      'Baganga': { x: center.x - 40, y: center.y + 10 }, 
      'Banaybanay': { x: center.x, y: center.y - 25 }, 
      'Boston': { x: center.x, y: center.y + 5 },
      'Caraga': { x: center.x - 35, y: center.y }, 
      'Cateel': { x: center.x - 20, y: center.y + 15 }, 
      'Governor Generoso': { x: center.x - 50, y: center.y - 20 }, 
      'Lupon': { x: center.x + 25, y: center.y - 50 }, 
      'Manay': { x: center.x - 10, y: center.y - 10}, 
      'City of Mati': { x: center.x, y: center.y - 90 }, // Alternative name
      'San Isidro': { x: center.x - 35, y: center.y + 5 }, 
      'Tarragona': { x: center.x -5, y: center.y - 5 }, 
    };
    
    return customPositions[municipalityName] || center;
  } catch (error) {
    console.warn('Error calculating label position:', error);
    return center;
  }
};

// Memoized individual municipality component for better performance
const MunicipalityFeature = memo<{
  feature: any;
  bounds: Bounds;
  width: number;
  height: number;
  municipality: Municipality | undefined;
  isSelected: boolean;
  colors: any;
  onPress: () => void;
  operationsByMunicipality?: Record<string, any[]>;
}>(({ feature, bounds, width, height, municipality, isSelected, colors, onPress, operationsByMunicipality }) => {
  const processedFeature = useMemo(() => {
    const cacheKey = `${feature.id}-${width}-${height}-${isSelected}`;
    
    if (featureCache.has(cacheKey)) {
      return featureCache.get(cacheKey)!;
    }
    
    const coordinates = feature.geometry.coordinates;
    const scaledCoords = scaleCoordinates(coordinates, bounds, width, height);
    const pathData = coordinatesToPath([scaledCoords]);
    const center = calculateCenter(scaledCoords);
    const labelPosition = getLabelPosition(feature.properties.adm3_en, center);
    
    const processed: ProcessedFeature = {
      id: feature.id,
      pathData,
      center,
      municipality,
      isSelected,
      labelPosition
    };
    
    featureCache.set(cacheKey, processed);
    return processed;
  }, [feature, bounds, width, height, municipality, isSelected]);

  // Get the highest priority operation for this municipality
  const municipalityOperations = municipality && operationsByMunicipality ? 
    operationsByMunicipality[municipality.id.toString()] || [] : [];
  const highestPriority = getHighestPriorityOperation(municipalityOperations);
  
  // Use LGU-specific colors for default state, priority colors for operations
  const priorityColors = highestPriority === 'none' && municipality ? 
    LGU_COLORS[municipality.name as keyof typeof LGU_COLORS] || LGU_COLORS['Baganga'] :
    PRIORITY_COLORS[highestPriority];
  
  return (
    <G key={feature.id}>
      <Path
        d={processedFeature.pathData}
        fill={isSelected ? 'white' : priorityColors.fill}
        fillOpacity={isSelected ? 0.5 : 1}
        stroke={isSelected ? colors.primary : priorityColors.stroke}
        strokeWidth={isSelected ? 2 : 1}
        strokeLinecap="round"
        strokeLinejoin="round"
        onPress={onPress}
      />
      {/* Invisible larger touch area for better tap accuracy */}
      <Path
        d={processedFeature.pathData}
        fill="transparent"
        stroke="transparent"
        strokeWidth="20"
        onPress={onPress}
      />
      <SvgText
        x={processedFeature.labelPosition.x}
        y={processedFeature.labelPosition.y}
        fontSize="10"
        fill={'white'}
        textAnchor="middle"
        fontWeight="800"
        fontFamily="Gabarito"
        onPress={onPress}
      >
        {feature.properties.adm3_en}
      </SvgText>
    </G>
  );
});

const DavaoOrientalMap = memo<DavaoOrientalMapProps>(({ 
  width = Dimensions.get('window').width - 32, 
  height = Dimensions.get('window').height - 200, // Better default height
  onMunicipalityPress,
  selectedMunicipality,
  operationsByMunicipality
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // State for zoom control
  const initialZoom = Platform.OS === 'web' ? 1.2 : 1; // Default zoom-in for web
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [resetKey, setResetKey] = useState(0);
  const [isReset, setIsReset] = useState(false);
  
  // Memoize expensive calculations
  const bounds = useMemo(() => calculateOverallBounds(davaoOrientalData.features), []);
  const municipalities = useMemo(() => getMunicipalities(), []);
  
  // Memoize municipality lookup map for O(1) access
  const municipalityMap = useMemo(() => {
    const map = new Map<string, Municipality>();
    municipalities.forEach(municipality => {
      map.set(String(municipality.id), municipality);
    });
    return map;
  }, [municipalities]);
  
  // Memoized handlers
  const handleMunicipalityPress = useCallback((municipality: Municipality) => {
    onMunicipalityPress?.(municipality);
  }, [onMunicipalityPress]);
  
  const handleZoom = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
    setIsReset(false); // Clear reset state when user zooms
  }, []);
  
  // Reset zoom function
  const resetZoom = useCallback(() => {
    setCurrentZoom(initialZoom);
    setIsReset(true);
    setResetKey(prev => prev + 1); // Force re-render to reset zoom
  }, [initialZoom]);
  
  // Clear cache when dimensions change
  useMemo(() => {
    featureCache.clear();
  }, [width, height]);
  
  return (
    <GestureHandlerRootView style={{ flex: 1 , backgroundColor: '#cec9bd'}}>
      <View 
        style={Platform.OS === 'web' 
          ? [styles.container, { width, height }, { userSelect: 'none' }]
          : [styles.container, { width, height }]
        }
      >
        <SvgPanZoomWithChildren
          key={resetKey}
          canvasWidth={width}
          canvasHeight={height}
          minScale={0.8}
          maxScale={3}
          initialZoom={initialZoom}
          onZoom={handleZoom}
          canvasStyle={styles.canvas}
          enablePan={true}
          enableZoom={true}
        >
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              <G>
                {davaoOrientalData.features.map((feature) => {
                  const municipality = municipalityMap.get(String(feature.id));
                  const isSelected = selectedMunicipality?.id === feature.id;
                  
                  return (
                    <MunicipalityFeature
                      key={feature.id}
                      feature={feature}
                      bounds={bounds}
                      width={width}
                      height={height}
                      municipality={municipality}
                      isSelected={isSelected}
                      colors={colors}
                      onPress={() => handleMunicipalityPress(municipality!)}
                      operationsByMunicipality={operationsByMunicipality}
                    />
                  );
                })}
              </G>
            </Svg>
        </SvgPanZoomWithChildren>
        
        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <View style={[styles.zoomButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Text style={[styles.zoomButtonText, { color: 'white' }]}>
              {isReset ? `${Math.round(initialZoom * 100)}%` : `${Math.round(currentZoom * 100)}%`}
            </Text>
          </View>
          <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.primary }]} onPress={resetZoom}>
            <Ionicons name="refresh" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
});

export { DavaoOrientalMap };

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#cec9bd',
    borderRadius: 12,
    position: 'relative',
  },
  canvas: {
    backgroundColor: 'transparent',
  },
  zoomControls: {
    position: 'absolute',
    top: 10,
    right: 40,
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  zoomButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
});


