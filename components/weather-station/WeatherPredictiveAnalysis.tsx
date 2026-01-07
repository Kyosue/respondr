import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
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
}

type PredictionHorizon = '1h' | '6h' | '24h';

/**
 * Multiple Linear Regression implementation using Ordinary Least Squares (OLS)
 * Uses time and other weather metrics as features to predict future values
 */
class MultipleLinearRegression {
  /**
   * Train a regression model to predict a target variable
   * Features: [time, temperature, humidity, rainfall, windSpeed]
   */
  static train(
    data: HistoricalDataPoint[],
    targetKey: 'temperature' | 'humidity' | 'rainfall' | 'windSpeed'
  ): RegressionModel {
    if (data.length < 3) {
      // Not enough data for regression
      return {
        coefficients: [0, 0, 0, 0, 0],
        intercept: data.length > 0 ? (data[data.length - 1] as any)[targetKey] : 0,
        rSquared: 0,
      };
    }

    // Sort data by timestamp
    const sortedData = [...data].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Prepare features and target
    const startTime = sortedData[0].timestamp.getTime();
    const features: number[][] = [];
    const targets: number[] = [];

    for (const point of sortedData) {
      const timeHours = (point.timestamp.getTime() - startTime) / (1000 * 60 * 60);
      features.push([
        timeHours,
        point.temperature,
        point.humidity,
        point.rainfall,
        point.windSpeed,
      ]);
      targets.push((point as any)[targetKey]);
    }

    // Calculate means
    const n = features.length;
    const featureMeans = [0, 0, 0, 0, 0];
    const targetMean = targets.reduce((sum, val) => sum + val, 0) / n;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 5; j++) {
        featureMeans[j] += features[i][j];
      }
    }
    for (let j = 0; j < 5; j++) {
      featureMeans[j] /= n;
    }

    // Center the data
    const centeredFeatures = features.map((row) =>
      row.map((val, idx) => val - featureMeans[idx])
    );
    const centeredTargets = targets.map((val) => val - targetMean);

    // Calculate covariance matrix and solve for coefficients
    // Using simplified approach: (X'X)^(-1)X'y
    const XTX: number[][] = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
    const XTy: number[] = [0, 0, 0, 0, 0];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 5; j++) {
        for (let k = 0; k < 5; k++) {
          XTX[j][k] += centeredFeatures[i][j] * centeredFeatures[i][k];
        }
        XTy[j] += centeredFeatures[i][j] * centeredTargets[i];
      }
    }

    // Add small regularization to avoid singular matrix
    for (let i = 0; i < 5; i++) {
      XTX[i][i] += 0.0001;
    }

    // Solve for coefficients using Gaussian elimination (simplified)
    const coefficients = this.solveLinearSystem(XTX, XTy);
    const intercept = targetMean - coefficients.reduce((sum, coef, idx) => sum + coef * featureMeans[idx], 0);

    // Calculate R-squared
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    for (let i = 0; i < n; i++) {
      const predicted = intercept + coefficients.reduce((sum, coef, idx) => sum + coef * features[i][idx], 0);
      totalSumSquares += Math.pow(targets[i] - targetMean, 2);
      residualSumSquares += Math.pow(targets[i] - predicted, 2);
    }
    const rSquared = totalSumSquares > 0 ? 1 - residualSumSquares / totalSumSquares : 0;

    return {
      coefficients,
      intercept,
      rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp between 0 and 1
    };
  }

  /**
   * Solve a system of linear equations using Gaussian elimination
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

      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j < n + 1; j++) {
          augmented[k][j] -= factor * augmented[i][j];
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
      x[i] /= augmented[i][i];
    }

    return x;
  }

  /**
   * Predict a value using the trained model
   */
  static predict(
    model: RegressionModel,
    timeHours: number,
    currentTemp: number,
    currentHumidity: number,
    currentRainfall: number,
    currentWindSpeed: number
  ): number {
    const features = [timeHours, currentTemp, currentHumidity, currentRainfall, currentWindSpeed];
    return (
      model.intercept +
      model.coefficients.reduce((sum, coef, idx) => sum + coef * features[idx], 0)
    );
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

  // Train models for each metric
  const models = useMemo(() => {
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
    const currentTime = latestData.timestamp.getTime();

    const horizonHours = selectedHorizon === '1h' ? 1 : selectedHorizon === '6h' ? 6 : 24;
    const predictions: Prediction[] = [];

    // Generate predictions at intervals (every hour for 1h/6h, every 3 hours for 24h)
    const interval = selectedHorizon === '24h' ? 3 : 1;
    const numPredictions = Math.floor(horizonHours / interval);

    for (let i = 1; i <= numPredictions; i++) {
      const futureTime = currentTime + i * interval * 60 * 60 * 1000;
      const timeHours = (futureTime - startTime) / (1000 * 60 * 60);

      // Use latest values as baseline, gradually updating with predictions
      const baseTemp = i === 1 ? latestData.temperature : predictions[i - 2].temperature;
      const baseHumidity = i === 1 ? latestData.humidity : predictions[i - 2].humidity;
      const baseRainfall = i === 1 ? latestData.rainfall : predictions[i - 2].rainfall;
      const baseWindSpeed = i === 1 ? latestData.windSpeed : predictions[i - 2].windSpeed;

      predictions.push({
        timestamp: new Date(futureTime),
        temperature: MultipleLinearRegression.predict(
          models.temperature,
          timeHours,
          baseTemp,
          baseHumidity,
          baseRainfall,
          baseWindSpeed
        ),
        humidity: MultipleLinearRegression.predict(
          models.humidity,
          timeHours,
          baseTemp,
          baseHumidity,
          baseRainfall,
          baseWindSpeed
        ),
        rainfall: Math.max(
          0,
          MultipleLinearRegression.predict(
            models.rainfall,
            timeHours,
            baseTemp,
            baseHumidity,
            baseRainfall,
            baseWindSpeed
          )
        ), // Rainfall can't be negative
        windSpeed: Math.max(
          0,
          MultipleLinearRegression.predict(
            models.windSpeed,
            timeHours,
            baseTemp,
            baseHumidity,
            baseRainfall,
            baseWindSpeed
          )
        ), // Wind speed can't be negative
      });
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
          const model = (models as any)[metric.key];
          const latestValue = (currentData as any)[metric.key];
          const lastPrediction = predictions.length > 0 ? (predictions[predictions.length - 1] as any)[metric.key] : latestValue;
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
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.timelineContent}>
                      {predictions.map((pred, idx) => {
                        const value = (pred as any)[metric.key];
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

