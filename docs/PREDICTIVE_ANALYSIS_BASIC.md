# Weather Forecasting Documentation

## Overview

The Weather Forecasting feature provides future weather forecasts using **Statistical Time Series Forecasting** with **Enhanced Multiple Linear Regression (MLR)**. This component analyzes historical weather station data to predict temperature, humidity, rainfall, and wind speed for upcoming time periods. The system includes feature engineering, data normalization, outlier handling, and robust error handling for improved accuracy and reliability.

**Classification**: This is **statistical forecasting** (a form of basic predictive analytics), not advanced machine learning-based predictive analytics. It uses regression models trained on historical data to forecast future values.

---

## What It Does

The forecasting system:

1. **Trains regression models** on historical weather data with enhanced features
2. **Detects and handles outliers** to improve model robustness
3. **Normalizes features** to prevent scale bias
4. **Predicts future values** for all weather metrics with physical constraints
5. **Displays forecasts** for 1 hour, 6 hours, or 24 hours ahead
6. **Shows model quality** using R-squared (R²) metrics
7. **Applies physical constraints** to ensure realistic predictions

---

## How It Works

### 1. **Enhanced Multiple Linear Regression Model**

The system uses **Multiple Linear Regression (MLR)** models, which are fitted using the **Ordinary Least Squares (OLS)** method. The "enhanced" aspect refers to the preprocessing steps (feature engineering, normalization, outlier handling) applied before fitting the model.

**Terminology Clarification:**
- **Multiple Linear Regression (MLR)**: The type of model (regression with multiple independent variables/features)
- **Ordinary Least Squares (OLS)**: The estimation method used to fit the MLR model (minimizes sum of squared residuals)
- **Enhanced**: Refers to the preprocessing improvements (not a different algorithm)

**In Practice:**
- Model Type: Multiple Linear Regression
- Estimation Method: Ordinary Least Squares (OLS)
- Formula: coefficients = (X'X)^(-1)X'y (the OLS solution)

**Features Used (9 total):**
- Time (hours from start of data)
- Hour of day (sin/cos cyclical encoding)
- Day of week (sin/cos cyclical encoding)
- Current temperature
- Current humidity
- Current rainfall
- Current wind speed

**Time-Based Features:**
- **Hour encoding**: Captures daily patterns (e.g., temperature peaks during day)
- **Day of week encoding**: Captures weekly patterns (e.g., weekday vs weekend)
- Uses sin/cos transformation to handle cyclical nature of time

**Target Variables:**
- Temperature (°C)
- Humidity (%)
- Rainfall (mm)
- Wind Speed (km/h)

### 2. **Enhanced Model Training Process**

```
1. Collect historical data points (minimum 3 required)
   ↓
2. Sort data by timestamp (oldest to newest)
   ↓
3. Validate all data points (check for NaN/Infinity)
   ↓
4. Extract time-based features (hour, day of week with sin/cos encoding)
   ↓
5. Prepare feature matrix [time, hour_sin, hour_cos, day_sin, day_cos, temp, humidity, rainfall, wind]
   ↓
6. Detect outliers using IQR method
   ↓
7. Cap outliers (preserve data continuity)
   ↓
8. Normalize features using Z-score (mean=0, std=1)
   ↓
9. Solve linear system: (X'X)^(-1)X'y with adaptive regularization
   ↓
10. Denormalize coefficients back to original scale
   ↓
11. Calculate R-squared for model quality
   ↓
12. Return trained model with coefficients and normalization stats
```

**Key Enhancements:**
- **Outlier Detection**: Uses Interquartile Range (IQR) method to identify extreme values
- **Outlier Handling**: Caps outliers instead of removing them to preserve data continuity
- **Feature Normalization**: Z-score normalization prevents scale bias between features
- **Adaptive Regularization**: Scales with data size: `max(0.0001, 0.001 / sqrt(n))`
- **Error Handling**: Validates all inputs and handles numerical edge cases

### 3. **Enhanced Prediction Process**

For each prediction horizon (1h, 6h, 24h):

```
1. Use currentData if available (most recent), otherwise fall back to latest historical data
   ↓
2. Apply physical constraints to baseline values
   ↓
3. Calculate future timestamp
   ↓
4. Extract time-based features for future timestamp
   ↓
5. Apply regression model to predict next value
   ↓
6. Apply physical constraints to prediction
   ↓
7. Use constrained prediction as input for next prediction (iterative)
   ↓
8. Generate predictions at intervals (every hour for 1h/6h, every 3h for 24h)
   ↓
9. All predictions validated and constrained to realistic ranges
```

**Key Enhancements:**
- **Current Data Priority**: Uses `currentData` prop when available for more accurate baseline
- **Physical Constraints**: All predictions clamped to realistic ranges
- **Time-Aware Predictions**: Uses actual future timestamps for time-based features
- **Iterative Constraints**: Each prediction step applies constraints before next iteration

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
- **`train()`**: Trains a regression model on historical data with enhanced features
- **`predict()`**: Uses trained model to predict future values with time-aware features
- **`solveLinearSystem()`**: Solves the OLS equation using Gaussian elimination with error handling
- **`extractTimeFeatures()`**: Extracts cyclical time features (hour, day of week)

#### `DataUtils`
Utility class for data processing:
- **`clampValue()`**: Clamps values to valid ranges, handles NaN/Infinity
- **`isValid()`**: Validates numeric values
- **`detectOutliers()`**: Detects outliers using IQR method
- **`capOutliers()`**: Caps outliers to preserve data continuity
- **`calculateStats()`**: Calculates mean and standard deviation for normalization

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

### Multiple Linear Regression Formula (Fitted with OLS)

For each metric, the prediction uses a Multiple Linear Regression model, where the coefficients are estimated using Ordinary Least Squares:

```
predicted_value = intercept + 
                  (coef_time × time_hours) +
                  (coef_hour_sin × sin(2π × hour / 24)) +
                  (coef_hour_cos × cos(2π × hour / 24)) +
                  (coef_day_sin × sin(2π × dayOfWeek / 7)) +
                  (coef_day_cos × cos(2π × dayOfWeek / 7)) +
                  (coef_temp × temperature) +
                  (coef_humidity × humidity) +
                  (coef_rainfall × rainfall) +
                  (coef_wind × windSpeed)
```

### Enhanced Training Process

1. **Data Preparation**
   - Convert timestamps to hours from start
   - Extract time-based features (hour, day of week) with cyclical encoding
   - Create feature matrix with 9 features per data point
   - Extract target values for each metric
   - Validate all values (check for NaN/Infinity)

2. **Outlier Detection & Handling**
   - Calculate quartiles (Q1, Q3) for target variable
   - Identify outliers using IQR method: `value < Q1 - 1.5×IQR` or `value > Q3 + 1.5×IQR`
   - Cap outliers to median ± 0.5×deviation (preserves data continuity)

3. **Feature Normalization**
   - Calculate mean and standard deviation for each feature
   - Apply Z-score normalization: `(value - mean) / std`
   - Normalize target variable as well
   - Store normalization parameters for denormalization

4. **OLS Estimation (Fitting the MLR Model)**
   - Calculate covariance matrix: X'X (on normalized features)
   - Calculate cross-product: X'y (on normalized targets)
   - Apply adaptive regularization: `max(0.0001, 0.001 / sqrt(n))`
   - Solve using OLS formula: **coefficients = (X'X)^(-1) × X'y** (using Gaussian elimination)
   - This is the OLS solution that minimizes the sum of squared residuals
   - Handle singular matrices with error checking

5. **Denormalization**
   - Denormalize coefficients: `coef_original = (coef_norm × std_target) / std_feature`
   - Denormalize intercept: account for feature means

6. **Quality Assessment**
   - Calculate predicted values for training data (using original scale)
   - Compare to actual values
   - Compute R² score

### Enhanced Prediction Process

1. **Baseline Selection**
   - **Priority 1**: Use `currentData` prop if available (most recent)
   - **Priority 2**: Fall back to latest historical data point
   - Apply initial physical constraints to baseline values

2. **Iterative Prediction**
   - Start with constrained baseline values
   - For each future time step:
     - Calculate future timestamp
     - Extract time-based features for that timestamp
     - Apply regression model to predict next value
     - Apply physical constraints to prediction
     - Use constrained prediction as input for next iteration
   - Continue until reaching horizon end

3. **Physical Constraints**
   All predictions are clamped to realistic ranges:
   - **Temperature**: -50°C to 60°C
   - **Humidity**: 0% to 100%
   - **Rainfall**: 0 mm to 1000 mm
   - **Wind Speed**: 0 km/h to 200 km/h
   
   Invalid values (NaN/Infinity) are replaced with constraint minimum.

4. **Error Handling**
   - Validates all inputs before calculations
   - Checks for division by zero in matrix operations
   - Detects singular/near-singular matrices
   - Provides fallback values when calculations fail

---

## Limitations

### 1. **Linear Assumption**
- Assumes linear relationships between features and targets
- Real weather patterns may be non-linear
- May not capture complex interactions
- **Note**: Time-based features help capture some cyclical patterns

### 2. **Short-Term Focus**
- Best for short-term predictions (1-24 hours)
- Accuracy decreases for longer horizons
- Not suitable for multi-day forecasts
- **Note**: Enhanced features improve accuracy for 6-24 hour horizons

### 3. **Data Dependency**
- Requires minimum 3 data points
- More data = better model quality
- Sparse data leads to poor predictions
- **Note**: Outlier handling and normalization improve robustness with limited data

### 4. **No External Factors**
- Doesn't consider:
  - Weather forecasts
  - Atmospheric pressure
  - Cloud cover
  - Regional patterns
  - Seasonal trends (beyond day-of-week patterns)
- **Note**: Time-based features capture daily and weekly patterns

### 5. **Iterative Error Accumulation**
- Errors compound with each prediction step
- Later predictions may be less accurate
- No uncertainty quantification
- **Note**: Physical constraints help prevent unrealistic predictions

---

## Best Practices

### 1. **Data Quality**
- Ensure historical data is accurate
- **Note**: System automatically handles outliers (no manual removal needed)
- Use consistent time intervals (10 minutes recommended)
- More data points improve model quality

### 2. **Interpretation**
- Check R² scores before trusting predictions
  - R² > 0.7: High confidence
  - R² 0.3-0.7: Moderate confidence
  - R² < 0.3: Low confidence, use with caution
- Use predictions as guidance, not absolute truth
- Consider current weather conditions
- **Note**: Physical constraints ensure predictions stay within realistic ranges

### 3. **Model Updates**
- Models retrain automatically when new data arrives
- More recent data has more influence
- Regular updates improve accuracy
- **Note**: System uses `currentData` when available for most accurate baseline

### 4. **Horizon Selection**
- Use 1-hour horizon for immediate planning (most accurate)
- Use 6-hour horizon for short-term planning (good accuracy with enhanced features)
- Use 24-hour horizon for general trends (less accurate, but improved with time features)
- **Note**: Enhanced time-based features improve longer-horizon predictions

### 5. **Understanding Predictions**
- Predictions are iterative: each step uses previous prediction
- Physical constraints applied at each step prevent unrealistic values
- Time-based features capture daily and weekly patterns
- Check model quality (R²) for each metric individually

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
- `coefficients`: Array of 9 coefficients [time, hour_sin, hour_cos, day_sin, day_cos, temp, humidity, rainfall, wind]
- `intercept`: Model intercept term (denormalized)
- `rSquared`: Model quality score (0-1)
- `featureMeans`: Mean values for each feature (for normalization)
- `featureStds`: Standard deviations for each feature (for normalization)

**Process:**
1. Validates all data points
2. Extracts time-based features
3. Detects and caps outliers
4. Normalizes features and targets
5. Solves OLS with adaptive regularization
6. Denormalizes coefficients
7. Calculates R² on original scale

#### `MultipleLinearRegression.predict()`
```typescript
static predict(
  model: RegressionModel,
  timestamp: Date,
  timeHours: number,
  currentTemp: number,
  currentHumidity: number,
  currentRainfall: number,
  currentWindSpeed: number
): number
```

**Parameters:**
- `timestamp`: Future timestamp for time-based feature extraction
- `timeHours`: Hours from start of training data
- `currentTemp`, `currentHumidity`, `currentRainfall`, `currentWindSpeed`: Current weather values

**Returns:** Predicted value for the target metric (in original scale)

**Process:**
1. Validates all input values
2. Extracts time-based features from timestamp
3. Builds feature vector with 9 features
4. Applies regression model
5. Returns prediction (or intercept if calculation fails)

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

## Comparison: Current System vs. Advanced Predictive Analytics

### Current System (Statistical Forecasting)
```
✅ Uses: Multiple Linear Regression (OLS)
✅ Has: Model training, feature engineering, normalization
✅ Provides: Point predictions with R² quality scores
❌ Missing: Uncertainty quantification, validation, advanced methods
```

**Example Output:**
- "Temperature in 6 hours: 28.5°C (R² = 0.75)"

### Advanced Predictive Analytics (What It Could Be)
```
✅ Uses: ARIMA, LSTM, Random Forest, Ensemble Methods
✅ Has: Everything current system has, PLUS:
   - Confidence intervals (e.g., "28.5°C ± 1.2°C with 95% confidence")
   - Prediction intervals (range of likely values)
   - Backtesting (validates accuracy against historical predictions)
   - Model selection (automatically chooses best model)
   - Feature importance (shows which features matter most)
   - Cross-validation (tests on unseen data)
```

**Example Output:**
- "Temperature in 6 hours: 28.5°C (95% CI: 27.3°C - 29.7°C, RMSE: 0.8°C, validated on 1000 past predictions)"

### When to Use Each:

**Current System (Statistical Forecasting)** is appropriate when:
- ✅ You need simple, interpretable predictions
- ✅ You have limited computational resources
- ✅ You want fast, real-time predictions
- ✅ Basic accuracy is sufficient
- ✅ You need to understand the model (linear relationships)

**Advanced Predictive Analytics** would be needed when:
- ✅ You need uncertainty quantification (confidence intervals)
- ✅ You need to validate prediction accuracy
- ✅ You have complex non-linear patterns
- ✅ You need the highest possible accuracy
- ✅ You have large datasets and computational resources

---

## Future Enhancements

### Recently Implemented (v2.0) ✅

- ✅ **Feature Engineering**: Time-based cyclical features (hour, day of week)
- ✅ **Data Normalization**: Z-score normalization for all features
- ✅ **Outlier Handling**: IQR-based detection and capping
- ✅ **Physical Constraints**: Realistic bounds for all metrics
- ✅ **Error Handling**: Comprehensive validation and fallback mechanisms
- ✅ **Current Data Priority**: Uses most recent data for baseline

### Potential Future Improvements

1. **Uncertainty Quantification** (High Priority)
   - Confidence intervals for predictions
   - Prediction intervals (range of likely values)
   - Probability distributions
   - Standard error calculations

2. **Model Validation** (High Priority)
   - Backtesting against historical predictions
   - Cross-validation on unseen data
   - Accuracy metrics (MAE, RMSE, MAPE)
   - Prediction error analysis

3. **Advanced Time Series Methods** (Medium Priority)
   - ARIMA models (AutoRegressive Integrated Moving Average)
   - Exponential smoothing
   - Seasonal decomposition
   - Lag features (previous time steps)

4. **Machine Learning Models** (Low Priority - if accuracy critical)
   - Random Forest for non-linear patterns
   - LSTM neural networks for complex sequences
   - Ensemble methods (combining multiple models)
   - Gradient boosting

5. **External Data Integration** (Medium Priority)
   - Weather forecast APIs
   - Satellite imagery
   - Regional weather patterns
   - Atmospheric pressure data

6. **Advanced Features** (Low Priority)
   - Multi-station aggregation
   - Seasonal adjustments (beyond day-of-week)
   - Anomaly detection
   - Model selection automation

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
| **Type** | Statistical Time Series Forecasting (Basic Predictive Analytics) |
| **Model** | Multiple Linear Regression (MLR) |
| **Estimation Method** | Ordinary Least Squares (OLS) |
| **Enhancements** | Feature engineering, normalization, outlier handling |
| **Features** | 9 (time, hour_sin, hour_cos, day_sin, day_cos, temp, humidity, rainfall, wind) |
| **Targets** | 4 (temperature, humidity, rainfall, windSpeed) |
| **Min Data** | 3 points |
| **Horizons** | 1h, 6h, 24h |
| **Quality Metric** | R-squared (R²) |
| **Update Frequency** | Real-time (when new data arrives) |
| **Preprocessing** | Outlier detection, feature normalization, data validation |
| **Constraints** | Physical bounds applied to all predictions |
| **Uncertainty** | ❌ No confidence intervals (R² only) |
| **Validation** | ❌ No backtesting against actual outcomes |

---

## Terminology Clarification

### Model Type vs. Estimation Method

**What it is:**
- **Model Type**: **Multiple Linear Regression (MLR)** - A regression model with multiple independent variables (features)
- **Estimation Method**: **Ordinary Least Squares (OLS)** - The algorithm used to fit/find the MLR coefficients
- **Enhancements**: Preprocessing improvements (feature engineering, normalization, outlier handling)

**The Relationship:**
```
Multiple Linear Regression (MLR)
    └── Model Type: y = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ
    └── Estimated using: Ordinary Least Squares (OLS)
    └── OLS finds coefficients by: minimizing Σ(y - ŷ)²
    └── OLS solution: β = (X'X)^(-1)X'y
```

**In Simple Terms:**
- **MLR** = "What kind of model?" (Multiple Linear Regression)
- **OLS** = "How do we find the model parameters?" (Ordinary Least Squares method)
- **Enhanced** = "What makes it better?" (Preprocessing improvements)

**Both are correct:**
- ✅ "Multiple Linear Regression (MLR)" - describes the model
- ✅ "OLS regression" - describes the estimation method
- ✅ "MLR fitted with OLS" - most precise
- ✅ "Enhanced MLR" - emphasizes the preprocessing improvements

### What This System Is:
- ✅ **Forecasting**: Predicts future values of time series data
- ✅ **Statistical Forecasting**: Uses statistical methods (regression) to make predictions
- ✅ **Basic Predictive Analytics**: Uses historical data to predict future outcomes (statistical approach)
- ✅ **Time Series Prediction**: Forecasts future values based on historical patterns
- ✅ **Multiple Linear Regression**: Uses MLR models with multiple features
- ✅ **OLS Estimation**: Fits models using Ordinary Least Squares

### What This System Is NOT:
- ❌ **Advanced Predictive Analytics**: No machine learning (neural networks, random forests, etc.)
- ❌ **Probabilistic Forecasting**: No confidence intervals or prediction intervals
- ❌ **Validated Forecasting**: No backtesting or accuracy validation against actual outcomes
- ❌ **Adaptive Learning**: Doesn't improve from prediction errors over time

### Appropriate Terminology:
- **"Weather Forecasting"** ✅ (Most accurate)
- **"Statistical Forecasting"** ✅ (Accurate)
- **"Time Series Forecasting"** ✅ (Accurate)
- **"Multiple Linear Regression (MLR)"** ✅ (Accurate - model type)
- **"OLS Regression"** ✅ (Accurate - estimation method)
- **"MLR fitted with OLS"** ✅ (Most precise)
- **"Basic Predictive Analytics"** ✅ (Acceptable, but implies more than it is)
- **"Predictive Analytics"** ⚠️ (Technically correct but may imply advanced ML)
- **"Machine Learning"** ❌ (Incorrect - uses statistical regression, not ML)
- **"AI-Powered"** ❌ (Incorrect - no AI/ML)

---

## Recent Enhancements

### Version 2.0 Improvements

The predictive analysis system has been significantly enhanced with the following improvements:

#### 1. **Feature Engineering**
- **Time-Based Features**: Added cyclical encoding for hour of day and day of week
- **Feature Count**: Increased from 5 to 9 features for better pattern recognition
- **Cyclical Encoding**: Uses sin/cos transformation to capture daily and weekly patterns

#### 2. **Data Quality Improvements**
- **Outlier Detection**: IQR-based method to identify extreme values
- **Outlier Handling**: Caps outliers instead of removing them (preserves continuity)
- **Data Validation**: Comprehensive checks for NaN, Infinity, and invalid values

#### 3. **Normalization & Scaling**
- **Z-Score Normalization**: Prevents scale bias between different features
- **Adaptive Regularization**: Scales with dataset size for better stability
- **Denormalization**: Coefficients converted back to original scale for interpretability

#### 4. **Prediction Accuracy**
- **Current Data Priority**: Uses `currentData` prop when available for more accurate baseline
- **Time-Aware Predictions**: Uses actual future timestamps for time-based features
- **Physical Constraints**: All predictions clamped to realistic ranges

#### 5. **Error Handling & Robustness**
- **Numerical Stability**: Handles singular matrices, division by zero, NaN/Infinity
- **Fallback Mechanisms**: Provides safe defaults when calculations fail
- **Input Validation**: Validates all inputs before processing

#### 6. **Physical Constraints**
All metrics now have realistic bounds:
- Temperature: -50°C to 60°C
- Humidity: 0% to 100%
- Rainfall: 0 mm to 1000 mm
- Wind Speed: 0 km/h to 200 km/h

---

*Last Updated: 2024 (Version 2.0)*

