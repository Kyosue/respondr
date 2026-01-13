import { Colors } from '@/constants/Colors';
import { Barangay, getBarangays, matiBarangayData } from '@/data/barangayGeoJsonData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Dimensions, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import SvgPanZoom from 'react-native-svg-pan-zoom';
import { styles } from './DavaoOrientalMap.styles';

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
  barangay: Barangay | undefined;
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

// Default color for barangays without operations
const DEFAULT_BARANGAY_COLORS = {
  fill: '#1b4a6b', // Deep blue-teal
  stroke: '#4a9bc8' // Teal accent
} as const;

const PRIORITY_COLORS = {
  'critical': {
    fill: '#EF4444', // Modern red
    stroke: '#F87171' // Light red accent
  },
  'high': {
    fill: '#F97316', // Modern orange
    stroke: '#FB923C' // Light orange accent
  },
  'medium': {
    fill: '#F59E0B', // Modern amber
    stroke: '#FBBF24' // Light amber accent
  },
  'low': {
    fill: '#10B981', // Modern emerald
    stroke: '#34D399' // Light emerald accent
  },
  'none': {
    fill: '#1e3a5f', // Modern base color
    stroke: '#4a90e2' // Modern accent
  }
} as const;

type PriorityLevel = keyof typeof PRIORITY_HIERARCHY;

// Function to check if barangay has operations
const hasOperations = (operations: any[]): boolean => {
  return operations && operations.length > 0;
};

interface BarangayMapProps {
  width?: number;
  height?: number;
  onBarangayPress?: (barangay: Barangay) => void;
  selectedBarangay?: Barangay | null;
  operationsByBarangay?: Record<string, any[]>;
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
  barangayName: string, 
  center: { x: number; y: number }
): { x: number; y: number } => {
  try {
    // For barangays, we'll use the center position by default
    // Can be customized per barangay if needed
    return center;
  } catch (error) {
    console.warn('Error calculating label position:', error);
    return center;
  }
};

// Memoized component for barangay paths only
const BarangayPath = memo<{
  feature: any;
  bounds: Bounds;
  width: number;
  height: number;
  barangay: Barangay | undefined;
  isSelected: boolean;
  colors: any;
  onPress: () => void;
  operationsByBarangay?: Record<string, any[]>;
  pathData: string;
  priorityColors: any;
}>(({ pathData, isSelected, colors, onPress, priorityColors }) => {
  return (
    <G>
      <Path
        d={pathData}
        fill={isSelected ? '#60A5FA' : priorityColors.fill}
        fillOpacity={isSelected ? 0.7 : 0.95}
        stroke={isSelected ? '#3B82F6' : priorityColors.stroke}
        strokeWidth={isSelected ? 3 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        onPress={onPress}
      />
      {/* Invisible larger touch area for better tap accuracy */}
      <Path
        d={pathData}
        fill="transparent"
        stroke="transparent"
        strokeWidth={20}
        onPress={onPress}
      />
    </G>
  );
});

// Memoized component for barangay labels only
const BarangayLabel = memo<{
  labelPosition: { x: number; y: number };
  labelText: string;
  onPress: () => void;
}>(({ labelPosition, labelText, onPress }) => {
  return (
    <G>
      {/* Text shadow for better readability */}
      <SvgText
        x={labelPosition.x + 0.5}
        y={labelPosition.y + 0.5}
        fontSize="9"
        fill="rgba(0, 0, 0, 0.4)"
        textAnchor="middle"
        fontWeight="700"
        fontFamily="Gabarito"
        onPress={onPress}
      >
        {labelText}
      </SvgText>
      {/* Main text */}
      <SvgText
        x={labelPosition.x}
        y={labelPosition.y}
        fontSize="9"
        fill="#FFFFFF"
        textAnchor="middle"
        fontWeight="700"
        fontFamily="Gabarito"
        onPress={onPress}
      >
        {labelText}
      </SvgText>
    </G>
  );
});

const BarangayMap = memo<BarangayMapProps>(({ 
  width: propWidth = Dimensions.get('window').width - 32, 
  height: propHeight = Dimensions.get('window').height - 200,
  onBarangayPress,
  selectedBarangay,
  operationsByBarangay
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Use actual container dimensions instead of props
  const [containerWidth, setContainerWidth] = useState(propWidth);
  const [containerHeight, setContainerHeight] = useState(propHeight);
  const width = containerWidth;
  const height = containerHeight;
  
  // State for zoom control
  const initialZoom = Platform.OS === 'web' ? 1.2 : 1;
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const [resetKey, setResetKey] = useState(0);
  const [isReset, setIsReset] = useState(false);
  
  // Handle container layout to get actual dimensions
  const handleLayout = useCallback((event: any) => {
    const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
    if (layoutWidth > 0 && layoutHeight > 0) {
      setContainerWidth(layoutWidth);
      setContainerHeight(layoutHeight);
    }
  }, []);
  
  // Animated values for pan/zoom (mobile only)
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  
  // Min and max scale constraints
  const minScale = 0.8;
  const maxScale = 3;
  
  // Memoize expensive calculations
  const bounds = useMemo(() => calculateOverallBounds(matiBarangayData.features), []);
  const barangays = useMemo(() => getBarangays(), []);
  
  // Memoize barangay lookup map for O(1) access
  const barangayMap = useMemo(() => {
    const map = new Map<string, Barangay>();
    barangays.forEach(barangay => {
      map.set(String(barangay.id), barangay);
    });
    return map;
  }, [barangays]);
  
  // Memoized handlers
  const handleBarangayPress = useCallback((barangay: Barangay) => {
    onBarangayPress?.(barangay);
  }, [onBarangayPress]);
  
  const handleZoom = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
    setIsReset(false);
  }, []);
  
  // Update currentZoom when scale changes (for mobile)
  const updateZoom = useCallback((newScale: number) => {
    setCurrentZoom(newScale);
    setIsReset(false);
  }, []);
  
  // Reset zoom function
  const resetZoom = useCallback(() => {
    if (Platform.OS === 'web') {
      setCurrentZoom(initialZoom);
      setIsReset(true);
      setResetKey(prev => prev + 1);
    } else {
      scale.value = withSpring(1);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      setCurrentZoom(1);
      setIsReset(true);
    }
  }, [initialZoom, scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY]);
  
  // Pinch gesture handler for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = Math.max(minScale, Math.min(maxScale, savedScale.value * e.scale));
      scale.value = newScale;
      runOnJS(updateZoom)(newScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < minScale) {
        scale.value = withSpring(minScale);
        savedScale.value = minScale;
        runOnJS(updateZoom)(minScale);
      } else if (scale.value > maxScale) {
        scale.value = withSpring(maxScale);
        savedScale.value = maxScale;
        runOnJS(updateZoom)(maxScale);
      }
      
      const scaledWidth = width * scale.value;
      const scaledHeight = height * scale.value;
      const maxTranslateX = Math.max(0, (scaledWidth - width) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - height) / 2);
      
      translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value));
      translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value));
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });
  
  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .minDistance(5)
    .minPointers(1)
    .shouldCancelWhenOutside(false)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      let newTranslateX = savedTranslateX.value + e.translationX;
      let newTranslateY = savedTranslateY.value + e.translationY;
      
      const scaledWidth = width * scale.value;
      const scaledHeight = height * scale.value;
      const maxTranslateX = Math.max(0, (scaledWidth - width) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - height) / 2);
      
      newTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
      newTranslateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
      
      translateX.value = newTranslateX;
      translateY.value = newTranslateY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });
  
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
  
  // Animated style for transforms
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });
  
  // Clear cache when dimensions change
  useMemo(() => {
    featureCache.clear();
  }, [width, height]);
  
  // Memoize processed features for all barangays
  const processedFeatures = useMemo(() => {
    return matiBarangayData.features.map((feature) => {
      const barangay = barangayMap.get(String(feature.id));
      const isSelected = selectedBarangay?.id === feature.id;
      const cacheKey = `${feature.id}-${width}-${height}-${isSelected}`;
      
      let processed: ProcessedFeature;
      if (featureCache.has(cacheKey)) {
        processed = featureCache.get(cacheKey)!;
      } else {
        const coordinates = feature.geometry.coordinates;
        const scaledCoords = scaleCoordinates(coordinates, bounds, width, height);
        const pathData = coordinatesToPath([scaledCoords]);
        const center = calculateCenter(scaledCoords);
        const labelPosition = getLabelPosition(feature.properties.adm4_en, center);
        
        processed = {
          id: String(feature.id),
          pathData,
          center,
          barangay,
          isSelected,
          labelPosition
        };
        
        featureCache.set(cacheKey, processed);
      }
      
      // Check if barangay has operations
      const barangayOperations = barangay && operationsByBarangay ? 
        operationsByBarangay[barangay.id.toString()] || [] : [];
      const hasOps = hasOperations(barangayOperations);
      
      // Use default colors for barangays without operations, priority color for those with operations
      const priorityColors = !hasOps ? 
        DEFAULT_BARANGAY_COLORS :
        PRIORITY_COLORS['medium'];
      
      return {
        feature,
        barangay,
        isSelected,
        processed,
        priorityColors
      };
    });
  }, [matiBarangayData.features, barangayMap, bounds, width, height, selectedBarangay, operationsByBarangay]);
  
  // Render SVG content
  const svgContent = (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Render all paths first */}
      <G>
        {processedFeatures.map(({ feature, barangay, isSelected, processed, priorityColors }) => (
          <BarangayPath
            key={`path-${feature.id}`}
            feature={feature}
            bounds={bounds}
            width={width}
            height={height}
            barangay={barangay}
            isSelected={isSelected}
            colors={colors}
            onPress={() => handleBarangayPress(barangay!)}
            operationsByBarangay={operationsByBarangay}
            pathData={processed.pathData}
            priorityColors={priorityColors}
          />
        ))}
      </G>
      {/* Render all labels in a separate group on top */}
      <G>
        {processedFeatures.map(({ feature, barangay, processed }) => (
          <BarangayLabel
            key={`label-${feature.id}`}
            labelPosition={processed.labelPosition}
            labelText={feature.properties.adm4_en}
            onPress={() => handleBarangayPress(barangay!)}
          />
        ))}
      </G>
    </Svg>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View 
        style={Platform.OS === 'web' 
          ? [styles.container, { userSelect: 'none' }]
          : styles.container
        }
        onLayout={handleLayout}
      >
        {Platform.OS === 'web' ? (
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
            {svgContent}
          </SvgPanZoomWithChildren>
        ) : (
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.canvas, animatedStyle]}>
              {svgContent}
            </Animated.View>
          </GestureDetector>
        )}
        
        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <View style={styles.zoomButton}>
            <Text style={styles.zoomButtonText}>
              {Platform.OS === 'web' 
                ? (isReset ? `${Math.round(initialZoom * 100)}%` : `${Math.round(currentZoom * 100)}%`)
                : (isReset ? '100%' : `${Math.round(currentZoom * 100)}%`)
              }
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetZoom}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
});

export { BarangayMap };
