import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { HistoricalDataPoint } from './HistoricalDataView';
import { styles } from './WeatherAnalyticsDashboard.styles';
import { WeatherData } from './WeatherMetrics';

interface WeatherAnalyticsDashboardProps {
  currentData: WeatherData | null;
  historicalData: HistoricalDataPoint[];
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
type TimeInterval = '10m' | '1h' | '6h' | '1d' | '7d';
type MetricFilter = 'all' | 'temperature' | 'humidity' | 'rainfall' | 'windSpeed';

export function WeatherAnalyticsDashboard({
  currentData,
  historicalData,
}: WeatherAnalyticsDashboardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const { width } = Dimensions.get('window');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('24h');
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('10m');
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('all');
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    value: number;
    timestamp: Date;
    metricName: string;
    metricColor: string;
  } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const chartContainerRef = useRef<View>(null);
  
  // Animation values for smooth transitions
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipScale = useRef(new Animated.Value(0.8)).current;
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Animate tooltip appearance/disappearance
  useEffect(() => {
    if (hoveredPoint) {
      Animated.parallel([
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(tooltipScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(tooltipScale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hoveredPoint, tooltipOpacity, tooltipScale]);
  
  // Debounced hover handler for smoother experience
  const handlePointHover = useCallback((point: {
    x: number;
    y: number;
    value: number;
    timestamp: Date;
    metricName: string;
    metricColor: string;
  }) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Immediate update for better responsiveness
    setHoveredPoint(point);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Responsive chart dimensions with better spacing
  const chartPadding = isMobile ? 16 : 24;
  // On desktop, use container width minus padding, on mobile use screen width
  const chartWidth = isMobile 
    ? Math.min(width - 48, 600) 
    : containerWidth > 0 
      ? containerWidth - (chartPadding * 2) 
      : width - 64; // Fallback until measured
  const chartHeight = isMobile ? 200 : 260;
  const chartMargin = { top: 20, right: 20, bottom: 30, left: 20 };
  
  // Measure container width on desktop
  const handleContainerLayout = (event: any) => {
    if (!isMobile && event?.nativeEvent?.layout?.width) {
      setContainerWidth(event.nativeEvent.layout.width);
    }
  };

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  // Get available intervals based on selected time range
  const getAvailableIntervals = (range: TimeRange): { value: TimeInterval; label: string }[] => {
    switch (range) {
      case '1h':
        // No interval buttons for 1 hour (10 minutes is default)
        return [];
      case '6h':
        return [
          { value: '10m', label: '10 Min' },
          { value: '1h', label: '1 Hour' },
        ];
      case '24h':
        return [
          { value: '10m', label: '10 Min' },
          { value: '1h', label: '1 Hour' },
          { value: '6h', label: '6 Hours' },
        ];
      case '7d':
        return [
          { value: '10m', label: '10 Min' },
          { value: '1h', label: '1 Hour' },
          { value: '6h', label: '6 Hours' },
          { value: '1d', label: '1 Day' },
        ];
      case '30d':
        return [
          { value: '10m', label: '10 Min' },
          { value: '1h', label: '1 Hour' },
          { value: '6h', label: '6 Hours' },
          { value: '1d', label: '1 Day' },
          { value: '7d', label: '7 Days' },
        ];
      default:
        return [];
    }
  };

  // Reset interval to default when time range changes
  useEffect(() => {
    setSelectedInterval('10m');
  }, [selectedRange]);

  const metricFilters: { value: MetricFilter; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'grid-outline' },
    { value: 'temperature', label: 'Temp', icon: 'thermometer-outline' },
    { value: 'humidity', label: 'Humidity', icon: 'water-outline' },
    { value: 'rainfall', label: 'Rain', icon: 'rainy-outline' },
    { value: 'windSpeed', label: 'Wind', icon: 'flag-outline' },
  ];

  // Filter data by time range
  const filterDataByRange = (range: TimeRange): HistoricalDataPoint[] => {
    const now = new Date();
    const cutoff = new Date();

    switch (range) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoff.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoff.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
    }

    return historicalData.filter(point => point.timestamp >= cutoff);
  };

  // Sample data by interval
  const sampleDataByInterval = (data: HistoricalDataPoint[], interval: TimeInterval): HistoricalDataPoint[] => {
    if (data.length === 0) return [];

    // Sort data by timestamp (oldest first for proper sampling)
    const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    let intervalMs: number;
    
    switch (interval) {
      case '10m':
        intervalMs = 10 * 60 * 1000; // 10 minutes
        break;
      case '1h':
        intervalMs = 60 * 60 * 1000; // 1 hour
        break;
      case '6h':
        intervalMs = 6 * 60 * 60 * 1000; // 6 hours
        break;
      case '1d':
        intervalMs = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '7d':
        intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
    }

    const sampledData: HistoricalDataPoint[] = [];
    let lastSampledTime: number | null = null;

    // Iterate through sorted data and sample at specified intervals
    for (const point of sortedData) {
      const pointTime = point.timestamp.getTime();
      
      // If this is the first point or enough time has passed since last sample
      if (lastSampledTime === null || (pointTime - lastSampledTime) >= intervalMs) {
        sampledData.push(point);
        lastSampledTime = pointTime;
      }
    }

    // Return sampled data, sorted by newest first
    return sampledData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Filter by time range first, then sample by interval
  const rangeFilteredData = filterDataByRange(selectedRange);
  // On mobile, always use 10 minute interval. On desktop, use selected interval
  const intervalToUse = isMobile ? '10m' : (selectedRange === '1h' ? '10m' : selectedInterval);
  const filteredData = sampleDataByInterval(rangeFilteredData, intervalToUse);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (!currentData || filteredData.length === 0) return null;

    const tempValues = filteredData.map(d => d.temperature);
    const humidityValues = filteredData.map(d => d.humidity);
    const rainfallValues = filteredData.map(d => d.rainfall);
    const windValues = filteredData.map(d => d.windSpeed);

    const calculateTrend = (values: number[]): { trend: 'up' | 'down' | 'stable'; percent: number } => {
      if (values.length < 2) return { trend: 'stable', percent: 0 };

      const recentCount = Math.max(1, Math.floor(values.length * 0.1));
      const previousCount = Math.max(1, Math.floor(values.length * 0.1));

      const recentAvg = values.slice(-recentCount).reduce((sum, v) => sum + v, 0) / recentCount;
      const previousAvg = values.slice(-recentCount - previousCount, -recentCount).reduce((sum, v) => sum + v, 0) / previousCount;

      const percent = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
      const trend = Math.abs(percent) > 2 ? (percent > 0 ? 'up' : 'down') : 'stable';

      return { trend, percent: Math.abs(percent) };
    };

    return {
      temperature: {
        current: currentData.temperature,
        avg: tempValues.reduce((sum, v) => sum + v, 0) / tempValues.length,
        min: Math.min(...tempValues),
        max: Math.max(...tempValues),
        ...calculateTrend(tempValues),
      },
      humidity: {
        current: currentData.humidity,
        avg: humidityValues.reduce((sum, v) => sum + v, 0) / humidityValues.length,
        min: Math.min(...humidityValues),
        max: Math.max(...humidityValues),
        ...calculateTrend(humidityValues),
      },
      rainfall: {
        current: currentData.rainfall,
        avg: rainfallValues.reduce((sum, v) => sum + v, 0) / rainfallValues.length,
        min: Math.min(...rainfallValues),
        max: Math.max(...rainfallValues),
        total: rainfallValues.reduce((sum, v) => sum + v, 0),
        ...calculateTrend(rainfallValues),
      },
      windSpeed: {
        current: currentData.windSpeed,
        avg: windValues.reduce((sum, v) => sum + v, 0) / windValues.length,
        min: Math.min(...windValues),
        max: Math.max(...windValues),
        ...calculateTrend(windValues),
      },
    };
  }, [currentData, filteredData]);

  // Generate chart data points with proper margins
  const generateChartData = (metric: 'temperature' | 'humidity' | 'rainfall' | 'windSpeed') => {
    if (filteredData.length === 0) return [];

    const values = filteredData.map(d => d[metric]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    // Add padding to range for better visualization
    const paddedMin = min - (range * 0.1);
    const paddedMax = max + (range * 0.1);
    const paddedRange = paddedMax - paddedMin || 1;

    const plotWidth = chartWidth - chartMargin.left - chartMargin.right;
    const plotHeight = chartHeight - chartMargin.top - chartMargin.bottom;

    return values.map((value, index) => ({
      x: chartMargin.left + (index / (values.length - 1 || 1)) * plotWidth,
      y: chartMargin.top + plotHeight - ((value - paddedMin) / paddedRange) * plotHeight,
      value,
      timestamp: filteredData[index].timestamp,
      index,
    }));
  };

  const tempData = generateChartData('temperature');
  const humidityData = generateChartData('humidity');
  const rainfallData = generateChartData('rainfall');
  const windData = generateChartData('windSpeed');

  // Render multi-line chart
  const renderCombinedChart = () => {
    if (filteredData.length < 2) return null;

    const metrics = metricFilter === 'all'
      ? [
          { data: tempData, color: '#F44336', name: 'Temperature' },
          { data: humidityData, color: '#2196F3', name: 'Humidity' },
          { data: rainfallData, color: '#00BCD4', name: 'Rainfall' },
          { data: windData, color: '#4CAF50', name: 'Wind' },
        ]
      : metricFilter === 'temperature'
      ? [{ data: tempData, color: '#F44336', name: 'Temperature' }]
      : metricFilter === 'humidity'
      ? [{ data: humidityData, color: '#2196F3', name: 'Humidity' }]
      : metricFilter === 'rainfall'
      ? [{ data: rainfallData, color: '#00BCD4', name: 'Rainfall' }]
      : [{ data: windData, color: '#4CAF50', name: 'Wind' }];

    const formatTooltipTime = (date: Date): string => {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    };

    const formatTooltipValue = (value: number, metricName: string): string => {
      if (metricName === 'Temperature') return `${value.toFixed(1)}°C`;
      if (metricName === 'Humidity') return `${Math.round(value)}%`;
      if (metricName === 'Rainfall') return `${value.toFixed(2)} mm`;
      if (metricName === 'Wind') return `${value.toFixed(1)} km/h`;
      return value.toFixed(1);
    };

    return (
      <View 
        style={styles.chartContainer}
        {...(Platform.OS === 'web' && {
          onMouseLeave: () => {
            // Dismiss tooltip when mouse leaves chart area (with small delay)
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            hoverTimeoutRef.current = setTimeout(() => {
              setHoveredPoint(null);
            }, 150);
          },
        })}
      >
        <Svg 
          width={chartWidth} 
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={Platform.OS === 'web' ? { width: '100%', maxWidth: '100%' } : undefined}
        >
          {/* Background gradient area */}
          <Defs>
            <SvgLinearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.background} stopOpacity="0.05" />
              <Stop offset="1" stopColor={colors.background} stopOpacity="0" />
            </SvgLinearGradient>
            {/* Area gradients for each metric */}
            {metrics.map((metric, metricIndex) => (
              <SvgLinearGradient key={`areaGradient-${metricIndex}`} id={`areaGradient-${metricIndex}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={metric.color} stopOpacity="0.25" />
                <Stop offset="1" stopColor={metric.color} stopOpacity="0.05" />
              </SvgLinearGradient>
            ))}
          </Defs>
          
          {/* Grid background */}
          <Rect
            x={chartMargin.left}
            y={chartMargin.top}
            width={chartWidth - chartMargin.left - chartMargin.right}
            height={chartHeight - chartMargin.top - chartMargin.bottom}
            fill="url(#gridGradient)"
          />
          
          {/* Grid lines with better styling */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartMargin.top + (chartHeight - chartMargin.top - chartMargin.bottom) * (1 - ratio);
    return (
            <Line
              key={ratio}
                x1={chartMargin.left}
                y1={y}
                x2={chartWidth - chartMargin.right}
                y2={y}
                stroke={colors.border}
                strokeWidth={ratio === 0.5 ? 1 : 0.5}
                strokeDasharray={ratio === 0.5 ? "0" : "4,4"}
                opacity={ratio === 0.5 ? 0.4 : 0.2}
              />
            );
          })}
          
          {/* Vertical grid lines for better readability */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const x = chartMargin.left + (chartWidth - chartMargin.left - chartMargin.right) * ratio;
            return (
              <Line
                key={`v-${ratio}`}
                x1={x}
                y1={chartMargin.top}
                x2={x}
                y2={chartHeight - chartMargin.bottom}
              stroke={colors.border}
              strokeWidth={0.5}
                strokeDasharray="2,4"
                opacity={0.15}
            />
            );
          })}

          {/* Chart lines */}
          {metrics.map((metric, metricIndex) => {
            if (metric.data.length < 2) return null;

            const pathData = metric.data
              .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
              .join(' ');

            const plotBottom = chartHeight - chartMargin.bottom;
            const areaPath = `${pathData} L ${metric.data[metric.data.length - 1].x} ${plotBottom} L ${metric.data[0].x} ${plotBottom} Z`;

            return (
              <React.Fragment key={metricIndex}>
                <Path
                  d={areaPath}
                  fill={`url(#areaGradient-${metricIndex})`}
                />
                <Path
                  d={pathData}
                  stroke={metric.color}
                  strokeWidth={isMobile ? 2.5 : 3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {metric.data.map((point, index) => {
                  const isHovered = hoveredPoint?.x === point.x && 
                                   hoveredPoint?.y === point.y &&
                                   hoveredPoint?.metricName === metric.name;
                  
                  const pointData = {
                    x: point.x,
                    y: point.y,
                    value: point.value,
                    timestamp: point.timestamp,
                    metricName: metric.name,
                    metricColor: metric.color,
                  };
                  
                  return (
                    <G key={index}>
                      {/* Invisible larger circle for easier touch target */}
                      <Circle
                        cx={point.x}
                        cy={point.y}
                        r={isMobile ? 18 : 12} // Larger touch target on mobile
                        fill="transparent"
                        onPress={() => {
                          // On mobile, always show tooltip on tap
                          // On web, toggle tooltip
                          if (Platform.OS === 'web') {
                            if (isHovered) {
                              setHoveredPoint(null);
                            } else {
                              setHoveredPoint(pointData);
                            }
                          } else {
                            // Mobile: always show on tap
                            setHoveredPoint(pointData);
                          }
                        }}
                        onPressIn={() => {
                          // On mobile, show immediately on press for better responsiveness
                          if (Platform.OS !== 'web') {
                            setHoveredPoint(pointData);
                          }
                        }}
                        {...(Platform.OS === 'web' && {
                          onMouseEnter: () => {
                            handlePointHover(pointData);
                          },
                          onMouseLeave: () => {
                            // Only clear if not moving to another point
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current);
                            }
                          },
                        })}
                      />
                      {/* Visible circle with smooth size transition */}
                  <Circle
                    cx={point.x}
                    cy={point.y}
                        r={isHovered 
                          ? (isMobile ? 7 : 6.5) 
                          : (index === metric.data.length - 1 
                            ? (isMobile ? 5.5 : 5) 
                            : (isMobile ? 4 : 3.5))}
                    fill={metric.color}
                        opacity={isHovered ? 1 : (index === metric.data.length - 1 ? 1 : 0.7)}
                        stroke={isHovered ? '#FFFFFF' : 'none'}
                        strokeWidth={isHovered ? (isMobile ? 3 : 2.5) : 0}
                  />
                    </G>
                  );
                })}
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Mobile backdrop overlay to dismiss tooltip */}
        {hoveredPoint && Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.tooltipBackdrop}
            activeOpacity={1}
            onPress={() => setHoveredPoint(null)}
          />
        )}

        {/* Tooltip with smooth animations */}
        {hoveredPoint && (
          <Animated.View
            style={[
              styles.tooltip,
              {
                left: Math.min(
                  Math.max(hoveredPoint.x - (isMobile ? 80 : 90), 10),
                  chartWidth - (isMobile ? 170 : 190)
                ),
                top: hoveredPoint.y < chartHeight / 2 
                  ? hoveredPoint.y + (isMobile ? 15 : 20) 
                  : Math.max(hoveredPoint.y - (isMobile ? 80 : 90), 10),
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.text,
                opacity: tooltipOpacity,
                transform: [{ scale: tooltipScale }],
              },
            ]}
            {...(Platform.OS !== 'web' ? {
              onStartShouldSetResponder: () => true,
              // On mobile, prevent tooltip from being dismissed when tapping inside it
              onTouchStart: (e) => {
                e.stopPropagation();
              },
            } : {})}
            {...(Platform.OS === 'web' && {
              onMouseEnter: () => {
                // Keep tooltip visible when hovering over it
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
              },
              onMouseLeave: () => {
                // Small delay before hiding to allow moving to tooltip
                hoverTimeoutRef.current = setTimeout(() => {
                  setHoveredPoint(null);
                }, 80);
              },
            })}
          >
            <View style={[styles.tooltipHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.tooltipHeaderLeft}>
                <View style={[styles.tooltipDot, { backgroundColor: hoveredPoint.metricColor }]} />
                <ThemedText style={[styles.tooltipMetricName, { color: colors.text }]}>
                  {hoveredPoint.metricName}
                </ThemedText>
              </View>
              {Platform.OS !== 'web' && (
                <TouchableOpacity
                  onPress={() => setHoveredPoint(null)}
                  style={styles.tooltipCloseButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={16} color={colors.text} style={{ opacity: 0.6 }} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.tooltipContent}>
              <ThemedText style={[styles.tooltipValue, { color: hoveredPoint.metricColor }]}>
                {formatTooltipValue(hoveredPoint.value, hoveredPoint.metricName)}
              </ThemedText>
              <ThemedText style={[styles.tooltipTime, { color: colors.text, opacity: 0.7 }]}>
                {formatTooltipTime(hoveredPoint.timestamp)}
              </ThemedText>
            </View>
          </Animated.View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: metric.color }]} />
              <ThemedText style={[styles.legendText, { color: colors.text }]}>
                {metric.name}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (!currentData || historicalData.length === 0) {
    return null;
  }

  if (!overallStats) {
    return null;
  }

  const metrics = [
    {
      key: 'temperature',
      label: 'Temperature',
      icon: 'thermometer',
      unit: '°C',
      color: '#F44336',
      gradient: colorScheme === 'dark' ? ['#F44336', '#B91C1C'] : ['#F44336', '#DC2626'],
      stats: overallStats.temperature,
    },
    {
      key: 'humidity',
      label: 'Humidity',
      icon: 'water',
      unit: '%',
      color: '#2196F3',
      gradient: colorScheme === 'dark' ? ['#2196F3', '#1565C0'] : ['#2196F3', '#1976D2'],
      stats: overallStats.humidity,
    },
    {
      key: 'rainfall',
      label: 'Rainfall',
      icon: 'rainy',
      unit: 'mm',
      color: '#00BCD4',
      gradient: colorScheme === 'dark' ? ['#00BCD4', '#00838F'] : ['#00BCD4', '#0097A7'],
      stats: overallStats.rainfall,
    },
    {
      key: 'windSpeed',
      label: 'Wind Speed',
      icon: 'flag',
      unit: 'km/h',
      color: '#4CAF50',
      gradient: colorScheme === 'dark' ? ['#4CAF50', '#2E7D32'] : ['#4CAF50', '#388E3C'],
      stats: overallStats.windSpeed,
    },
  ];

  const filteredMetrics = metricFilter === 'all' 
    ? metrics 
    : metrics.filter(m => m.key === metricFilter);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Analytics Dashboard
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
            Overall trends and insights
          </ThemedText>
        </View>
        <View style={[styles.dataCountBadge, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="stats-chart" size={14} color={colors.primary} />
          <ThemedText style={[styles.dataCountText, { color: colors.primary }]}>
            {filteredData.length} points
          </ThemedText>
        </View>
      </View>

      {/* Time Range Filter */}
      <View style={styles.filterSection}>
        <View style={styles.filterLabelContainer}>
          <Ionicons name="time-outline" size={16} color={colors.text} style={{ opacity: 0.7 }} />
          <ThemedText style={[styles.filterLabel, { color: colors.text, opacity: 0.7 }]}>
            Time Range
          </ThemedText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.value}
              onPress={() => setSelectedRange(range.value)}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    selectedRange === range.value
                      ? colors.primary
                      : `${colors.primary}15`,
                  borderColor: colors.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterButtonText,
                  {
                    color: selectedRange === range.value ? '#FFFFFF' : colors.primary,
                  },
                ]}
              >
                {range.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Metric Filter */}
      <View style={styles.filterSection}>
        <View style={styles.filterLabelContainer}>
          <Ionicons name="filter-outline" size={16} color={colors.text} style={{ opacity: 0.7 }} />
          <ThemedText style={[styles.filterLabel, { color: colors.text, opacity: 0.7 }]}>
            Metrics
          </ThemedText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {metricFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => setMetricFilter(filter.value)}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    metricFilter === filter.value
                      ? colors.primary
                      : `${colors.primary}15`,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={filter.icon as any}
                size={14}
                color={metricFilter === filter.value ? '#FFFFFF' : colors.primary}
              />
              <ThemedText
                style={[
                  styles.filterButtonText,
                  {
                    color: metricFilter === filter.value ? '#FFFFFF' : colors.primary,
                  },
                ]}
              >
                {filter.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Combined Chart */}
      <View 
        ref={chartContainerRef}
        style={[styles.chartCard, { backgroundColor: colors.background, borderColor: colors.border }]}
        onLayout={handleContainerLayout}
      >
        <View style={styles.chartHeader}>
          <View style={styles.chartHeaderLeft}>
            <ThemedText style={[styles.chartTitle, { color: colors.text }]}>
              Trend Analysis
            </ThemedText>
            <ThemedText style={[styles.chartSubtitle, { color: colors.text, opacity: 0.6 }]}>
              {selectedRange} view
            </ThemedText>
          </View>
          
          {/* Interval Selector - Upper Right (Desktop only) */}
          {!isMobile && getAvailableIntervals(selectedRange).length > 0 && (
            <View style={styles.intervalSelector}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.intervalScroll}
                contentContainerStyle={styles.intervalScrollContent}
              >
                {getAvailableIntervals(selectedRange).map((interval) => (
                  <TouchableOpacity
                    key={interval.value}
                    onPress={() => setSelectedInterval(interval.value)}
                    style={[
                      styles.filterButton,
                      styles.intervalButton,
                      {
                        backgroundColor:
                          selectedInterval === interval.value
                            ? colors.primary
                            : `${colors.primary}15`,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.filterButtonText,
                        styles.intervalButtonText,
                        {
                          color: selectedInterval === interval.value ? '#FFFFFF' : colors.primary,
                        },
                      ]}
                    >
                      {interval.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        
        {renderCombinedChart()}
      </View>

      {/* Statistics Grid */}
      <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
        {filteredMetrics.map((metric) => {
          const formatValue = (value: number): string => {
            if (metric.key === 'temperature') return `${value.toFixed(1)}`;
            if (metric.key === 'humidity') return `${Math.round(value)}`;
            return `${value.toFixed(1)}`;
          };

          return (
            <View
              key={metric.key}
              style={[
                styles.statCard,
                isMobile && styles.statCardMobile,
                { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  borderLeftColor: metric.color,
                },
              ]}
            >
              {/* Compact Header Row */}
                <View style={styles.statCardHeader}>
                <View style={styles.statHeaderLeft}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${metric.color}12` }]}>
                    <Ionicons name={metric.icon as any} size={16} color={metric.color} />
                  </View>
                  <View style={styles.statCardTitleContainer}>
                    <ThemedText style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>
                      {metric.label}
                    </ThemedText>
                  </View>
                  </View>
                    <View style={styles.statTrend}>
                      {metric.stats.trend === 'up' && (
                    <Ionicons name="trending-up" size={12} color={metric.color} />
                      )}
                      {metric.stats.trend === 'down' && (
                    <Ionicons name="trending-down" size={12} color={metric.color} />
                      )}
                      {metric.stats.trend === 'stable' && (
                    <Ionicons name="remove" size={12} color={colors.text} style={{ opacity: 0.4 }} />
                      )}
                  <ThemedText style={[styles.statTrendText, { color: colors.text, opacity: 0.6 }]}>
                        {metric.stats.percent.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>

              {/* Current Value Row */}
              <View style={styles.statCurrentSection}>
                <View style={styles.statCurrentValueContainer}>
                  <ThemedText style={[styles.statCurrentValue, { color: metric.color }]}>
                    {formatValue(metric.stats.current)}
                  </ThemedText>
                  <ThemedText style={[styles.statUnit, { color: colors.text, opacity: 0.5 }]}>
                    {metric.unit}
                  </ThemedText>
                </View>
                </View>

              {/* Compact Stats Row */}
              <View style={[styles.statRangeRow, { borderTopColor: colors.border }]}>
                  <View style={styles.statRangeItem}>
                  <ThemedText style={[styles.statRangeLabel, { color: colors.text, opacity: 0.5 }]}>
                    Avg
                  </ThemedText>
                  <ThemedText style={[styles.statRangeValue, { color: colors.text }]}>
                      {formatValue(metric.stats.avg)}
                    </ThemedText>
                  </View>
                <View style={[styles.statRangeDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statRangeItem}>
                  <ThemedText style={[styles.statRangeLabel, { color: colors.text, opacity: 0.5 }]}>
                    Min
                  </ThemedText>
                  <ThemedText style={[styles.statRangeValue, { color: colors.text }]}>
                      {formatValue(metric.stats.min)}
                    </ThemedText>
                  </View>
                <View style={[styles.statRangeDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statRangeItem}>
                  <ThemedText style={[styles.statRangeLabel, { color: colors.text, opacity: 0.5 }]}>
                    Max
                  </ThemedText>
                  <ThemedText style={[styles.statRangeValue, { color: colors.text }]}>
                      {formatValue(metric.stats.max)}
                    </ThemedText>
                  </View>
                </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}


