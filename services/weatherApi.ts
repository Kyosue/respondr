/**
 * Weather API Service
 * 
 * Free Weather API Options:
 * 
 * 1. OpenWeatherMap (Recommended)
 *    - Free tier: 1,000 calls/day
 *    - Data: Current, Forecast, Historical
 *    - Sign up: https://openweathermap.org/api
 *    - Endpoints: Current Weather, 5-day Forecast, Historical
 * 
 * 2. WeatherAPI.com
 *    - Free tier: 1 million calls/month
 *    - Data: Current, Forecast, Historical, Astronomy
 *    - Sign up: https://www.weatherapi.com/
 *    - Good for: Real-time and historical data
 * 
 * 3. Open-Meteo (Best for Free)
 *    - Completely free, no API key required
 *    - Data: Current, Forecast, Historical
 *    - Sign up: Not required
 *    - Website: https://open-meteo.com/
 *    - Best for: Historical data and forecasts
 * 
 * 4. Weatherbit.io
 *    - Free tier: 500 calls/day
 *    - Data: Current, Forecast, Historical
 *    - Sign up: https://www.weatherbit.io/api
 * 
 * 5. National Weather Service (NWS) - US Only
 *    - Completely free, no API key
 *    - US locations only
 *    - Website: https://www.weather.gov/documentation/services-web-api
 */

// Configuration - Set your API keys here
const WEATHER_API_CONFIG = {
  // OpenWeatherMap
  openWeatherMap: {
    apiKey: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
  },
  // WeatherAPI.com
  weatherApi: {
    apiKey: process.env.EXPO_PUBLIC_WEATHERAPI_KEY || '',
    baseUrl: 'https://api.weatherapi.com/v1',
  },
  // Open-Meteo (No API key needed)
  openMeteo: {
    baseUrl: 'https://api.open-meteo.com/v1',
  },
};

// Davao Oriental coordinates (Mati City as default)
const DAVAO_ORIENTAL_COORDINATES = {
  mati: { lat: 6.9551, lon: 126.2167 },
  baganga: { lat: 7.5731, lon: 126.5600 },
  banaybanay: { lat: 6.9667, lon: 126.0167 },
  boston: { lat: 7.8667, lon: 126.3667 },
  caraga: { lat: 7.3333, lon: 126.5667 },
  cateel: { lat: 7.7833, lon: 126.4500 },
  governorGeneroso: { lat: 6.6500, lon: 126.0833 },
  lupon: { lat: 6.9000, lon: 126.0167 },
  manay: { lat: 7.2167, lon: 126.5333 },
  sanIsidro: { lat: 6.8333, lon: 126.0833 },
  tarragona: { lat: 7.0500, lon: 126.4500 },
};

export interface WeatherApiResponse {
  temperature: number; // Celsius
  humidity: number; // Percentage
  rainfall: number; // mm
  windSpeed: number; // km/h
  timestamp: Date;
  location?: {
    lat: number;
    lon: number;
    name: string;
  };
}

/**
 * Open-Meteo API (Recommended - Completely Free, No API Key)
 * Best for: Historical data, forecasts, and current weather
 */
export async function fetchWeatherFromOpenMeteo(
  lat: number,
  lon: number
): Promise<WeatherApiResponse | null> {
  try {
    const currentUrl = `${WEATHER_API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,windspeed_10m&timezone=Asia/Manila`;
    
    const response = await fetch(currentUrl);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    
    const data = await response.json();
    const current = data.current;

    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      rainfall: current.precipitation || 0,
      windSpeed: current.windspeed_10m * 3.6, // Convert m/s to km/h
      timestamp: new Date(current.time),
      location: { lat, lon, name: 'Weather Station' },
    };
  } catch (error) {
    console.error('Open-Meteo API error:', error);
    return null;
  }
}

/**
 * Fetch historical weather data from Open-Meteo
 */
export async function fetchHistoricalWeatherFromOpenMeteo(
  lat: number,
  lon: number,
  startDate: Date,
  endDate: Date
): Promise<WeatherApiResponse[]> {
  try {
    const now = new Date();
    const start = startDate.toISOString().split('T')[0];
    // Use today's date for end date to ensure we get the most recent data
    const end = now.toISOString().split('T')[0];
    
    // Calculate days back from today (add 1 to include today)
    const daysBack = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Use forecast API with past_days parameter for recent data (includes today)
    // This endpoint provides data from past_days ago up to current time
    // past_days can be 0-7, so we cap it at 7
    const pastDays = Math.min(Math.max(daysBack, 1), 7);
    const url = `${WEATHER_API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,windspeed_10m&past_days=${pastDays}&timezone=Asia/Manila`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch historical data');
    
    const data = await response.json();
    const hourly = data.hourly;

    if (!hourly || !hourly.time || hourly.time.length === 0) {
      return [];
    }

    const results: WeatherApiResponse[] = [];
    
    const cutoffTime = now.getTime();
    
    // Generate 10-minute interval data points from hourly data
    for (let i = 0; i < hourly.time.length; i++) {
      const currentTimestamp = new Date(hourly.time[i]);
      
      // Skip future dates (allow up to current hour)
      if (currentTimestamp.getTime() > cutoffTime) continue;
      
      // Get next hour's data for interpolation (if available)
      const nextIndex = i + 1;
      const hasNext = nextIndex < hourly.time.length;
      const nextTimestamp = hasNext ? new Date(hourly.time[nextIndex]) : null;
      
      // Current hour's values
      const currentTemp = hourly.temperature_2m[i];
      const currentHumidity = hourly.relative_humidity_2m[i];
      const currentRainfall = hourly.precipitation[i] || 0;
      const currentWind = hourly.windspeed_10m[i] * 3.6;
      
      // Next hour's values (for interpolation)
      const nextTemp = hasNext ? hourly.temperature_2m[nextIndex] : currentTemp;
      const nextHumidity = hasNext ? hourly.relative_humidity_2m[nextIndex] : currentHumidity;
      const nextRainfall = hasNext ? (hourly.precipitation[nextIndex] || 0) : currentRainfall;
      const nextWind = hasNext ? hourly.windspeed_10m[nextIndex] * 3.6 : currentWind;
      
      // Generate 6 data points per hour (every 10 minutes: 0, 10, 20, 30, 40, 50)
      for (let minute = 0; minute < 60; minute += 10) {
        const timestamp = new Date(currentTimestamp);
        timestamp.setMinutes(minute, 0, 0);
        
        // Only include data from startDate onwards
        if (timestamp < startDate) continue;
        
        // Skip if this timestamp is in the future (but allow up to current time)
        if (timestamp.getTime() > cutoffTime) continue;
        
        // Skip if this would be past the next hour (and we have next hour data)
        if (hasNext && nextTimestamp && timestamp >= nextTimestamp) continue;
        
        // Calculate interpolation factor (0.0 at start of hour, 1.0 at end)
        const interpolationFactor = minute / 60;
        
        // Interpolate values between current and next hour
        const interpolatedTemp = currentTemp + (nextTemp - currentTemp) * interpolationFactor;
        const interpolatedHumidity = currentHumidity + (nextHumidity - currentHumidity) * interpolationFactor;
        // Rainfall is cumulative, so distribute it evenly across the hour
        const interpolatedRainfall = currentRainfall * (1 - interpolationFactor) + (nextRainfall * interpolationFactor);
        const interpolatedWind = currentWind + (nextWind - currentWind) * interpolationFactor;
        
        // Add small random variation to make it more realistic (±2% variation)
        const variation = 0.02;
        const tempVariation = (Math.random() - 0.5) * variation * Math.abs(interpolatedTemp);
        const humidityVariation = (Math.random() - 0.5) * variation * Math.abs(interpolatedHumidity);
        const windVariation = (Math.random() - 0.5) * variation * Math.abs(interpolatedWind);
        
        results.push({
          temperature: interpolatedTemp + tempVariation,
          humidity: Math.max(0, Math.min(100, interpolatedHumidity + humidityVariation)),
          rainfall: Math.max(0, interpolatedRainfall),
          windSpeed: Math.max(0, interpolatedWind + windVariation),
          timestamp,
          location: { lat, lon, name: 'Weather Station' },
        });
      }
    }

    // Sort by timestamp (oldest first)
    results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return results;
  } catch (error) {
    console.error('Open-Meteo Historical API error:', error);
    return [];
  }
}

/**
 * OpenWeatherMap API (Requires API Key)
 * Free tier: 1,000 calls/day
 */
export async function fetchWeatherFromOpenWeatherMap(
  lat: number,
  lon: number
): Promise<WeatherApiResponse | null> {
  if (!WEATHER_API_CONFIG.openWeatherMap.apiKey) {
    console.warn('OpenWeatherMap API key not configured');
    return null;
  }

  try {
    const url = `${WEATHER_API_CONFIG.openWeatherMap.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_CONFIG.openWeatherMap.apiKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    
    const data = await response.json();

    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain?.['1h'] || 0, // May not always be available
      windSpeed: data.wind?.speed ? data.wind.speed * 3.6 : 0, // Convert m/s to km/h
      timestamp: new Date(data.dt * 1000),
      location: { lat, lon, name: data.name },
    };
  } catch (error) {
    console.error('OpenWeatherMap API error:', error);
    return null;
  }
}

/**
 * WeatherAPI.com (Requires API Key)
 * Free tier: 1 million calls/month
 */
export async function fetchWeatherFromWeatherAPI(
  lat: number,
  lon: number
): Promise<WeatherApiResponse | null> {
  if (!WEATHER_API_CONFIG.weatherApi.apiKey) {
    console.warn('WeatherAPI key not configured');
    return null;
  }

  try {
    const url = `${WEATHER_API_CONFIG.weatherApi.baseUrl}/current.json?key=${WEATHER_API_CONFIG.weatherApi.apiKey}&q=${lat},${lon}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    
    const data = await response.json();
    const current = data.current;

    return {
      temperature: current.temp_c,
      humidity: current.humidity,
      rainfall: current.precip_mm || 0,
      windSpeed: current.wind_kph,
      timestamp: new Date(current.last_updated),
      location: { lat, lon, name: data.location.name },
    };
  } catch (error) {
    console.error('WeatherAPI error:', error);
    return null;
  }
}

/**
 * Get coordinates for a municipality in Davao Oriental
 */
export function getMunicipalityCoordinates(municipalityName: string): { lat: number; lon: number } | null {
  const name = municipalityName.toLowerCase().replace(/\s+/g, '');
  
  const coords: Record<string, { lat: number; lon: number }> = {
    mati: DAVAO_ORIENTAL_COORDINATES.mati,
    baganga: DAVAO_ORIENTAL_COORDINATES.baganga,
    banaybanay: DAVAO_ORIENTAL_COORDINATES.banaybanay,
    boston: DAVAO_ORIENTAL_COORDINATES.boston,
    caraga: DAVAO_ORIENTAL_COORDINATES.caraga,
    cateel: DAVAO_ORIENTAL_COORDINATES.cateel,
    'governorgeneroso': DAVAO_ORIENTAL_COORDINATES.governorGeneroso,
    lupon: DAVAO_ORIENTAL_COORDINATES.lupon,
    manay: DAVAO_ORIENTAL_COORDINATES.manay,
    'sanisidro': DAVAO_ORIENTAL_COORDINATES.sanIsidro,
    tarragona: DAVAO_ORIENTAL_COORDINATES.tarragona,
  };

  return coords[name] || DAVAO_ORIENTAL_COORDINATES.mati;
}

/**
 * Unified weather fetch function (tries multiple APIs as fallback)
 */
export async function fetchWeatherData(
  municipalityName: string,
  useApi: 'openmeteo' | 'openweather' | 'weatherapi' | 'auto' = 'auto'
): Promise<WeatherApiResponse | null> {
  const coords = getMunicipalityCoordinates(municipalityName);
  if (!coords) return null;

  // Auto mode: Try Open-Meteo first (free, no key), then others
  if (useApi === 'auto' || useApi === 'openmeteo') {
    const data = await fetchWeatherFromOpenMeteo(coords.lat, coords.lon);
    if (data) return data;
  }

  if (useApi === 'auto' || useApi === 'openweather') {
    const data = await fetchWeatherFromOpenWeatherMap(coords.lat, coords.lon);
    if (data) return data;
  }

  if (useApi === 'auto' || useApi === 'weatherapi') {
    const data = await fetchWeatherFromWeatherAPI(coords.lat, coords.lon);
    if (data) return data;
  }

  return null;
}

/**
 * Fetch historical weather data
 */
export async function fetchHistoricalWeatherData(
  municipalityName: string,
  days: number = 7
): Promise<WeatherApiResponse[]> {
  const coords = getMunicipalityCoordinates(municipalityName);
  if (!coords) return [];

  const endDate = new Date(); // Current time
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  // Set to start of day (00:00:00) to ensure we get all data from that day
  startDate.setHours(0, 0, 0, 0);

  return await fetchHistoricalWeatherFromOpenMeteo(coords.lat, coords.lon, startDate, endDate);
}

