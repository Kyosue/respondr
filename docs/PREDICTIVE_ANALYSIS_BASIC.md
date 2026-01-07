# Basic Predictive Analysis Documentation

## Overview

The Weather Predictive Analysis feature provides future weather forecasts using **Multiple Linear Regression (MLR)**. This component analyzes historical weather station data to predict temperature, humidity, rainfall, and wind speed for upcoming time periods.

---

## What It Does

The predictive analysis system:

1. **Trains regression models** on historical weather data
2. **Predicts future values** for all weather metrics
3. **Displays forecasts** for 1 hour, 6 hours, or 24 hours ahead
4. **Shows model quality** using R-squared (R²) metrics

---

## How It Works

### 1. **Multiple Linear Regression Model**

The system uses **Ordinary Least Squares (OLS)** regression to create predictive models for each weather metric.

**Features Used:**
- Time (hours from start of data)
- Current temperature
- Current humidity
- Current rainfall
- Current wind speed

**Target Variables:**
- Temperature (°C)
- Humidity (%)
- Rainfall (mm)
- Wind Speed (km/h)

### 2. **Model Training Process**

```
1. Collect historical data points (minimum 3 required)
   ↓
2. Sort data by timestamp (oldest to newest)
   ↓
3. Prepare feature matrix [time, temp, humidity, rainfall, wind]
   ↓
4. Calculate means and center the data
   ↓
5. Solve linear system: (X'X)^(-1)X'y
   ↓
6. Calculate R-squared for model quality
   ↓
7. Return trained model with coefficients
```

### 3. **Prediction Process**

For each prediction horizon (1h, 6h, 24h):

```
1. Use latest historical data point as baseline
   ↓
2. Calculate future timestamp
   ↓
3. Apply regression model to predict next value
   ↓
4. Use predicted value as input for next prediction (iterative)
   ↓
5. Generate predictions at intervals (every hour for 1h/6h, every 3h for 24h)
```

---

## Component Structure

### Location
`components/weather-station/WeatherPredictiveAnalysis.tsx`

### Props Interface
```typescript
interface WeatherPredictiveAnalysisProps {
  historicalData: HistoricalDataPoint[];  // Historical weather data
  currentData?: {                         // Current weather values
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  } | null;
}
```

### Key Classes

#### `MultipleLinearRegression`
Static class that handles:
- **`train()`**: Trains a regression model on historical data
- **`predict()`**: Uses trained model to predict future values
- **`solveLinearSystem()`**: Solves the OLS equation using Gaussian elimination

---

## Usage

### Basic Integration

The component is automatically integrated into the Weather Station screen:

```typescript
<WeatherPredictiveAnalysis 
  historicalData={historicalData} 
  currentData={currentData}
/>
```

### Data Requirements

- **Minimum**: 3 historical data points
- **Recommended**: 7+ days of data for better accuracy
- **Data Format**: `HistoricalDataPoint[]` with timestamp and weather metrics

---

## User Interface

### Prediction Horizons

Users can select from three prediction horizons:

| Horizon | Duration | Prediction Intervals |
|---------|----------|---------------------|
| **1 Hour** | Next 1 hour | Every 1 hour (1 prediction) |
| **6 Hours** | Next 6 hours | Every 1 hour (6 predictions) |
| **24 Hours** | Next 24 hours | Every 3 hours (8 predictions) |

### Display Features

1. **Model Quality Badge**
   - Shows average R² across all metrics
   - Indicates how well models fit the data
   - Range: 0% (poor fit) to 100% (perfect fit)

2. **Metric Cards**
   Each metric displays:
   - **Current Value**: Latest measured value
   - **Predicted Value**: Forecasted value at horizon end
   - **Change Indicator**: Shows increase/decrease with trend arrow
   - **R² Score**: Individual model quality for that metric
   - **Timeline**: Visual timeline of predictions

3. **Visual Indicators**
   - Color-coded metrics (Temperature: Red, Humidity: Blue, etc.)
   - Trend arrows (↑ increasing, ↓ decreasing)
   - Timeline dots showing prediction points

---

## Model Quality Metrics

### R-Squared (R²) Score

R² measures how well the regression model fits the data:

- **0.0 - 0.3**: Poor fit (model doesn't explain much variance)
- **0.3 - 0.7**: Moderate fit (model explains some variance)
- **0.7 - 1.0**: Good fit (model explains most variance)

**Calculation:**
```
R² = 1 - (SS_res / SS_tot)

Where:
- SS_res = Sum of squared residuals (prediction errors)
- SS_tot = Total sum of squares (variance in data)
```

### Interpreting R²

- **High R² (>0.7)**: Predictions are likely more accurate
- **Low R² (<0.3)**: Predictions have high uncertainty
- **R² = 0**: Model performs no better than using the mean

---

## Algorithm Details

### Multiple Linear Regression Formula

For each metric, the prediction uses:

```
predicted_value = intercept + 
                  (coef_time × time_hours) +
                  (coef_temp × temperature) +
                  (coef_humidity × humidity) +
                  (coef_rainfall × rainfall) +
                  (coef_wind × windSpeed)
```

### Training Process

1. **Data Preparation**
   - Convert timestamps to hours from start
   - Create feature matrix with 5 features per data point
   - Extract target values for each metric

2. **OLS Calculation**
   - Center data (subtract means)
   - Calculate covariance matrix: X'X
   - Calculate cross-product: X'y
   - Solve: coefficients = (X'X)^(-1) × X'y
   - Add small regularization (0.0001) to prevent singular matrices

3. **Quality Assessment**
   - Calculate predicted values for training data
   - Compare to actual values
   - Compute R² score

### Prediction Process

1. **Iterative Prediction**
   - Start with latest historical values
   - Predict next time step
   - Use predicted values as input for subsequent predictions
   - Continue until reaching horizon end

2. **Constraints**
   - Rainfall and wind speed cannot be negative (clamped to 0)
   - Humidity is bounded between 0-100% (clamped)

---

## Limitations

### 1. **Linear Assumption**
- Assumes linear relationships between features and targets
- Real weather patterns may be non-linear
- May not capture complex interactions

### 2. **Short-Term Focus**
- Best for short-term predictions (1-24 hours)
- Accuracy decreases for longer horizons
- Not suitable for multi-day forecasts

### 3. **Data Dependency**
- Requires minimum 3 data points
- More data = better model quality
- Sparse data leads to poor predictions

### 4. **No External Factors**
- Doesn't consider:
  - Weather forecasts
  - Atmospheric pressure
  - Cloud cover
  - Regional patterns
  - Seasonal trends

### 5. **Iterative Error Accumulation**
- Errors compound with each prediction step
- Later predictions may be less accurate
- No uncertainty quantification

---

## Best Practices

### 1. **Data Quality**
- Ensure historical data is accurate
- Remove outliers if present
- Use consistent time intervals (10 minutes recommended)

### 2. **Interpretation**
- Check R² scores before trusting predictions
- Use predictions as guidance, not absolute truth
- Consider current weather conditions

### 3. **Model Updates**
- Models retrain automatically when new data arrives
- More recent data has more influence
- Regular updates improve accuracy

### 4. **Horizon Selection**
- Use 1-hour horizon for immediate planning
- Use 6-hour horizon for short-term planning
- Use 24-hour horizon for general trends (less accurate)

---

## Example Output

### Sample Prediction Display

```
┌─────────────────────────────────────┐
│ Predictive Analysis                 │
│ Multiple linear regression          │
│                          [75% fit]  │
├─────────────────────────────────────┤
│ Prediction Horizon: [1h] [6h] [24h]│
├─────────────────────────────────────┤
│ Temperature                         │
│ R²: 82%                             │
│ Current: 28.5°C → 1h: 29.1°C ↑     │
│ Timeline: [●] [●] [●]               │
├─────────────────────────────────────┤
│ Humidity                            │
│ R²: 71%                             │
│ Current: 75% → 1h: 73% ↓           │
│ Timeline: [●] [●] [●]               │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### Key Functions

#### `MultipleLinearRegression.train()`
```typescript
static train(
  data: HistoricalDataPoint[],
  targetKey: 'temperature' | 'humidity' | 'rainfall' | 'windSpeed'
): RegressionModel
```

**Returns:**
- `coefficients`: Array of 5 coefficients [time, temp, humidity, rainfall, wind]
- `intercept`: Model intercept term
- `rSquared`: Model quality score (0-1)

#### `MultipleLinearRegression.predict()`
```typescript
static predict(
  model: RegressionModel,
  timeHours: number,
  currentTemp: number,
  currentHumidity: number,
  currentRainfall: number,
  currentWindSpeed: number
): number
```

**Returns:** Predicted value for the target metric

---

## Integration Points

### 1. **Weather Station Component**
- Fetches historical data from Firebase
- Passes data to predictive analysis component
- Updates predictions when new data arrives

### 2. **Data Flow**
```
Firebase Realtime Database
    ↓
Historical Weather Data
    ↓
WeatherPredictiveAnalysis Component
    ↓
Trained Regression Models
    ↓
Future Predictions
    ↓
User Interface Display
```

---

## Future Enhancements

### Potential Improvements

1. **Non-Linear Models**
   - Polynomial regression
   - Time series models (ARIMA)
   - Machine learning (Random Forest, LSTM)

2. **Uncertainty Quantification**
   - Confidence intervals
   - Prediction intervals
   - Probability distributions

3. **External Data Integration**
   - Weather forecast APIs
   - Satellite imagery
   - Regional weather patterns

4. **Advanced Features**
   - Multi-station aggregation
   - Seasonal adjustments
   - Anomaly detection
   - Model validation metrics

---

## References

- **Component**: `components/weather-station/WeatherPredictiveAnalysis.tsx`
- **Styles**: `components/weather-station/WeatherPredictiveAnalysis.styles.ts`
- **Data Type**: `HistoricalDataPoint` from `HistoricalDataView.tsx`
- **Algorithm**: Multiple Linear Regression (OLS)

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Algorithm** | Multiple Linear Regression (OLS) |
| **Features** | 5 (time, temp, humidity, rainfall, wind) |
| **Targets** | 4 (temperature, humidity, rainfall, windSpeed) |
| **Min Data** | 3 points |
| **Horizons** | 1h, 6h, 24h |
| **Quality Metric** | R-squared (R²) |
| **Update Frequency** | Real-time (when new data arrives) |

---

*Last Updated: 2024*

