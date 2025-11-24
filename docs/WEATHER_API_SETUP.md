# Weather API Setup Guide

This guide explains how to integrate free weather APIs into the RESPONDR Weather Station system.

## Recommended: Open-Meteo (No API Key Required)

**Best option for your use case** - Completely free, no registration needed, and provides all the data you need.

### Features:
- ✅ No API key required
- ✅ Free unlimited access
- ✅ Current weather data
- ✅ Historical data
- ✅ Forecast data
- ✅ All required metrics: Temperature, Humidity, Rainfall, Wind Speed

### Usage:
The service is already configured in `services/weatherApi.ts`. Just use it directly:

```typescript
import { fetchWeatherData, fetchHistoricalWeatherData } from '@/services/weatherApi';

// Fetch current weather for a municipality
const weather = await fetchWeatherData('Mati');

// Fetch historical data (last 7 days)
const historical = await fetchHistoricalWeatherData('Mati', 7);
```

## Alternative Options

### 1. OpenWeatherMap
- **Free Tier**: 1,000 calls/day
- **Sign up**: https://openweathermap.org/api
- **Setup**:
  1. Create account at openweathermap.org
  2. Get your API key
  3. Add to `.env`: `EXPO_PUBLIC_OPENWEATHER_API_KEY=your_key_here`

### 2. WeatherAPI.com
- **Free Tier**: 1 million calls/month
- **Sign up**: https://www.weatherapi.com/
- **Setup**:
  1. Create account at weatherapi.com
  2. Get your API key
  3. Add to `.env`: `EXPO_PUBLIC_WEATHERAPI_KEY=your_key_here`

### 3. Weatherbit.io
- **Free Tier**: 500 calls/day
- **Sign up**: https://www.weatherbit.io/api

## Integration Steps

### Step 1: Update WeatherStation Component

Replace the mock data generation with actual API calls:

```typescript
import { fetchWeatherData, fetchHistoricalWeatherData } from '@/services/weatherApi';

const fetchWeatherData = async (stationId: string, isRefresh: boolean = false) => {
  // Get municipality name from station
  const municipalityName = selectedStation?.municipality.name || 'Mati';
  
  try {
    // Fetch current weather
    const current = await fetchWeatherData(municipalityName);
    if (current) {
      setCurrentData({
        temperature: current.temperature,
        humidity: current.humidity,
        rainfall: current.rainfall,
        windSpeed: current.windSpeed,
        lastUpdated: current.timestamp,
      });
    }
    
    // Fetch historical data
    const historical = await fetchHistoricalWeatherData(municipalityName, 7);
    if (historical.length > 0) {
      setHistoricalData(historical.map(h => ({
        timestamp: h.timestamp,
        temperature: h.temperature,
        humidity: h.humidity,
        rainfall: h.rainfall,
        windSpeed: h.windSpeed,
      })));
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
};
```

### Step 2: Environment Variables (Optional - for APIs requiring keys)

Create a `.env` file in your project root:

```
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key_here
EXPO_PUBLIC_WEATHERAPI_KEY=your_weatherapi_key_here
```

### Step 3: Backend Integration (For Your Own Weather Stations)

Since you have your own weather stations with ESP32, you'll need to:

1. **Create a backend endpoint** to receive data from your stations
2. **Store data** in Firebase or your database
3. **Fetch from your backend** instead of external APIs

Example backend endpoint structure:
```
POST /api/weather/station/:stationId
Body: {
  temperature: number,
  humidity: number,
  rainfall: number,
  windSpeed: number,
  timestamp: Date
}
```

## API Comparison

| API | Free Tier | API Key | Best For |
|-----|-----------|---------|----------|
| **Open-Meteo** | Unlimited | ❌ No | Historical data, forecasts |
| OpenWeatherMap | 1,000/day | ✅ Yes | Current weather, forecasts |
| WeatherAPI.com | 1M/month | ✅ Yes | Real-time, historical |
| Weatherbit.io | 500/day | ✅ Yes | General weather data |

## Recommendation

**Use Open-Meteo** for development and testing:
- No setup required
- All data you need
- Perfect for Davao Oriental locations
- Can supplement your own station data

**For production**, integrate with your own backend that receives data from your ESP32 weather stations every 10 minutes.

