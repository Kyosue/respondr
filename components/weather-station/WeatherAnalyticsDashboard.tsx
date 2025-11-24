import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { HistoricalDataPoint } from './HistoricalDataView';
import { WeatherData } from './WeatherMetrics';

interface WeatherAnalyticsDashboardProps {
  currentData: WeatherData | null;
  historicalData: HistoricalDataPoint[];
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
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

  const filteredData = filterDataByRange(selectedRange);

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
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => {
          // Dismiss tooltip when tapping outside chart points
          if (hoveredPoint) {
            setHoveredPoint(null);
          }
        }}
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
                        r={isMobile ? 14 : 12}
                        fill="transparent"
                        onPress={() => {
                          // Toggle tooltip on press
                          if (isHovered) {
                            setHoveredPoint(null);
                          } else {
                            setHoveredPoint(pointData);
                          }
                        }}
                        onPressIn={() => {
                          setHoveredPoint(pointData);
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

        {/* Tooltip with smooth animations */}
        {hoveredPoint && (
          <Animated.View
            style={[
              styles.tooltip,
              {
                left: Math.min(
                  Math.max(hoveredPoint.x - 90, 10),
                  chartWidth - 190
                ),
                top: hoveredPoint.y < chartHeight / 2 
                  ? hoveredPoint.y + 20 
                  : Math.max(hoveredPoint.y - 90, 10),
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.text,
                opacity: tooltipOpacity,
                transform: [{ scale: tooltipScale }],
              },
            ]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={() => setHoveredPoint(null)}
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
              <View style={[styles.tooltipDot, { backgroundColor: hoveredPoint.metricColor }]} />
              <ThemedText style={[styles.tooltipMetricName, { color: colors.text }]}>
                {hoveredPoint.metricName}
              </ThemedText>
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
          <ThemedText style={[styles.chartTitle, { color: colors.text }]}>
            Trend Analysis
          </ThemedText>
          <ThemedText style={[styles.chartSubtitle, { color: colors.text, opacity: 0.6 }]}>
            {selectedRange} view
          </ThemedText>
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
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <ExpoLinearGradient
                colors={metric.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardGradient}
              >
                <View style={styles.statCardHeader}>
                  <View style={[styles.statIcon, { backgroundColor: `${metric.color}20` }]}>
                    <Ionicons name={metric.icon as any} size={18} color={metric.color} />
                  </View>
                  <View style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>{metric.label}</ThemedText>
                    <View style={styles.statTrend}>
                      {metric.stats.trend === 'up' && (
                        <Ionicons name="trending-up" size={12} color="#FFFFFF" />
                      )}
                      {metric.stats.trend === 'down' && (
                        <Ionicons name="trending-down" size={12} color="#FFFFFF" />
                      )}
                      {metric.stats.trend === 'stable' && (
                        <Ionicons name="remove" size={12} color="#FFFFFF" style={{ opacity: 0.7 }} />
                      )}
                      <ThemedText style={styles.statTrendText}>
                        {metric.stats.percent.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <View style={styles.statValueRow}>
                  <ThemedText style={styles.statCurrentValue}>
                    {formatValue(metric.stats.current)}
                  </ThemedText>
                  <ThemedText style={styles.statUnit}>{metric.unit}</ThemedText>
                </View>
                <View style={styles.statRangeRow}>
                  <View style={styles.statRangeItem}>
                    <ThemedText style={styles.statRangeLabel}>Avg</ThemedText>
                    <ThemedText style={styles.statRangeValue}>
                      {formatValue(metric.stats.avg)}
                    </ThemedText>
                  </View>
                  <View style={styles.statRangeItem}>
                    <ThemedText style={styles.statRangeLabel}>Min</ThemedText>
                    <ThemedText style={styles.statRangeValue}>
                      {formatValue(metric.stats.min)}
                    </ThemedText>
                  </View>
                  <View style={styles.statRangeItem}>
                    <ThemedText style={styles.statRangeLabel}>Max</ThemedText>
                    <ThemedText style={styles.statRangeValue}>
                      {formatValue(metric.stats.max)}
                    </ThemedText>
                  </View>
                </View>
              </ExpoLinearGradient>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Gabarito',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  dataCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dataCountText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  filterScroll: {
    marginTop: 4,
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    width: '100%',
    ...Platform.select({
      web: {
        padding: 20,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        maxWidth: '100%',
      },
      default: {
        padding: 12,
      },
    }),
  },
  chartHeader: {
    paddingHorizontal: 4,
    ...Platform.select({
      web: {
        marginBottom: 18,
      },
      default: {
        marginBottom: 12,
      },
    }),
  },
  chartTitle: {
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Gabarito',
    ...Platform.select({
      web: {
        fontSize: 18,
        lineHeight: 26,
      },
      default: {
        fontSize: 16,
        lineHeight: 22,
      },
    }),
  },
  chartSubtitle: {
    fontFamily: 'Gabarito',
    opacity: 0.7,
    ...Platform.select({
      web: {
        fontSize: 13,
        lineHeight: 18,
      },
      default: {
        fontSize: 12,
        lineHeight: 16,
      },
    }),
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    paddingVertical: 12,
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: '100%',
      },
    }),
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1000,
    ...Platform.select({
      web: {
        minWidth: 180,
        maxWidth: 220,
        padding: 12,
      },
      default: {
        minWidth: 160,
        maxWidth: 200,
        padding: 10,
      },
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      },
    }),
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  tooltipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tooltipMetricName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  tooltipContent: {
    gap: 4,
  },
  tooltipValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 24,
  },
  tooltipTime: {
    fontSize: 12,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsGridMobile: {
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  statCardMobile: {
    width: '48%',
    minWidth: '48%',
    flex: 0,
  },
  statCardGradient: {
    padding: 14,
    minHeight: 140,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTrendText: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'Gabarito',
    lineHeight: 14,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 12,
  },
  statCurrentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
    lineHeight: 30,
  },
  statUnit: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'Gabarito',
    lineHeight: 18,
  },
  statRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statRangeItem: {
    alignItems: 'center',
    flex: 1,
  },
  statRangeLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 2,
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  statRangeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
});

