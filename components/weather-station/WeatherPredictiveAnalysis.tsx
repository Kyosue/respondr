import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { HistoricalDataPoint } from './HistoricalDataView';
import { styles } from './WeatherPredictiveAnalysis.styles';

interface WeatherPredictiveAnalysisProps {
  historicalData: HistoricalDataPoint[];
  currentData?: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  } | null;
}

interface Prediction {
  timestamp: Date;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
}

interface RegressionModel {
  coefficients: number[];
  intercept: number;
  rSquared: number;
  featureMeans?: number[];
  featureStds?: number[];
}

type PredictionHorizon = '1h' | '6h' | '24h';

type MetricKey = 'temperature' | 'humidity' | 'rainfall' | 'windSpeed';

/**
 * Physical constraints for weather metrics
 */
const METRIC_CONSTRAINTS: Record<MetricKey, { min: number; max: number }> = {
  temperature: { min: -50, max: 60 },
  humidity: { min: 0, max: 100 },
  rainfall: { min: 0, max: 1000 },
  windSpeed: { min: 0, max: 200 },
};

/**
 * Utility functions for data validation and processing
 */
class DataUtils {
  /**
   * Clamp a value to a valid range, handling NaN and Infinity
   */
  static clampValue(value: number, min: number, max: number): number {
    if (!isFinite(value) || isNaN(value)) {
      return min;
    }
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Check if a value is valid (finite and not NaN)
   */
  static isValid(value: number): boolean {
    return isFinite(value) && !isNaN(value);
  }

  /**
   * Detect outliers using IQR (Interquartile Range) method
   */
  static detectOutliers(values: number[]): boolean[] {
    if (values.length < 4) {
      return values.map(() => false); // Not enough data for outlier detection
    }

    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values.map((val) => val < lowerBound || val > upperBound);
  }

  /**
   * Cap outliers to reasonable bounds instead of removing them
   */
  static capOutliers(values: number[], outliers: boolean[], median: number): number[] {
    return values.map((val, idx) => {
      if (outliers[idx]) {
        // Cap to median ± 3 * IQR
        const deviation = Math.abs(val - median);
        return val > median ? median + deviation * 0.5 : median - deviation * 0.5;
      }
      return val;
    });
  }

  /**
   * Calculate mean and standard deviation for normalization
   */
  static calculateStats(values: number[]): { mean: number; std: number } {
    const validValues = values.filter((v) => this.isValid(v));
    if (validValues.length === 0) {
      return { mean: 0, std: 1 };
    }

    const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
    const variance =
      validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length;
    const std = Math.sqrt(variance) || 1; // Avoid division by zero

    return { mean, std };
  }
}

/**
 * Multiple Linear Regression implementation using Ordinary Least Squares (OLS)
 * Enhanced with feature engineering, scaling, and outlier handling
 */
class MultipleLinearRegression {
  /**
   * Extract time-based features for better prediction
   * Returns: [hour_sin, hour_cos, dayOfWeek_sin, dayOfWeek_cos]
   */
  private static extractTimeFeatures(timestamp: Date): number[] {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();

    // Cyclical encoding using sin/cos for hour (0-23)
    const hourSin = Math.sin((2 * Math.PI * hour) / 24);
    const hourCos = Math.cos((2 * Math.PI * hour) / 24);

    // Cyclical encoding for day of week (0-6)
    const daySin = Math.sin((2 * Math.PI * dayOfWeek) / 7);
    const dayCos = Math.cos((2 * Math.PI * dayOfWeek) / 7);

    return [hourSin, hourCos, daySin, dayCos];
  }

  /**
   * Train a regression model to predict a target variable
   * Enhanced features: [time, hour_sin, hour_cos, day_sin, day_cos, temperature, humidity, rainfall, windSpeed]
   */
  static train(
    data: HistoricalDataPoint[],
    targetKey: MetricKey
  ): RegressionModel {
    if (data.length < 3) {
      // Not enough data for regression
      const lastValue = data.length > 0 ? data[data.length - 1][targetKey] : 0;
      return {
        coefficients: new Array(9).fill(0),
        intercept: DataUtils.isValid(lastValue) ? lastValue : 0,
        rSquared: 0,
        featureMeans: new Array(9).fill(0),
        featureStds: new Array(9).fill(1),
      };
    }

    // Sort data by timestamp
    const sortedData = [...data].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Prepare features and target with outlier handling
    const startTime = sortedData[0].timestamp.getTime();
    const rawFeatures: number[][] = [];
    const rawTargets: number[] = [];

    for (const point of sortedData) {
      const timeHours = (point.timestamp.getTime() - startTime) / (1000 * 60 * 60);
      const timeFeatures = this.extractTimeFeatures(point.timestamp);
      const targetValue = point[targetKey];

      // Validate all values
      if (
        DataUtils.isValid(timeHours) &&
        DataUtils.isValid(point.temperature) &&
        DataUtils.isValid(point.humidity) &&
        DataUtils.isValid(point.rainfall) &&
        DataUtils.isValid(point.windSpeed) &&
        DataUtils.isValid(targetValue)
      ) {
        rawFeatures.push([
          timeHours,
          ...timeFeatures,
          point.temperature,
          point.humidity,
          point.rainfall,
          point.windSpeed,
        ]);
        rawTargets.push(targetValue);
      }
    }

    if (rawFeatures.length < 3) {
      // Not enough valid data
      const lastValue = rawTargets.length > 0 ? rawTargets[rawTargets.length - 1] : 0;
      return {
        coefficients: new Array(9).fill(0),
        intercept: DataUtils.isValid(lastValue) ? lastValue : 0,
        rSquared: 0,
        featureMeans: new Array(9).fill(0),
        featureStds: new Array(9).fill(1),
      };
    }

    // Detect and cap outliers in target variable
    const targetOutliers = DataUtils.detectOutliers(rawTargets);
    const targetMedian = [...rawTargets].sort((a, b) => a - b)[Math.floor(rawTargets.length / 2)];
    const processedTargets = DataUtils.capOutliers(rawTargets, targetOutliers, targetMedian);

    const n = rawFeatures.length;
    const numFeatures = 9; // time + 4 time features + 4 weather metrics

    // Calculate feature statistics for normalization
    const featureMeans: number[] = [];
    const featureStds: number[] = [];

    for (let j = 0; j < numFeatures; j++) {
      const featureValues = rawFeatures.map((row) => row[j]);
      const stats = DataUtils.calculateStats(featureValues);
      featureMeans.push(stats.mean);
      featureStds.push(stats.std);
    }

    // Normalize features (Z-score normalization)
    const normalizedFeatures = rawFeatures.map((row) =>
      row.map((val, idx) => {
        const std = featureStds[idx] || 1;
        return std > 0 ? (val - featureMeans[idx]) / std : 0;
      })
    );

    // Normalize target
    const targetStats = DataUtils.calculateStats(processedTargets);
    const targetMean = targetStats.mean;
    const targetStd = targetStats.std || 1;
    const normalizedTargets = processedTargets.map((val) =>
      targetStd > 0 ? (val - targetMean) / targetStd : 0
    );

    // Calculate covariance matrix and solve for coefficients
    const XTX: number[][] = Array(numFeatures)
      .fill(0)
      .map(() => Array(numFeatures).fill(0));
    const XTy: number[] = Array(numFeatures).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < numFeatures; j++) {
        for (let k = 0; k < numFeatures; k++) {
          XTX[j][k] += normalizedFeatures[i][j] * normalizedFeatures[i][k];
        }
        XTy[j] += normalizedFeatures[i][j] * normalizedTargets[i];
      }
    }

    // Adaptive regularization based on data size and variance
    const regularization = Math.max(0.0001, 0.001 / Math.sqrt(n));
    for (let i = 0; i < numFeatures; i++) {
      XTX[i][i] += regularization;
    }

    // Solve for coefficients using Gaussian elimination
    let coefficients: number[];
    try {
      coefficients = this.solveLinearSystem(XTX, XTy);
    } catch (error) {
      // Fallback: return simple model if solving fails
      return {
        coefficients: new Array(numFeatures).fill(0),
        intercept: targetMean,
        rSquared: 0,
        featureMeans,
        featureStds,
      };
    }

    // Denormalize intercept (coefficients are already in normalized space)
    const intercept = targetMean - coefficients.reduce((sum, coef, idx) => {
      // Denormalize: coef_norm * std_target / std_feature
      const denormCoef = targetStd > 0 && featureStds[idx] > 0 
        ? (coef * targetStd) / featureStds[idx]
        : 0;
      return sum + denormCoef * featureMeans[idx];
    }, 0);

    // Denormalize coefficients
    const denormalizedCoefficients = coefficients.map((coef, idx) => {
      return targetStd > 0 && featureStds[idx] > 0
        ? (coef * targetStd) / featureStds[idx]
        : 0;
    });

    // Calculate R-squared using original scale
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    for (let i = 0; i < n; i++) {
      const predicted =
        intercept +
        denormalizedCoefficients.reduce(
          (sum, coef, idx) => sum + coef * rawFeatures[i][idx],
          0
        );
      totalSumSquares += Math.pow(processedTargets[i] - targetMean, 2);
      residualSumSquares += Math.pow(processedTargets[i] - predicted, 2);
    }
    const rSquared = totalSumSquares > 0 ? 1 - residualSumSquares / totalSumSquares : 0;

    return {
      coefficients: denormalizedCoefficients,
      intercept,
      rSquared: Math.max(0, Math.min(1, rSquared)),
      featureMeans,
      featureStds,
    };
  }

  /**
   * Solve a system of linear equations using Gaussian elimination
   * Enhanced with error handling for numerical stability
   */
  private static solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented: number[][] = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Check for singular or near-singular matrix
      if (Math.abs(augmented[i][i]) < 1e-10) {
        throw new Error('Matrix is singular or near-singular, cannot solve system');
      }

      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const divisor = augmented[i][i];
        if (Math.abs(divisor) < 1e-10) {
          throw new Error('Division by near-zero value in Gaussian elimination');
        }
        const factor = augmented[k][i] / divisor;
        for (let j = i; j < n + 1; j++) {
          augmented[k][j] -= factor * augmented[i][j];
          // Check for NaN or Infinity
          if (!DataUtils.isValid(augmented[k][j])) {
            throw new Error('Invalid value (NaN/Infinity) in matrix operations');
          }
        }
      }
    }

    // Back substitution
    const x: number[] = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      const divisor = augmented[i][i];
      if (Math.abs(divisor) < 1e-10) {
        throw new Error('Division by near-zero value in back substitution');
      }
      x[i] /= divisor;

      // Validate result
      if (!DataUtils.isValid(x[i])) {
        throw new Error('Invalid solution value (NaN/Infinity)');
      }
    }

    return x;
  }

  /**
   * Predict a value using the trained model
   * Enhanced with time-based features and validation
   */
  static predict(
    model: RegressionModel,
    timestamp: Date,
    timeHours: number,
    currentTemp: number,
    currentHumidity: number,
    currentRainfall: number,
    currentWindSpeed: number
  ): number {
    // Validate inputs
    if (
      !DataUtils.isValid(timeHours) ||
      !DataUtils.isValid(currentTemp) ||
      !DataUtils.isValid(currentHumidity) ||
      !DataUtils.isValid(currentRainfall) ||
      !DataUtils.isValid(currentWindSpeed)
    ) {
      return model.intercept; // Return intercept as fallback
    }

    // Extract time-based features
    const timeFeatures = this.extractTimeFeatures(timestamp);

    // Build feature vector: [time, hour_sin, hour_cos, day_sin, day_cos, temp, humidity, rainfall, windSpeed]
    const features = [
      timeHours,
      ...timeFeatures,
      currentTemp,
      currentHumidity,
      currentRainfall,
      currentWindSpeed,
    ];

    // Ensure we have enough coefficients (handle backward compatibility)
    const numFeatures = features.length;
    const numCoefficients = model.coefficients.length;

    if (numFeatures !== numCoefficients) {
      // Fallback for old models: use first 5 features (time + 4 weather metrics)
      const legacyFeatures = [timeHours, currentTemp, currentHumidity, currentRainfall, currentWindSpeed];
      const legacyCoefficients = model.coefficients.slice(0, Math.min(5, numCoefficients));
      const prediction =
        model.intercept +
        legacyCoefficients.reduce((sum, coef, idx) => sum + coef * legacyFeatures[idx], 0);
      return DataUtils.isValid(prediction) ? prediction : model.intercept;
    }

    // Calculate prediction
    const prediction =
      model.intercept +
      model.coefficients.reduce((sum, coef, idx) => {
        const featureValue = features[idx] || 0;
        return sum + coef * featureValue;
      }, 0);

    return DataUtils.isValid(prediction) ? prediction : model.intercept;
  }
}

export function WeatherPredictiveAnalysis({
  historicalData,
  currentData,
}: WeatherPredictiveAnalysisProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const [selectedHorizon, setSelectedHorizon] = useState<PredictionHorizon>('6h');

  // Inject scrollbar styles for web with adjustable opacity
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'weather-predictive-scrollbar-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .timeline-scroll-view::-webkit-scrollbar {
            height: 6px;
          }
          .timeline-scroll-view::-webkit-scrollbar-track {
            background: transparent;
          }
          .timeline-scroll-view::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.25);
            border-radius: 3px;
          }
          .timeline-scroll-view::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.4);
          }
          [data-theme="dark"] .timeline-scroll-view::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
          }
          [data-theme="dark"] .timeline-scroll-view::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.45);
          }
          /* Firefox */
          .timeline-scroll-view {
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.25) transparent;
          }
          [data-theme="dark"] .timeline-scroll-view {
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [colorScheme]);

  // Train models for each metric
  const models = useMemo<Record<MetricKey, RegressionModel> | null>(() => {
    if (historicalData.length < 3) {
      return null;
    }

    return {
      temperature: MultipleLinearRegression.train(historicalData, 'temperature'),
      humidity: MultipleLinearRegression.train(historicalData, 'humidity'),
      rainfall: MultipleLinearRegression.train(historicalData, 'rainfall'),
      windSpeed: MultipleLinearRegression.train(historicalData, 'windSpeed'),
    };
  }, [historicalData]);

  // Generate predictions
  const predictions = useMemo(() => {
    if (!models || !currentData || historicalData.length === 0) {
      return [];
    }

    const sortedData = [...historicalData].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    const latestData = sortedData[0];
    const startTime = sortedData[sortedData.length - 1].timestamp.getTime();
    
    // Use currentData if available (more recent), otherwise fall back to latest historical data
    const baseTime = currentData ? new Date() : latestData.timestamp;
    const currentTime = baseTime.getTime();

    const horizonHours = selectedHorizon === '1h' ? 1 : selectedHorizon === '6h' ? 6 : 24;
    const predictions: Prediction[] = [];

    // Generate predictions at intervals (every hour for 1h/6h, every 3 hours for 24h)
    const interval = selectedHorizon === '24h' ? 3 : 1;
    const numPredictions = Math.floor(horizonHours / interval);

    // Initialize baseline values: prefer currentData over historical data
    let baseTemp = currentData?.temperature ?? latestData.temperature;
    let baseHumidity = currentData?.humidity ?? latestData.humidity;
    let baseRainfall = currentData?.rainfall ?? latestData.rainfall;
    let baseWindSpeed = currentData?.windSpeed ?? latestData.windSpeed;

    // Apply initial constraints
    baseTemp = DataUtils.clampValue(baseTemp, METRIC_CONSTRAINTS.temperature.min, METRIC_CONSTRAINTS.temperature.max);
    baseHumidity = DataUtils.clampValue(baseHumidity, METRIC_CONSTRAINTS.humidity.min, METRIC_CONSTRAINTS.humidity.max);
    baseRainfall = DataUtils.clampValue(baseRainfall, METRIC_CONSTRAINTS.rainfall.min, METRIC_CONSTRAINTS.rainfall.max);
    baseWindSpeed = DataUtils.clampValue(baseWindSpeed, METRIC_CONSTRAINTS.windSpeed.min, METRIC_CONSTRAINTS.windSpeed.max);

    for (let i = 1; i <= numPredictions; i++) {
      const futureTime = currentTime + i * interval * 60 * 60 * 1000;
      const futureTimestamp = new Date(futureTime);
      const timeHours = (futureTime - startTime) / (1000 * 60 * 60);

      // Generate predictions with physical constraints
      const predictedTemp = MultipleLinearRegression.predict(
        models.temperature,
        futureTimestamp,
        timeHours,
        baseTemp,
        baseHumidity,
        baseRainfall,
        baseWindSpeed
      );

      const predictedHumidity = MultipleLinearRegression.predict(
        models.humidity,
        futureTimestamp,
        timeHours,
        baseTemp,
        baseHumidity,
        baseRainfall,
        baseWindSpeed
      );

      const predictedRainfall = MultipleLinearRegression.predict(
        models.rainfall,
        futureTimestamp,
        timeHours,
        baseTemp,
        baseHumidity,
        baseRainfall,
        baseWindSpeed
      );

      const predictedWindSpeed = MultipleLinearRegression.predict(
        models.windSpeed,
        futureTimestamp,
        timeHours,
        baseTemp,
        baseHumidity,
        baseRainfall,
        baseWindSpeed
      );

      // Apply physical constraints to all predictions
      const constrainedPrediction: Prediction = {
        timestamp: futureTimestamp,
        temperature: DataUtils.clampValue(
          predictedTemp,
          METRIC_CONSTRAINTS.temperature.min,
          METRIC_CONSTRAINTS.temperature.max
        ),
        humidity: DataUtils.clampValue(
          predictedHumidity,
          METRIC_CONSTRAINTS.humidity.min,
          METRIC_CONSTRAINTS.humidity.max
        ),
        rainfall: DataUtils.clampValue(
          predictedRainfall,
          METRIC_CONSTRAINTS.rainfall.min,
          METRIC_CONSTRAINTS.rainfall.max
        ),
        windSpeed: DataUtils.clampValue(
          predictedWindSpeed,
          METRIC_CONSTRAINTS.windSpeed.min,
          METRIC_CONSTRAINTS.windSpeed.max
        ),
      };

      predictions.push(constrainedPrediction);

      // Update baseline for next iteration using constrained predictions
      baseTemp = constrainedPrediction.temperature;
      baseHumidity = constrainedPrediction.humidity;
      baseRainfall = constrainedPrediction.rainfall;
      baseWindSpeed = constrainedPrediction.windSpeed;
    }

    return predictions;
  }, [models, currentData, historicalData, selectedHorizon]);

  // Calculate average model quality (R-squared)
  const averageModelQuality = useMemo(() => {
    if (!models) return 0;
    const rSquaredValues = [
      models.temperature.rSquared,
      models.humidity.rSquared,
      models.rainfall.rSquared,
      models.windSpeed.rSquared,
    ];
    return rSquaredValues.reduce((sum, val) => sum + val, 0) / rSquaredValues.length;
  }, [models]);

  const horizons: { value: PredictionHorizon; label: string }[] = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
  ];

  if (historicalData.length < 3) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <View>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Predictive Analysis
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
              Multiple linear regression forecasting
            </ThemedText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
          <ThemedText style={[styles.emptyText, { color: colors.text, opacity: 0.5 }]}>
            Insufficient data for predictions
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: colors.text, opacity: 0.4 }]}>
            Need at least 3 data points to train the model
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!currentData || !models) {
    return null;
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const metrics = [
    {
      key: 'temperature',
      label: 'Temperature',
      icon: 'thermometer',
      unit: '°C',
      color: '#F44336',
      format: (val: number) => `${val.toFixed(1)}`,
    },
    {
      key: 'humidity',
      label: 'Humidity',
      icon: 'water',
      unit: '%',
      color: '#2196F3',
      format: (val: number) => `${Math.round(val)}`,
    },
    {
      key: 'rainfall',
      label: 'Rainfall',
      icon: 'rainy',
      unit: 'mm',
      color: '#00BCD4',
      format: (val: number) => `${val.toFixed(2)}`,
    },
    {
      key: 'windSpeed',
      label: 'Wind Speed',
      icon: 'flag',
      unit: 'km/h',
      color: '#4CAF50',
      format: (val: number) => `${val.toFixed(1)}`,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Predictive Analysis
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
            Multiple linear regression forecasting
          </ThemedText>
        </View>
        <View style={[styles.qualityBadge, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="stats-chart" size={14} color={colors.primary} />
          <ThemedText style={[styles.qualityText, { color: colors.primary }]}>
            {Math.round(averageModelQuality * 100)}% fit
          </ThemedText>
        </View>
      </View>

      {/* Horizon Selector */}
      <View style={styles.filterSection}>
        <View style={styles.filterLabelContainer}>
          <Ionicons name="time-outline" size={16} color={colors.text} style={{ opacity: 0.7 }} />
          <ThemedText style={[styles.filterLabel, { color: colors.text, opacity: 0.7 }]}>
            Prediction Horizon
          </ThemedText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {horizons.map((horizon) => (
            <TouchableOpacity
              key={horizon.value}
              onPress={() => setSelectedHorizon(horizon.value)}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    selectedHorizon === horizon.value
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
                    color: selectedHorizon === horizon.value ? '#FFFFFF' : colors.primary,
                  },
                ]}
              >
                {horizon.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Predictions Grid */}
      <View style={[styles.predictionsGrid, isMobile && styles.predictionsGridMobile]}>
        {metrics.map((metric) => {
          if (!models) {
            return <View key={metric.key} />;
          }
          
          const model = models[metric.key as MetricKey];
          const latestValue = currentData[metric.key as keyof typeof currentData] as number;
          const lastPrediction = predictions.length > 0 
            ? predictions[predictions.length - 1][metric.key as keyof Prediction] as number
            : latestValue;
          const change = lastPrediction - latestValue;
          const changePercent = latestValue !== 0 ? (change / latestValue) * 100 : 0;

          return (
            <View
              key={metric.key}
              style={[
                styles.predictionCard,
                isMobile && styles.predictionCardMobile,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderLeftColor: metric.color,
                },
              ]}
            >
              <View style={styles.predictionHeader}>
                <View style={styles.predictionHeaderLeft}>
                  <View style={[styles.predictionIconContainer, { backgroundColor: `${metric.color}15` }]}>
                    <Ionicons name={metric.icon as any} size={18} color={metric.color} />
                  </View>
                  <View style={styles.predictionTitleContainer}>
                    <ThemedText style={[styles.predictionLabel, { color: colors.text }]}>
                      {metric.label}
                    </ThemedText>
                    <ThemedText style={[styles.modelQuality, { color: colors.text, opacity: 0.5 }]}>
                      R²: {Math.round(model.rSquared * 100)}%
                    </ThemedText>
                  </View>
                </View>
                {change !== 0 && (
                  <View style={styles.predictionTrend}>
                    <Ionicons
                      name={change > 0 ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={change > 0 ? colors.error : colors.success || '#22C55E'}
                    />
                    <ThemedText
                      style={[
                        styles.predictionTrendText,
                        {
                          color: change > 0 ? colors.error : colors.success || '#22C55E',
                        },
                      ]}
                    >
                      {change > 0 ? '+' : ''}{metric.format(change)} {metric.unit}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.predictionValueSection}>
                <View style={styles.predictionValueRow}>
                  <View>
                    <ThemedText style={[styles.predictionCurrentLabel, { color: colors.text, opacity: 0.6 }]}>
                      Current
                    </ThemedText>
                    <ThemedText style={[styles.predictionCurrentValue, { color: colors.text }]}>
                      {metric.format(latestValue)} {metric.unit}
                    </ThemedText>
                  </View>
                  <View style={styles.predictionArrow}>
                    <Ionicons name="arrow-forward" size={16} color={colors.text} style={{ opacity: 0.4 }} />
                  </View>
                  <View style={styles.predictionFuture}>
                    <ThemedText style={[styles.predictionFutureLabel, { color: colors.text, opacity: 0.6 }]}>
                      {selectedHorizon}
                    </ThemedText>
                    <ThemedText style={[styles.predictionFutureValue, { color: metric.color }]}>
                      {metric.format(lastPrediction)} {metric.unit}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Prediction Timeline */}
              {predictions.length > 0 && (
                <View style={[styles.predictionTimeline, { borderTopColor: colors.border }]}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    style={styles.timelineScrollView}
                    contentContainerStyle={styles.timelineScrollContent}
                    {...(Platform.OS === 'web' && {
                      // @ts-ignore - Web-specific className
                      className: 'timeline-scroll-view',
                      'data-theme': colorScheme,
                    })}
                  >
                    <View style={styles.timelineContent}>
                      {predictions.map((pred, idx) => {
                        const value = pred[metric.key as keyof Prediction] as number;
                        const isLast = idx === predictions.length - 1;
                        return (
                          <View key={idx} style={styles.timelinePoint}>
                            <View style={[styles.timelineDot, { backgroundColor: metric.color }]} />
                            <ThemedText style={[styles.timelineTime, { color: colors.text, opacity: 0.6 }]}>
                              {formatTime(pred.timestamp)}
                            </ThemedText>
                            <ThemedText style={[styles.timelineValue, { color: colors.text }]}>
                              {metric.format(value)}
                            </ThemedText>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

