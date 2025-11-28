# Rainfall-Induced Basic Predictive Model

## Overview

The rainfall prediction model is a rule-based predictive system that analyzes historical weather data to predict rainfall continuation and potential flood risks. It follows the **PAGASA (Philippine Atmospheric, Geophysical and Astronomical Services Administration)** advisory classification system to provide actionable weather alerts.

---

## Model Architecture

### 1. **Data Input**
- **Source**: Historical weather data points collected at 10-minute intervals
- **Data Points**: Each point contains:
  - `timestamp`: Date/time of measurement
  - `rainfall`: Rainfall amount in millimeters (mm)
  - `temperature`, `humidity`, `windSpeed`, `windDirection` (for context)

### 2. **Core Components**

#### A. **Rainfall Aggregation**
Calculates cumulative rainfall totals over different time windows:
- **1-Hour Total**: Sum of rainfall in the last 60 minutes
- **3-Hour Total**: Sum of rainfall in the last 3 hours
- **6-Hour Total**: Sum of rainfall in the last 6 hours
- **24-Hour Total**: Sum of rainfall in the last 24 hours

#### B. **PAGASA Advisory Classification**
Maps 1-hour rainfall totals to PAGASA advisory levels:

| Advisory Level | Rainfall Range (mm/hr) | Color Code | Flood Risk | Response Action |
|---------------|------------------------|------------|------------|-----------------|
| **TORRENTIAL** | > 30 mm | RED | Serious flooding expected in low lying areas | EVACUATION |
| **INTENSE** | 15-30 mm | ORANGE | Flooding is threatening | ALERT for possible evacuation |
| **HEAVY** | 7.5-15 mm | YELLOW | Flooding is possible | MONITOR the weather condition |
| **MODERATE** | 2.5-7.5 mm | GREY | Flooding still possible in certain areas | General awareness |
| **LIGHT** | < 2.5 mm | GREY | Very low to no direct flood risk | No immediate action required |

#### C. **Trend Analysis**
Analyzes rainfall patterns over the last 2-3 hours to determine:
- **Direction**: `increasing`, `decreasing`, or `stable`
- **Rate**: Change in mm/hour (velocity)
- **Acceleration**: Rate of change of the rate (second derivative)

**Calculation Method**:
1. Calculate 1-hour totals for three consecutive periods:
   - Current hour (now - 1 hour ago)
   - Previous hour (1-2 hours ago)
   - Earlier hour (2-3 hours ago)

2. Compute metrics:
   - `rate = current1h - previous1h` (mm/hour change)
   - `acceleration = rate - previousRate` (rate of change)
   - `direction`:
     - `increasing` if rate > 0.5 mm/hour
     - `decreasing` if rate < -0.5 mm/hour
     - `stable` otherwise

#### D. **Continuation Prediction**
Predicts whether rainfall will continue for the next 1-2 hours based on:
- Current advisory level
- Trend direction and rate
- Recent rainfall activity (last 30 minutes)
- Acceleration patterns

**Prediction Logic**:

**For TORRENTIAL/INTENSE levels:**
- **HIGH confidence** if: Recent rainfall + (increasing OR stable trend)
  - Duration: 2 hours
- **MEDIUM confidence** if: Recent rainfall + decreasing trend (rate > -2 mm/hour)
  - Duration: 1.5 hours

**For HEAVY level:**
- **HIGH confidence** if: Recent rainfall + increasing trend
  - Duration: 2 hours
- **MEDIUM confidence** if: Recent rainfall + (stable OR decreasing with rate > -1 mm/hour)
  - Duration: 1.5 hours

**For MODERATE/LIGHT levels:**
- **MEDIUM confidence** if: Recent rainfall + increasing trend + positive acceleration
  - Duration: 1 hour
- **LOW confidence** if: Recent rainfall + stable trend
  - Duration: 0.5 hours

#### E. **Future Advisory Projection**
Projects the expected advisory level 1-2 hours ahead:

1. **Estimate future 1-hour total**:
   - If `increasing`: `projected = current + (rate × 1 hour)`
   - If `stable`: `projected = current`
   - If `decreasing`: `projected = max(0, current + (rate × 1 hour))`

2. **Map to PAGASA advisory** using the same threshold system

3. **Assign confidence level** based on prediction logic

---

## Prediction Process Flow

```
1. Collect Historical Data (10-min intervals)
   ↓
2. Calculate Aggregates (1h, 3h, 6h, 24h totals)
   ↓
3. Determine Current Advisory (based on 1h total)
   ↓
4. Analyze Trend (direction, rate, acceleration)
   ↓
5. Check Recent Activity (last 30 minutes)
   ↓
6. Predict Continuation (willContinue, confidence, duration)
   ↓
7. Project Future Advisory (if continuation predicted)
   ↓
8. Generate Output (RainfallAnalytics object)
```

---

## Output Structure

### `RainfallAnalytics` Interface:
```typescript
{
  // Primary metrics
  oneHourTotal: number;              // mm
  currentAdvisory: PAGASAAdvisory;   // Current advisory level
  predictedAdvisory?: PAGASAAdvisory; // Projected advisory (if predicted)
  
  // Supporting metrics
  threeHourTotal: number;            // mm
  sixHourTotal: number;             // mm
  twentyFourHourTotal: number;       // mm
  
  // Trend analysis
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;                    // mm/hour change
    acceleration: number;             // rate of change of rate
  };
  
  // Continuation prediction
  continuationPrediction: {
    willContinue: boolean;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    duration: number;                 // hours
    projectedAdvisory?: PAGASAAdvisory;
  };
}
```

---

## Key Features

### 1. **Real-Time Analysis**
- Processes data in real-time as new measurements arrive
- Updates predictions every 10 minutes (matching data collection frequency)

### 2. **Multi-Timeframe Analysis**
- Short-term (1 hour): Primary advisory determination
- Medium-term (3-6 hours): Cumulative impact assessment
- Long-term (24 hours): Extended pattern recognition

### 3. **Confidence Levels**
- **HIGH**: Strong indicators (severe conditions + stable/increasing trend)
- **MEDIUM**: Moderate indicators (moderate conditions + trend analysis)
- **LOW**: Weak indicators (light conditions + minimal trend)

### 4. **Advisory Escalation Detection**
- Tracks changes in advisory levels over time
- Detects escalation (e.g., YELLOW → ORANGE → RED)
- Useful for alerting systems

---

## Model Limitations

1. **Rule-Based Approach**: Uses deterministic rules rather than machine learning
   - Pros: Interpretable, fast, no training required
   - Cons: May not capture complex patterns

2. **Short Prediction Window**: Predicts only 1-2 hours ahead
   - Suitable for immediate response planning
   - Not designed for long-term forecasting

3. **Localized Predictions**: Based on single station data
   - Does not account for regional weather patterns
   - May miss broader meteorological context

4. **No External Factors**: Does not consider:
   - Wind patterns
   - Atmospheric pressure
   - Cloud cover
   - Topography

---

## Usage Example

```typescript
import { calculateRainfallAnalytics } from '@/services/pagasaAdvisoryService';

// Historical data from weather station (10-min intervals)
const historicalData: HistoricalDataPoint[] = [
  { timestamp: new Date('2024-01-15T10:00:00'), rainfall: 2.5, ... },
  { timestamp: new Date('2024-01-15T10:10:00'), rainfall: 3.1, ... },
  // ... more data points
];

// Calculate analytics
const analytics = calculateRainfallAnalytics(historicalData);

// Access results
console.log('Current Advisory:', analytics.currentAdvisory.level);
console.log('1-Hour Total:', analytics.oneHourTotal, 'mm');
console.log('Trend:', analytics.trend.direction);
console.log('Will Continue?', analytics.continuationPrediction.willContinue);
console.log('Confidence:', analytics.continuationPrediction.confidence);
```

---

## Integration Points

1. **Weather Station Component** (`WeatherStation.tsx`)
   - Fetches historical data from API
   - Calls `calculateRainfallAnalytics()` every 10 minutes
   - Displays results in UI

2. **PAGASA Advisory Component** (`PAGASAAdvisory.tsx`)
   - Visualizes current and predicted advisories
   - Shows flood risk and response actions
   - Displays trend indicators

3. **Weather Analytics Dashboard** (`WeatherAnalyticsDashboard.tsx`)
   - Shows comprehensive weather metrics
   - Includes rainfall analytics in context

---

## Future Enhancements

1. **Machine Learning Integration**
   - Train models on historical patterns
   - Improve prediction accuracy
   - Extend prediction window

2. **Multi-Station Analysis**
   - Aggregate data from multiple weather stations
   - Regional pattern recognition
   - Cross-station validation

3. **External Data Sources**
   - Integrate satellite imagery
   - Include radar data
   - Weather forecast APIs

4. **Advanced Metrics**
   - Soil saturation levels
   - River level predictions
   - Evacuation zone mapping

---

## References

- **PAGASA Advisory System**: Based on official PAGASA rainfall advisory classification
- **Implementation**: `services/pagasaAdvisoryService.ts`
- **UI Components**: `components/weather-station/PAGASAAdvisory.tsx`
- **Data Source**: Open-Meteo API (historical weather data)

---

*Last Updated: 2024*

