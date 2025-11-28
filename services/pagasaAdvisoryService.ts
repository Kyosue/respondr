import { HistoricalDataPoint } from '@/components/weather-station/HistoricalDataView';

/**
 * PAGASA Rainfall Advisory Levels
 * Based on official PAGASA classification system
 */
export type PAGASAAdvisoryLevel = 'TORRENTIAL' | 'INTENSE' | 'HEAVY' | 'MODERATE' | 'LIGHT';
export type PAGASAColor = 'RED' | 'ORANGE' | 'YELLOW' | 'GREY';

export interface PAGASAAdvisory {
  level: PAGASAAdvisoryLevel;
  color: PAGASAColor;
  oneHourTotal: number; // mm
  threshold: {
    min: number;
    max: number | null; // null for TORRENTIAL (>30mm)
  };
  floodPossibility: string;
  response: string;
  isCurrent: boolean; // true for current, false for predicted
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'; // for predictions
  projectedTime?: Date; // when prediction applies
}

export interface RainfallTrend {
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number; // mm/hour change
  acceleration: number; // rate of change of rate
}

export interface ContinuationPrediction {
  willContinue: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  duration: number; // hours
  projectedAdvisory?: PAGASAAdvisory;
}

export interface RainfallAnalytics {
  // Primary PAGASA metrics
  oneHourTotal: number;
  currentAdvisory: PAGASAAdvisory;
  predictedAdvisory?: PAGASAAdvisory;
  
  // Supporting metrics
  threeHourTotal: number;
  sixHourTotal: number;
  twentyFourHourTotal: number;
  
  // Trend analysis
  trend: RainfallTrend;
  
  // Continuation prediction
  continuationPrediction: ContinuationPrediction;
}

/**
 * PAGASA Thresholds (1-hour rainfall in mm)
 */
const PAGASA_THRESHOLDS = {
  TORRENTIAL: 30,      // > 30mm (RED)
  INTENSE: 15,         // 15-30mm (ORANGE)
  HEAVY: 7.5,          // 7.5-15mm (YELLOW)
  MODERATE: 2.5,       // 2.5-7.5mm (GREY)
  LIGHT: 0             // < 2.5mm (GREY)
};

/**
 * Calculate 1-hour total rainfall from historical data
 */
export function calculate1HourTotal(historicalData: HistoricalDataPoint[]): number {
  if (historicalData.length === 0) return 0;
  
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  return historicalData
    .filter(point => point.timestamp >= oneHourAgo)
    .reduce((sum, point) => sum + point.rainfall, 0);
}

/**
 * Calculate cumulative rainfall for specified hours
 */
export function calculateCumulativeRainfall(
  historicalData: HistoricalDataPoint[],
  hours: number
): number {
  if (historicalData.length === 0) return 0;
  
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
  
  return historicalData
    .filter(point => point.timestamp >= cutoffTime)
    .reduce((sum, point) => sum + point.rainfall, 0);
}

/**
 * Determine PAGASA advisory level based on 1-hour total
 */
export function getPAGASAAdvisory(oneHourTotal: number): PAGASAAdvisory {
  let level: PAGASAAdvisoryLevel;
  let color: PAGASAColor;
  let threshold: { min: number; max: number | null };
  let floodPossibility: string;
  let response: string;

  if (oneHourTotal > PAGASA_THRESHOLDS.TORRENTIAL) {
    level = 'TORRENTIAL';
    color = 'RED';
    threshold = { min: PAGASA_THRESHOLDS.TORRENTIAL, max: null };
    floodPossibility = 'Serious flooding expected in low lying areas';
    response = 'EVACUATION';
  } else if (oneHourTotal >= PAGASA_THRESHOLDS.INTENSE) {
    level = 'INTENSE';
    color = 'ORANGE';
    threshold = { min: PAGASA_THRESHOLDS.INTENSE, max: PAGASA_THRESHOLDS.TORRENTIAL };
    floodPossibility = 'Flooding is threatening';
    response = 'ALERT for possible evacuation';
  } else if (oneHourTotal >= PAGASA_THRESHOLDS.HEAVY) {
    level = 'HEAVY';
    color = 'YELLOW';
    threshold = { min: PAGASA_THRESHOLDS.HEAVY, max: PAGASA_THRESHOLDS.INTENSE };
    floodPossibility = 'Flooding is possible';
    response = 'MONITOR the weather condition';
  } else if (oneHourTotal >= PAGASA_THRESHOLDS.MODERATE) {
    level = 'MODERATE';
    color = 'GREY';
    threshold = { min: PAGASA_THRESHOLDS.MODERATE, max: PAGASA_THRESHOLDS.HEAVY };
    floodPossibility = 'Flooding still possible in certain areas';
    response = 'General awareness';
  } else {
    level = 'LIGHT';
    color = 'GREY';
    threshold = { min: PAGASA_THRESHOLDS.LIGHT, max: PAGASA_THRESHOLDS.MODERATE };
    floodPossibility = 'Very low to no direct flood risk';
    response = 'No immediate action required';
  }

  return {
    level,
    color,
    oneHourTotal,
    threshold,
    floodPossibility,
    response,
    isCurrent: true,
  };
}

/**
 * Calculate rainfall trend from historical data
 */
export function calculateRainfallTrend(
  historicalData: HistoricalDataPoint[]
): RainfallTrend {
  if (historicalData.length < 2) {
    return {
      direction: 'stable',
      rate: 0,
      acceleration: 0,
    };
  }

  // Get data from last 2 hours for trend analysis
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const recentData = historicalData
    .filter(point => point.timestamp >= twoHoursAgo)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (recentData.length < 2) {
    return {
      direction: 'stable',
      rate: 0,
      acceleration: 0,
    };
  }

  // Calculate 1-hour totals at different times
  const nowTime = now.getTime();
  const oneHourAgo = new Date(nowTime - 60 * 60 * 1000);
  const twoHoursAgoTime = new Date(nowTime - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(nowTime - 3 * 60 * 60 * 1000);

  const current1h = recentData
    .filter(p => p.timestamp >= oneHourAgo)
    .reduce((sum, p) => sum + p.rainfall, 0);

  const previous1h = recentData
    .filter(p => p.timestamp >= twoHoursAgoTime && p.timestamp < oneHourAgo)
    .reduce((sum, p) => sum + p.rainfall, 0);

  const earlier1h = recentData
    .filter(p => p.timestamp >= threeHoursAgo && p.timestamp < twoHoursAgoTime)
    .reduce((sum, p) => sum + p.rainfall, 0);

  // Calculate rate of change (velocity)
  const rate = current1h - previous1h; // mm/hour change

  // Calculate acceleration
  const previousRate = previous1h - earlier1h;
  const acceleration = rate - previousRate;

  // Determine direction
  let direction: 'increasing' | 'decreasing' | 'stable';
  if (rate > 0.5) {
    direction = 'increasing';
  } else if (rate < -0.5) {
    direction = 'decreasing';
  } else {
    direction = 'stable';
  }

  return {
    direction,
    rate,
    acceleration,
  };
}

/**
 * Predict if rainfall will continue for next 2 hours
 */
export function predictContinuation(
  currentAdvisory: PAGASAAdvisory,
  trend: RainfallTrend,
  historicalData: HistoricalDataPoint[]
): ContinuationPrediction {
  const { direction, rate, acceleration } = trend;
  
  // Get recent rainfall pattern (last 30 minutes)
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const recentRainfall = historicalData
    .filter(p => p.timestamp >= thirtyMinutesAgo)
    .map(p => p.rainfall);

  const hasRecentRainfall = recentRainfall.length > 0 && 
    recentRainfall.some(r => r > 0);

  // Predict continuation based on current state and trend
  let willContinue = false;
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let duration = 0;

  // If currently at TORRENTIAL or INTENSE level
  if (currentAdvisory.level === 'TORRENTIAL' || currentAdvisory.level === 'INTENSE') {
    if (hasRecentRainfall && (direction === 'increasing' || direction === 'stable')) {
      willContinue = true;
      confidence = 'HIGH';
      duration = 2; // Expected to continue for 2 hours
    } else if (hasRecentRainfall && direction === 'decreasing' && rate > -2) {
      willContinue = true;
      confidence = 'MEDIUM';
      duration = 1.5;
    }
  }
  // If currently at HEAVY level
  else if (currentAdvisory.level === 'HEAVY') {
    if (hasRecentRainfall && direction === 'increasing') {
      willContinue = true;
      confidence = 'HIGH';
      duration = 2;
    } else if (hasRecentRainfall && (direction === 'stable' || (direction === 'decreasing' && rate > -1))) {
      willContinue = true;
      confidence = 'MEDIUM';
      duration = 1.5;
    }
  }
  // If currently at MODERATE or LIGHT
  else {
    if (hasRecentRainfall && direction === 'increasing' && acceleration > 0) {
      willContinue = true;
      confidence = 'MEDIUM';
      duration = 1;
    } else if (hasRecentRainfall && direction === 'stable') {
      willContinue = true;
      confidence = 'LOW';
      duration = 0.5;
    }
  }

  // Project future advisory level
  let projectedAdvisory: PAGASAAdvisory | undefined;
  if (willContinue && confidence !== 'LOW') {
    // Estimate future 1-hour total based on trend
    let projected1hTotal = currentAdvisory.oneHourTotal;
    
    if (direction === 'increasing' && rate > 0) {
      projected1hTotal = currentAdvisory.oneHourTotal + (rate * 1); // Project 1 hour ahead
    } else if (direction === 'stable') {
      projected1hTotal = currentAdvisory.oneHourTotal; // Maintain current level
    } else if (direction === 'decreasing' && rate < 0) {
      projected1hTotal = Math.max(0, currentAdvisory.oneHourTotal + (rate * 1));
    }

    projectedAdvisory = getPAGASAAdvisory(projected1hTotal);
    projectedAdvisory.isCurrent = false;
    projectedAdvisory.confidence = confidence;
    projectedAdvisory.projectedTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  }

  return {
    willContinue,
    confidence,
    duration,
    projectedAdvisory,
  };
}

/**
 * Calculate comprehensive rainfall analytics
 */
export function calculateRainfallAnalytics(
  historicalData: HistoricalDataPoint[]
): RainfallAnalytics {
  // Calculate totals
  const oneHourTotal = calculate1HourTotal(historicalData);
  const threeHourTotal = calculateCumulativeRainfall(historicalData, 3);
  const sixHourTotal = calculateCumulativeRainfall(historicalData, 6);
  const twentyFourHourTotal = calculateCumulativeRainfall(historicalData, 24);

  // Get current advisory
  const currentAdvisory = getPAGASAAdvisory(oneHourTotal);

  // Calculate trend
  const trend = calculateRainfallTrend(historicalData);

  // Predict continuation
  const continuationPrediction = predictContinuation(
    currentAdvisory,
    trend,
    historicalData
  );

  return {
    oneHourTotal,
    currentAdvisory,
    predictedAdvisory: continuationPrediction.projectedAdvisory,
    threeHourTotal,
    sixHourTotal,
    twentyFourHourTotal,
    trend,
    continuationPrediction,
  };
}

/**
 * Check if advisory has escalated (e.g., YELLOW → ORANGE)
 */
export function detectAdvisoryEscalation(
  currentAdvisory: PAGASAAdvisory,
  previousAdvisory?: PAGASAAdvisory
): boolean {
  if (!previousAdvisory) return false;

  const levelOrder: PAGASAAdvisoryLevel[] = ['LIGHT', 'MODERATE', 'HEAVY', 'INTENSE', 'TORRENTIAL'];
  const currentIndex = levelOrder.indexOf(currentAdvisory.level);
  const previousIndex = levelOrder.indexOf(previousAdvisory.level);

  return currentIndex > previousIndex;
}

