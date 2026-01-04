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
  windDirection: number; // degrees (0-360)
  timestamp: Date;
  location?: {
    lat: number;
    lon: number;
    name: string;
  };
}

// Firebase Realtime Database configuration
const FIREBASE_RTDB_URL = 'https://respondr-da5cb-default-rtdb.firebaseio.com';
const FIREBASE_RTDB_PATH = 'weather-data'; // Updated to match new Firebase structure

// Helper function to get Firebase Auth token or return null for public access
async function getFirebaseAuthToken(): Promise<string | null> {
  try {
    const { auth } = await import('@/firebase/config');
    const { currentUser } = auth;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
  } catch (error) {
    // If auth is not available or user is not authenticated, return null for public access
  }
  return null;
}

// Helper function to build Firebase Realtime Database URL
async function buildFirebaseUrl(path: string): Promise<string> {
  const token = await getFirebaseAuthToken();
  if (token) {
    return `${FIREBASE_RTDB_URL}/${path}.json?auth=${token}`;
  }
  // Try without auth (if database rules allow public reads)
  return `${FIREBASE_RTDB_URL}/${path}.json`;
}

// Real-time listener state
interface WeatherListenerState {
  lastTimestamp: number;
  unsubscribe: (() => void) | null;
}

const listenerStates = new Map<string, WeatherListenerState>();

/**
 * Map municipality name to device_id patterns
 * Now returns only specific patterns (WS-MATI-01) instead of broad patterns (WS-MATI)
 * This allows WS-MATI-02, WS-MATI-03, etc. to be detected as unused
 * Example: "Mati", "Mati City", or "City of Mati" -> ["WS-MATI-01", "WS-MATI-CITY-01"]
 */
export function getDeviceIdPatternsForMunicipality(municipalityName: string): string[] {
  if (!municipalityName) return [];
  
  // Normalize municipality name
  // Handle "City of Mati" -> "Mati", "Mati City" -> "Mati", "Mati" -> "Mati"
  let normalizedName = municipalityName.trim();
  
  // Remove "City of " prefix (e.g., "City of Mati" -> "Mati")
  normalizedName = normalizedName.replace(/^City\s+of\s+/i, '');
  
  // Remove " City" suffix (e.g., "Mati City" -> "Mati")
  normalizedName = normalizedName.replace(/\s+City$/i, '');
  
  normalizedName = normalizedName.trim();
  
  // Convert to uppercase and replace spaces with hyphens
  const nameUpper = normalizedName.toUpperCase().replace(/\s+/g, '-');
  
  const patterns: string[] = [];
  
  // Only add specific patterns (WS-MATI-01), not broad patterns (WS-MATI)
  // This allows WS-MATI-02, WS-MATI-03, etc. to be detected as unused
  patterns.push(`WS-${nameUpper}-01`);
  
  // If original name contains "city", also add CITY variant
  if (municipalityName.toLowerCase().includes('city')) {
    patterns.push(`WS-${nameUpper}-CITY-01`);
  }
  
  return patterns;
}

/**
 * Parse weather data string from Firebase Realtime Database and convert to JSON
 * Format: "112631541Wed26 temperature: 30.8,humidity: 80.0,wind_speed_avg: 0.0,wind_speed_max: 0.0,wind_direction: 67,rainfall_period: 0.0,rainfall_total: 0.0,signal_strength: 12,samples: 10,timestamp:2025-11-11T16:56:17,timestamp_ms: 1962880179000,device_id:WS-MATI-01 "
 */
export interface ParsedWeatherData {
  temperature: number;
  humidity: number;
  windSpeedAvg: number;
  windSpeedMax: number;
  windDirection: number;
  rainfallPeriod: number;
  rainfallTotal: number;
  signalStrength: number;
  samples: number;
  timestamp: Date;
  timestampMs: number;
  deviceId: string;
  rawKey?: string; // Original key string if present
}

/**
 * Convert cardinal wind direction to degrees
 */
function cardinalToDegrees(cardinal: string): number {
  const directions: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
    'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
    'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
  };
  return directions[cardinal.toUpperCase()] ?? 0;
}

/**
 * Parse weather data string from Firebase Realtime Database and convert to JSON object
 * Handles both old and new formats:
 * Old: "temperature: 30.8,humidity: 80.0,wind_speed_avg: 0.0..."
 * New: "device_id: WS-MATI-CITY-01, timestamp: 2025-11-27T01:43:51, humidity: 80.2%, temperature: 30.0, wind_direction: W, wind_speed: 0.0 km/h, rainfall: 7.0 mm"
 */
export function parseFirebaseWeatherDataToJSON(dataString: string): ParsedWeatherData | null {
  try {
    // Clean the string (remove newlines and trim)
    const cleanString = dataString.replace(/\n/g, ' ').trim();
    
    // Extract all fields - handle both formats
    // Temperature (may have units like "A@C" or just number)
    const tempMatch = cleanString.match(/temperature:\s*([\d.]+)/i);
    
    // Humidity (may have % or just number)
    const humidityMatch = cleanString.match(/humidity:\s*([\d.]+)/i);
    
    // Wind speed - try new format first (wind_speed), then old format (wind_speed_avg, wind_speed_max)
    const windSpeedMatch = cleanString.match(/wind_speed:\s*([\d.]+)/i);
    const windSpeedAvgMatch = cleanString.match(/wind_speed_avg:\s*([\d.]+)/i);
    const windSpeedMaxMatch = cleanString.match(/wind_speed_max:\s*([\d.]+)/i);
    
    // Wind direction - can be cardinal (N, S, E, W, NE, NW, etc.) or degrees
    const windDirCardinalMatch = cleanString.match(/wind_direction:\s*([NSEW]+)/i);
    const windDirDegreesMatch = cleanString.match(/wind_direction:\s*([\d.]+)/i);
    
    // Rainfall - try new format first (rainfall), then old format (rainfall_period, rainfall_total)
    const rainfallMatch = cleanString.match(/rainfall:\s*([\d.]+)/i);
    const rainfallPeriodMatch = cleanString.match(/rainfall_period:\s*([\d.]+)/i);
    const rainfallTotalMatch = cleanString.match(/rainfall_total:\s*([\d.]+)/i);
    
    // Old format fields
    const signalStrengthMatch = cleanString.match(/signal_strength:\s*(\d+)/i);
    const samplesMatch = cleanString.match(/samples:\s*(\d+)/i);
    
    // Timestamp - try ISO format first, then timestamp_ms
    // Match ISO format: "timestamp: 2025-11-27T01:43:51" or "timestamp:2025-11-27T01:43:51"
    const timestampMatch = cleanString.match(/timestamp:\s*([\dT:.-]+)/i);
    const timestampMsMatch = cleanString.match(/timestamp_ms:\s*(\d+)/i);
    
    // Device ID - handle both "device_id:WS-MATI-01" and "device_id: WS-MATI-01" formats
    // Also handle cases where device_id might be at the end of the string
    const deviceIdMatch = cleanString.match(/device_id:\s*([^\s,\n\r]+)/i);

    // Parse timestamp
    let timestamp: Date;
    let timestampMs: number = 0;
    
    if (timestampMsMatch) {
      timestampMs = parseInt(timestampMsMatch[1]);
      timestamp = new Date(timestampMs);
    } else if (timestampMatch) {
      const timestampStr = timestampMatch[1].trim();
      // Try parsing the timestamp - handle ISO format
      timestamp = new Date(timestampStr);
      
      // If parsing failed, try to fix common issues
      if (isNaN(timestamp.getTime())) {
        // Try adding timezone if missing
        const fixedStr = timestampStr.includes('T') && !timestampStr.includes('Z') && !timestampStr.includes('+') 
          ? timestampStr + 'Z' 
          : timestampStr;
        timestamp = new Date(fixedStr);
        
        if (isNaN(timestamp.getTime())) {
          return null;
        }
      }
      timestampMs = timestamp.getTime();
    } else {
      return null;
    }

    // Parse wind direction - convert cardinal to degrees if needed
    let windDirection = 0;
    if (windDirCardinalMatch) {
      windDirection = cardinalToDegrees(windDirCardinalMatch[1]);
    } else if (windDirDegreesMatch) {
      windDirection = parseFloat(windDirDegreesMatch[1]);
    }

    // Parse wind speed
    let windSpeedAvg = 0;
    let windSpeedMax = 0;
    if (windSpeedMatch) {
      windSpeedAvg = parseFloat(windSpeedMatch[1]);
      windSpeedMax = parseFloat(windSpeedMatch[1]);
    } else {
      windSpeedAvg = windSpeedAvgMatch ? parseFloat(windSpeedAvgMatch[1]) : 0;
      windSpeedMax = windSpeedMaxMatch ? parseFloat(windSpeedMaxMatch[1]) : 0;
    }

    // Parse rainfall
    let rainfallPeriod = 0;
    let rainfallTotal = 0;
    if (rainfallMatch) {
      rainfallTotal = parseFloat(rainfallMatch[1]);
      rainfallPeriod = parseFloat(rainfallMatch[1]);
    } else {
      rainfallPeriod = rainfallPeriodMatch ? parseFloat(rainfallPeriodMatch[1]) : 0;
      rainfallTotal = rainfallTotalMatch ? parseFloat(rainfallTotalMatch[1]) : 0;
    }

    // Build JSON object with all fields
    const jsonData: ParsedWeatherData = {
      temperature: tempMatch ? parseFloat(tempMatch[1]) : 0,
      humidity: humidityMatch ? parseFloat(humidityMatch[1]) : 0,
      windSpeedAvg,
      windSpeedMax,
      windDirection,
      rainfallPeriod,
      rainfallTotal,
      signalStrength: signalStrengthMatch ? parseInt(signalStrengthMatch[1]) : 0,
      samples: samplesMatch ? parseInt(samplesMatch[1]) : 0,
      timestamp,
      timestampMs,
      deviceId: deviceIdMatch ? deviceIdMatch[1].trim() : '',
      rawKey: dataString,
    };

    return jsonData;
  } catch (error) {
    return null;
  }
}

/**
 * Parse weather data string from Firebase Realtime Database
 * Converts to WeatherApiResponse format for compatibility
 */
export function parseFirebaseWeatherData(dataString: string): Partial<WeatherApiResponse> | null {
  try {
    const jsonData = parseFirebaseWeatherDataToJSON(dataString);
    if (!jsonData) return null;

    // Convert to WeatherApiResponse format
    const data: Partial<WeatherApiResponse> = {
      temperature: jsonData.temperature,
      humidity: jsonData.humidity,
      windSpeed: jsonData.windSpeedAvg || jsonData.windSpeedMax || 0,
      windDirection: jsonData.windDirection,
      rainfall: jsonData.rainfallTotal || jsonData.rainfallPeriod || 0,
      timestamp: jsonData.timestamp,
    };

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch weather data from Firebase Realtime Database
 * @param municipalityName Optional municipality name to filter by device_id (e.g., "Mati" filters for WS-MATI-01)
 * @param exactDeviceId Optional exact device ID to match (e.g., "WS-MATI-02") - takes precedence over municipalityName patterns
 */
export async function fetchWeatherFromFirebase(municipalityName?: string, exactDeviceId?: string): Promise<WeatherApiResponse | null> {
  try {
    const url = await buildFirebaseUrl(FIREBASE_RTDB_PATH);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // If exact device ID is provided, use it directly; otherwise use municipality patterns
    const exactDeviceIdUpper = exactDeviceId ? exactDeviceId.toUpperCase().trim() : null;
    const deviceIdPatterns = !exactDeviceIdUpper && municipalityName 
      ? getDeviceIdPatternsForMunicipality(municipalityName)
      : null;
    
    
    // Find the most recent entry (latest timestamp) matching the device_id filter
    let latestEntry: any = null;
    let latestTimestamp = 0;
    let checkedEntries = 0;
    let matchedEntries = 0;
    
    for (const key in data) {
      const entry = data[key];
      if (entry) {
        // Handle new structure: direct JSON object with properties
        // OR old structure: string in entry.key
        let jsonData: ParsedWeatherData | null = null;
        
        if (entry.device_id || entry.temperature !== undefined) {
          // New structure: direct JSON object
          const timestamp = entry.timestamp_ms 
            ? new Date(entry.timestamp_ms)
            : entry.timestamp 
            ? new Date(entry.timestamp)
            : null;
          
          if (timestamp && !isNaN(timestamp.getTime())) {
            jsonData = {
              temperature: entry.temperature || 0,
              humidity: entry.humidity || 0,
              windSpeedAvg: entry.wind_speed_avg || entry.wind_speed || 0,
              windSpeedMax: entry.wind_speed_max || entry.wind_speed || 0,
              windDirection: entry.wind_direction || 0,
              rainfallPeriod: entry.rainfall_period || 0,
              rainfallTotal: entry.rainfall_total || 0,
              signalStrength: entry.signal_strength || 0,
              samples: entry.samples || 0,
              timestamp,
              timestampMs: timestamp.getTime(),
              deviceId: entry.device_id || '',
            };
          }
        } else if (entry.key) {
          // Old structure: string that needs parsing
          jsonData = parseFirebaseWeatherDataToJSON(entry.key);
        }
        
        if (jsonData && jsonData.timestamp) {
          checkedEntries++;
          
          // Filter by device_id
          if (exactDeviceIdUpper) {
            // Exact device ID matching (for custom stations)
            if (!jsonData.deviceId || jsonData.deviceId.toUpperCase().trim() !== exactDeviceIdUpper) {
              continue; // Skip entries that don't match the exact device ID
            }
            matchedEntries++;
          } else if (deviceIdPatterns) {
            // Pattern matching (for base stations)
            if (!jsonData.deviceId || !jsonData.deviceId.trim()) {
              // If municipality filter is set but device_id is missing, skip
              continue;
            }
            
            const deviceIdUpper = jsonData.deviceId.toUpperCase().trim();
            const matches = deviceIdPatterns.some(pattern => {
              const patternUpper = pattern.toUpperCase();
              // Strict matching: exact match OR device_id starts with pattern followed by '-' or end of string
              // Examples:
              // - "WS-MATI-01" matches pattern "WS-MATI-01" (exact match)
              // - "WS-MATI" matches pattern "WS-MATI" (exact match)
              // - "WS-MATI-01" does NOT match pattern "WS-BAGANGA" (doesn't start with "WS-BAGANGA")
              const isMatch = deviceIdUpper === patternUpper;
              if (isMatch) {
                matchedEntries++;
              }
              return isMatch;
            });
            if (!matches) {
              continue; // Skip entries that don't match the device_id
            }
          }
          
          const timestamp = jsonData.timestamp.getTime();
          if (timestamp > latestTimestamp) {
            latestTimestamp = timestamp;
            latestEntry = jsonData;
          }
        }
      }
    }
    
    if (!latestEntry || !latestEntry.timestamp) {
      return null;
    }
    
    // Convert JSON data to WeatherApiResponse format
    const result: WeatherApiResponse = {
      temperature: latestEntry.temperature,
      humidity: latestEntry.humidity,
      rainfall: latestEntry.rainfallTotal || latestEntry.rainfallPeriod || 0,
      windSpeed: latestEntry.windSpeedAvg || latestEntry.windSpeedMax || 0,
      windDirection: latestEntry.windDirection,
      timestamp: latestEntry.timestamp,
      location: {
        lat: 6.9551, // Mati coordinates (default)
        lon: 126.2167,
        name: 'Weather Station',
      },
    };
    
    return result;
    } catch (error) {
      return null;
    }
}

/**
 * Open-Meteo API (Recommended - Completely Free, No API Key)
 * Best for: Historical data, forecasts, and current weather
 * DISABLED: Commented out per user request
 */
/* export async function fetchWeatherFromOpenMeteo(
  lat: number,
  lon: number
): Promise<WeatherApiResponse | null> {
  try {
    const currentUrl = `${WEATHER_API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,windspeed_10m,winddirection_10m&timezone=Asia/Manila`;
    
    const response = await fetch(currentUrl);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    
    const data = await response.json();
    const current = data.current;

    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      rainfall: current.precipitation || 0,
      windSpeed: current.windspeed_10m * 3.6, // Convert m/s to km/h
      windDirection: current.winddirection_10m || 0, // degrees (0-360)
      timestamp: new Date(current.time),
      location: { lat, lon, name: 'Weather Station' },
    };
    } catch (error) {
      // Open-Meteo API error
    return null;
  }
} */

/**
 * Fetch historical weather data from Open-Meteo
 * DISABLED: Commented out per user request
 */
/* export async function fetchHistoricalWeatherFromOpenMeteo(
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
    const url = `${WEATHER_API_CONFIG.openMeteo.baseUrl}/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,windspeed_10m,winddirection_10m&past_days=${pastDays}&timezone=Asia/Manila`;
    
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
      const currentWindDir = hourly.winddirection_10m[i] || 0;
      
      // Next hour's values (for interpolation)
      const nextTemp = hasNext ? hourly.temperature_2m[nextIndex] : currentTemp;
      const nextHumidity = hasNext ? hourly.relative_humidity_2m[nextIndex] : currentHumidity;
      const nextRainfall = hasNext ? (hourly.precipitation[nextIndex] || 0) : currentRainfall;
      const nextWind = hasNext ? hourly.windspeed_10m[nextIndex] * 3.6 : currentWind;
      const nextWindDir = hasNext ? (hourly.winddirection_10m[nextIndex] || 0) : currentWindDir;
      
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
        // Wind direction: handle circular interpolation (0-360 degrees)
        let interpolatedWindDir = currentWindDir;
        if (hasNext) {
          let dirDiff = nextWindDir - currentWindDir;
          // Handle wrap-around (e.g., 350° to 10° = 20° change, not -340°)
          if (dirDiff > 180) dirDiff -= 360;
          if (dirDiff < -180) dirDiff += 360;
          interpolatedWindDir = currentWindDir + dirDiff * interpolationFactor;
          // Normalize to 0-360
          if (interpolatedWindDir < 0) interpolatedWindDir += 360;
          if (interpolatedWindDir >= 360) interpolatedWindDir -= 360;
        }
        
        // Add small random variation to make it more realistic (±2% variation)
        const variation = 0.02;
        const tempVariation = (Math.random() - 0.5) * variation * Math.abs(interpolatedTemp);
        const humidityVariation = (Math.random() - 0.5) * variation * Math.abs(interpolatedHumidity);
        const windVariation = (Math.random() - 0.5) * variation * Math.abs(interpolatedWind);
        const windDirVariation = (Math.random() - 0.5) * 5; // ±2.5 degrees variation
        
        results.push({
          temperature: interpolatedTemp + tempVariation,
          humidity: Math.max(0, Math.min(100, interpolatedHumidity + humidityVariation)),
          rainfall: Math.max(0, interpolatedRainfall),
          windSpeed: Math.max(0, interpolatedWind + windVariation),
          windDirection: Math.max(0, Math.min(360, interpolatedWindDir + windDirVariation)),
          timestamp,
          location: { lat, lon, name: 'Weather Station' },
        });
      }
    }

    // Sort by timestamp (oldest first)
    results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return results;
    } catch (error) {
      // Open-Meteo Historical API error
    return [];
  }
} */

/**
 * OpenWeatherMap API (Requires API Key)
 * Free tier: 1,000 calls/day
 * DISABLED: Commented out per user request
 */
/* export async function fetchWeatherFromOpenWeatherMap(
  lat: number,
  lon: number
): Promise<WeatherApiResponse | null> {
    if (!WEATHER_API_CONFIG.openWeatherMap.apiKey) {
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
      windDirection: data.wind?.deg || 0, // degrees (0-360)
      timestamp: new Date(data.dt * 1000),
      location: { lat, lon, name: data.name },
    };
    } catch (error) {
      // OpenWeatherMap API error
    return null;
  }
} */

/**
 * WeatherAPI.com (Requires API Key)
 * Free tier: 1 million calls/month
 * DISABLED: Commented out per user request
 */
/* export async function fetchWeatherFromWeatherAPI(
  lat: number,
  lon: number
): Promise<WeatherApiResponse | null> {
    if (!WEATHER_API_CONFIG.weatherApi.apiKey) {
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
      windDirection: current.wind_degree || 0, // degrees (0-360)
      timestamp: new Date(current.last_updated),
      location: { lat, lon, name: data.location.name },
    };
    } catch (error) {
      // WeatherAPI error
    return null;
  }
} */

/**
 * Check if a municipality name refers to Mati City
 * Handles variations: "Mati", "Mati City", "City of Mati"
 */
export function isMatiCity(municipalityName?: string): boolean {
  if (!municipalityName) return false;
  
  const normalized = municipalityName.toLowerCase().trim();
  // Remove "City of " prefix and " City" suffix for comparison
  const cleaned = normalized.replace(/^city\s+of\s+/i, '').replace(/\s+city$/i, '').trim();
  
  return cleaned === 'mati';
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
 * Unified weather fetch function (uses Firebase Realtime Database)
 * @param municipalityName Optional municipality name to filter by device_id patterns
 * @param exactDeviceId Optional exact device ID to match (for custom stations)
 * @param useApi API source to use
 */
export async function fetchWeatherData(
  municipalityName?: string,
  exactDeviceId?: string,
  useApi: 'firebase' | 'openmeteo' | 'openweather' | 'weatherapi' | 'auto' = 'auto'
): Promise<WeatherApiResponse | null> {
  // Always try Firebase first (primary data source)
  if (useApi === 'auto' || useApi === 'firebase') {
    const data = await fetchWeatherFromFirebase(municipalityName, exactDeviceId);
    if (data) return data;
  }

  // Fallback to Open-Meteo API only if Firebase fails and it's NOT Mati City
  // Mati City has its own weather station, so we don't use OpenMeteo for it
  // DISABLED: API fallback commented out per user request
  /* if (useApi === 'auto' && !isMatiCity(municipalityName)) {
    const coords = getMunicipalityCoordinates(municipalityName || 'mati');
    if (coords) {
      // Try Open-Meteo as fallback
      const data = await fetchWeatherFromOpenMeteo(coords.lat, coords.lon);
      if (data) {
        return data;
      }
    }
  } */

  return null;
}

/**
 * Fetch all historical weather data from Firebase Realtime Database
 * Converts string data to JSON format before processing
 * 
 * Note: New data arrives in the database every 10 minutes.
 * Each entry in the database represents a 10-minute interval.
 * 
 * @param municipalityName Optional municipality name to filter by device_id (e.g., "Mati" filters for WS-MATI-01)
 */
export async function fetchAllHistoricalWeatherFromFirebase(municipalityName?: string, exactDeviceId?: string): Promise<WeatherApiResponse[]> {
  try {
    const url = await buildFirebaseUrl(FIREBASE_RTDB_PATH);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }
    
    const data = await response.json();
    const results: WeatherApiResponse[] = [];
    let parsedCount = 0;
    let skippedCount = 0;
    let filteredCount = 0;
    
    // If exact device ID is provided, use it directly; otherwise use municipality patterns
    const exactDeviceIdUpper = exactDeviceId ? exactDeviceId.toUpperCase().trim() : null;
    const deviceIdPatterns = !exactDeviceIdUpper && municipalityName 
      ? getDeviceIdPatternsForMunicipality(municipalityName)
      : null;
    
    // Parse all entries from Firebase - handle both new (direct JSON) and old (string) formats
    for (const key in data) {
      const entry = data[key];
      if (entry) {
        // Handle new structure: direct JSON object with properties
        // OR old structure: string in entry.key
        let jsonData: ParsedWeatherData | null = null;
        
        if (entry.device_id || entry.temperature !== undefined) {
          // New structure: direct JSON object
          const timestamp = entry.timestamp_ms 
            ? new Date(entry.timestamp_ms)
            : entry.timestamp 
            ? new Date(entry.timestamp)
            : null;
          
          if (timestamp && !isNaN(timestamp.getTime())) {
            jsonData = {
              temperature: entry.temperature || 0,
              humidity: entry.humidity || 0,
              windSpeedAvg: entry.wind_speed_avg || entry.wind_speed || 0,
              windSpeedMax: entry.wind_speed_max || entry.wind_speed || 0,
              windDirection: entry.wind_direction || 0,
              rainfallPeriod: entry.rainfall_period || 0,
              rainfallTotal: entry.rainfall_total || 0,
              signalStrength: entry.signal_strength || 0,
              samples: entry.samples || 0,
              timestamp,
              timestampMs: timestamp.getTime(),
              deviceId: entry.device_id || '',
            };
          }
        } else if (entry.key) {
          // Old structure: string that needs parsing
          jsonData = parseFirebaseWeatherDataToJSON(entry.key);
        }
        
        if (jsonData && jsonData.timestamp) {
          // Validate timestamp is not invalid
          if (isNaN(jsonData.timestamp.getTime())) {
            skippedCount++;
            continue;
          }
          
          // Filter by device_id if municipality is specified
          if (deviceIdPatterns) {
            if (!jsonData.deviceId || !jsonData.deviceId.trim()) {
              // If municipality filter is set but device_id is missing, skip
              filteredCount++;
              continue;
            }
            
            const deviceIdUpper = jsonData.deviceId.toUpperCase().trim();
            const matches = deviceIdPatterns.some(pattern => {
              const patternUpper = pattern.toUpperCase();
              // Strict matching: exact match OR device_id starts with pattern followed by '-' or end of string
              // Examples:
              // - "WS-MATI-01" matches pattern "WS-MATI" (starts with "WS-MATI" + "-")
              // - "WS-MATI" matches pattern "WS-MATI" (exact match)
              // - "WS-MATI-01" does NOT match pattern "WS-BAGANGA" (doesn't start with "WS-BAGANGA")
              const isMatch = deviceIdUpper === patternUpper || 
                             deviceIdUpper.startsWith(patternUpper + '-');
              return isMatch;
            });
            if (!matches) {
              filteredCount++;
              continue; // Skip entries that don't match the device_id
            }
          }
          
          // Convert JSON data to WeatherApiResponse format
          const weatherData: WeatherApiResponse = {
            temperature: jsonData.temperature,
            humidity: jsonData.humidity,
            rainfall: jsonData.rainfallTotal || jsonData.rainfallPeriod || 0,
            windSpeed: jsonData.windSpeedAvg || jsonData.windSpeedMax || 0,
            windDirection: jsonData.windDirection,
            timestamp: jsonData.timestamp,
            location: {
              lat: 6.9551, // Mati coordinates (default)
              lon: 126.2167,
              name: 'Weather Station',
            },
          };
          results.push(weatherData);
          parsedCount++;
        } else {
          skippedCount++;
        }
      }
    }
    
    // Sort by timestamp (oldest first)
    results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return results;
  } catch (error) {
    return [];
  }
}

/**
 * Fetch historical weather data from Firebase Realtime Database
 * Note: Currently returns only the latest data point as Firebase structure stores single entries
 */
export async function fetchHistoricalWeatherData(
  municipalityName?: string,
  exactDeviceId?: string,
  days: number = 7
): Promise<WeatherApiResponse[]> {
  // Fetch all data from Firebase, filtered by municipality/device_id
  const allData = await fetchAllHistoricalWeatherFromFirebase(municipalityName, exactDeviceId);
  
  if (allData.length > 0) {
    // Filter by days if needed
    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return allData.filter(entry => entry.timestamp >= cutoffDate);
    }
    return allData;
  }
  
  // Fallback to Open-Meteo API only if Firebase fails and it's NOT Mati City
  // Mati City has its own weather station, so we don't use OpenMeteo for it
  // DISABLED: API fallback commented out per user request
  /* if (!isMatiCity(municipalityName)) {
    const coords = getMunicipalityCoordinates(municipalityName || 'mati');
    if (coords) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
      const historicalData = await fetchHistoricalWeatherFromOpenMeteo(coords.lat, coords.lon, startDate, endDate);
      if (historicalData.length > 0) {
        return historicalData;
      }
    }
  } */
  
  return [];
}

/**
 * Subscribe to real-time weather data updates from Firebase Realtime Database
 * Automatically detects and processes new data when it arrives
 * 
 * @param municipalityName Optional municipality name to filter by device_id
 * @param onUpdate Callback function called when new weather data is detected
 * @param onError Optional error callback
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToWeatherUpdates(
  municipalityName: string | undefined,
  exactDeviceId: string | undefined,
  onUpdate: (data: WeatherApiResponse) => void,
  onError?: (error: Error) => void
): () => void {
  const listenerKey = `${municipalityName || 'all'}_${exactDeviceId || ''}`;
  let isActive = true;
  let lastTimestamp = 0;
  let checkInterval: ReturnType<typeof setInterval> | null = null;
  
  // Initial fetch to get current data and set baseline timestamp
  const initialFetch = async () => {
    try {
      const current = await fetchWeatherFromFirebase(municipalityName, exactDeviceId);
      if (current && isActive) {
        lastTimestamp = current.timestamp.getTime();
        onUpdate(current);
      }
    } catch (error) {
      // Initial fetch error
      if (onError && isActive) {
        onError(error instanceof Error ? error : new Error('Initial fetch failed'));
      }
    }
  };
  
  // Check for new data
  const checkForUpdates = async () => {
    if (!isActive) return;
    
    try {
      const url = await buildFirebaseUrl(FIREBASE_RTDB_PATH);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // If exact device ID is provided, use it directly; otherwise use municipality patterns
      const exactDeviceIdUpper = exactDeviceId ? exactDeviceId.toUpperCase().trim() : null;
      const deviceIdPatterns = !exactDeviceIdUpper && municipalityName 
        ? getDeviceIdPatternsForMunicipality(municipalityName)
        : null;
      
      // Find the most recent entry matching the device_id filter
      let latestEntry: any = null;
      let latestTimestamp = 0;
      
      for (const key in data) {
        const entry = data[key];
        if (entry) {
          // Handle new structure: direct JSON object with properties
          // OR old structure: string in entry.key
          let jsonData: ParsedWeatherData | null = null;
          
          if (entry.device_id || entry.temperature !== undefined) {
            // New structure: direct JSON object
            const timestamp = entry.timestamp_ms 
              ? new Date(entry.timestamp_ms)
              : entry.timestamp 
              ? new Date(entry.timestamp)
              : null;
            
            if (timestamp && !isNaN(timestamp.getTime())) {
              jsonData = {
                temperature: entry.temperature || 0,
                humidity: entry.humidity || 0,
                windSpeedAvg: entry.wind_speed_avg || entry.wind_speed || 0,
                windSpeedMax: entry.wind_speed_max || entry.wind_speed || 0,
                windDirection: entry.wind_direction || 0,
                rainfallPeriod: entry.rainfall_period || 0,
                rainfallTotal: entry.rainfall_total || 0,
                signalStrength: entry.signal_strength || 0,
                samples: entry.samples || 0,
                timestamp,
                timestampMs: timestamp.getTime(),
                deviceId: entry.device_id || '',
              };
            }
          } else if (entry.key) {
            // Old structure: string that needs parsing
            jsonData = parseFirebaseWeatherDataToJSON(entry.key);
          }
          
          if (jsonData && jsonData.timestamp) {
            // Filter by device_id if municipality is specified
            if (deviceIdPatterns) {
              if (!jsonData.deviceId || !jsonData.deviceId.trim()) {
                continue;
              }
              
              const deviceIdUpper = jsonData.deviceId.toUpperCase().trim();
              const matches = deviceIdPatterns.some(pattern => {
                const patternUpper = pattern.toUpperCase();
                return deviceIdUpper === patternUpper || 
                       deviceIdUpper.startsWith(patternUpper + '-');
              });
              if (!matches) {
                continue;
              }
            }
            
            const timestamp = jsonData.timestamp.getTime();
            if (timestamp > latestTimestamp) {
              latestTimestamp = timestamp;
              latestEntry = jsonData;
            }
          }
        }
      }
      
      // Only update if we have new data (timestamp is newer than last known)
      if (latestEntry && latestTimestamp > lastTimestamp && isActive) {
        lastTimestamp = latestTimestamp;
        
        const result: WeatherApiResponse = {
          temperature: latestEntry.temperature,
          humidity: latestEntry.humidity,
          rainfall: latestEntry.rainfallTotal || latestEntry.rainfallPeriod || 0,
          windSpeed: latestEntry.windSpeedAvg || latestEntry.windSpeedMax || 0,
          windDirection: latestEntry.windDirection,
          timestamp: latestEntry.timestamp,
          location: {
            lat: 6.9551,
            lon: 126.2167,
            name: 'Weather Station',
          },
        };
        
        onUpdate(result);
      }
    } catch (error) {
      // Error checking for updates
      if (onError && isActive) {
        onError(error instanceof Error ? error : new Error('Update check failed'));
      }
    }
  };
  
  // Start initial fetch
  initialFetch();
  
  // Set up polling interval (check every 10 seconds for new data)
  // This is more efficient than 10-minute polling and detects changes quickly
  checkInterval = setInterval(checkForUpdates, 30 * 1000); // 10 seconds
  
  // Store listener state
  listenerStates.set(listenerKey, {
    lastTimestamp,
    unsubscribe: () => {
      isActive = false;
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      listenerStates.delete(listenerKey);
    }
  });
  
  // Return unsubscribe function
  return () => {
    const state = listenerStates.get(listenerKey);
    if (state && state.unsubscribe) {
      state.unsubscribe();
    }
  };
}

/**
 * Subscribe to real-time historical weather data updates from Firebase Realtime Database
 * Automatically detects and processes new historical entries
 * 
 * @param municipalityName Optional municipality name to filter by device_id
 * @param onUpdate Callback function called when new historical data is detected
 * @param onError Optional error callback
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToHistoricalWeatherUpdates(
  municipalityName: string | undefined,
  exactDeviceId: string | undefined,
  onUpdate: (data: WeatherApiResponse[]) => void,
  onError?: (error: Error) => void
): () => void {
  const listenerKey = `historical_${municipalityName || 'all'}_${exactDeviceId || ''}`;
  let isActive = true;
  let lastDataCount = 0;
  let checkInterval: ReturnType<typeof setInterval> | null = null;
  
  // Initial fetch to get current data
  const initialFetch = async () => {
    try {
      const historical = await fetchAllHistoricalWeatherFromFirebase(municipalityName, exactDeviceId);
      if (isActive) {
        lastDataCount = historical.length;
        onUpdate(historical);
      }
    } catch (error) {
      // Initial fetch error
      if (onError && isActive) {
        onError(error instanceof Error ? error : new Error('Initial fetch failed'));
      }
    }
  };
  
  // Check for new data
  const checkForUpdates = async () => {
    if (!isActive) return;
    
    try {
      const historical = await fetchAllHistoricalWeatherFromFirebase(municipalityName, exactDeviceId);
      
      // Only update if we have new entries (count increased)
      if (historical.length > lastDataCount && isActive) {
        lastDataCount = historical.length;
        onUpdate(historical);
      }
    } catch (error) {
      // Error checking for updates
      if (onError && isActive) {
        onError(error instanceof Error ? error : new Error('Update check failed'));
      }
    }
  };
  
  // Start initial fetch
  initialFetch();
  
  // Set up polling interval (check every 10 seconds for new data)
  checkInterval = setInterval(checkForUpdates, 30 * 1000); // 10 seconds
  
  // Return unsubscribe function
  return () => {
    isActive = false;
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };
}

/**
 * Device ID information from Firebase scan
 */
export interface DeviceIdInfo {
  deviceId: string;
  lastSeen: Date;
  lastData?: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  };
  isActive: boolean; // Has data within last 30 days
}

/**
 * Scan Firebase for all unique device IDs and return unused ones
 * @param existingStations Currently displayed weather stations (may include deviceId for custom stations)
 * @returns Array of unused device IDs that exist in Firebase but aren't being displayed
 */
export async function scanForUnusedDeviceIds(
  existingStations: Array<{ municipality: { name: string }; deviceId?: string }>
): Promise<DeviceIdInfo[]> {
  try {
    const url = await buildFirebaseUrl(FIREBASE_RTDB_PATH);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Build a map of all device IDs found in Firebase
    const deviceIdMap = new Map<string, {
      lastSeen: Date;
      lastData?: {
        temperature: number;
        humidity: number;
        rainfall: number;
        windSpeed: number;
      };
    }>();
    
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Parse all entries and collect device IDs - handle both new (direct JSON) and old (string) formats
    for (const key in data) {
      const entry = data[key];
      if (entry) {
        // Handle new structure: direct JSON object with properties
        // OR old structure: string in entry.key
        let jsonData: ParsedWeatherData | null = null;
        
        if (entry.device_id || entry.temperature !== undefined) {
          // New structure: direct JSON object
          const timestamp = entry.timestamp_ms 
            ? new Date(entry.timestamp_ms)
            : entry.timestamp 
            ? new Date(entry.timestamp)
            : null;
          
          if (timestamp && !isNaN(timestamp.getTime())) {
            jsonData = {
              temperature: entry.temperature || 0,
              humidity: entry.humidity || 0,
              windSpeedAvg: entry.wind_speed_avg || entry.wind_speed || 0,
              windSpeedMax: entry.wind_speed_max || entry.wind_speed || 0,
              windDirection: entry.wind_direction || 0,
              rainfallPeriod: entry.rainfall_period || 0,
              rainfallTotal: entry.rainfall_total || 0,
              signalStrength: entry.signal_strength || 0,
              samples: entry.samples || 0,
              timestamp,
              timestampMs: timestamp.getTime(),
              deviceId: entry.device_id || '',
            };
          }
        } else if (entry.key) {
          // Old structure: string that needs parsing
          jsonData = parseFirebaseWeatherDataToJSON(entry.key);
        }
        
        if (jsonData && jsonData.deviceId && jsonData.timestamp) {
          const deviceId = jsonData.deviceId.trim().toUpperCase();
          const timestamp = jsonData.timestamp.getTime();
          
          // Only consider devices with data in the last 30 days
          if (timestamp >= thirtyDaysAgo) {
            const existing = deviceIdMap.get(deviceId);
            
            // Keep the most recent entry for each device ID
            if (!existing || timestamp > existing.lastSeen.getTime()) {
              deviceIdMap.set(deviceId, {
                lastSeen: jsonData.timestamp,
                lastData: {
                  temperature: jsonData.temperature,
                  humidity: jsonData.humidity,
                  rainfall: jsonData.rainfallTotal || jsonData.rainfallPeriod || 0,
                  windSpeed: jsonData.windSpeedAvg || jsonData.windSpeedMax || 0,
                },
              });
            }
          }
        }
      }
    }
    
    // Build set of exact device IDs used by custom stations
    const usedExactDeviceIds = new Set<string>();
    // Build set of device ID patterns for base stations (without specific deviceId)
    const usedDeviceIdPatterns = new Set<string>();
    
    for (const station of existingStations) {
      // If station has a specific deviceId (custom station), use exact matching
      if (station.deviceId) {
        usedExactDeviceIds.add(station.deviceId.toUpperCase().trim());
      } else {
        // For base stations without specific deviceId, use pattern matching
        const patterns = getDeviceIdPatternsForMunicipality(station.municipality.name);
        patterns.forEach(pattern => {
          usedDeviceIdPatterns.add(pattern.toUpperCase());
        });
      }
    }
    
    // Find unused device IDs
    const unusedDeviceIds: DeviceIdInfo[] = [];
    
    for (const [deviceId, info] of deviceIdMap.entries()) {
      const deviceIdUpper = deviceId.toUpperCase();
      
      // First check if it's an exact match (custom station)
      if (usedExactDeviceIds.has(deviceIdUpper)) {
        continue; // This device ID is already used by a custom station
      }
      
      // Then check if it matches any pattern (base station)
      let isUsed = false;
      for (const pattern of usedDeviceIdPatterns) {
        // Check if device ID matches pattern (exact or starts with pattern + '-')
        if (deviceIdUpper === pattern || deviceIdUpper.startsWith(pattern + '-')) {
          isUsed = true;
          break;
        }
      }
      
      // If not used, add to unused list
      if (!isUsed) {
        unusedDeviceIds.push({
          deviceId,
          lastSeen: info.lastSeen,
          lastData: info.lastData,
          isActive: true, // Already filtered to last 30 days
        });
      }
    }
    
    // Sort by last seen (most recent first)
    unusedDeviceIds.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
    
    return unusedDeviceIds;
  } catch (error) {
    // Error scanning for unused device IDs
    throw error;
  }
}

/**
 * Check availability of all stations by checking if they have recent data in Firebase
 * @param stations Array of weather stations to check
 * @returns Map of station IDs to their availability status and last seen timestamp
 */
export async function checkStationsAvailability(
  stations: Array<{ id: string; municipality: { name: string }; deviceId?: string }>
): Promise<Map<string, { isActive: boolean; lastSeen?: Date }>> {
  const availabilityMap = new Map<string, { isActive: boolean; lastSeen?: Date }>();
  
  try {
    const url = await buildFirebaseUrl(FIREBASE_RTDB_PATH);
    const response = await fetch(url);
    
    if (!response.ok) {
      // If fetch fails, mark all as inactive
      stations.forEach(station => {
        availabilityMap.set(station.id, { isActive: false });
      });
      return availabilityMap;
    }
    
    const data = await response.json();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // Consider active if data within last hour
    
    // Build a map of device IDs to their latest timestamps
    const deviceIdTimestamps = new Map<string, number>();
    
    // Parse all entries and find latest timestamp for each device ID
    for (const key in data) {
      const entry = data[key];
      if (entry) {
        let jsonData: ParsedWeatherData | null = null;
        
        if (entry.device_id || entry.temperature !== undefined) {
          const timestamp = entry.timestamp_ms 
            ? new Date(entry.timestamp_ms)
            : entry.timestamp 
            ? new Date(entry.timestamp)
            : null;
          
          if (timestamp && !isNaN(timestamp.getTime())) {
            jsonData = {
              temperature: entry.temperature || 0,
              humidity: entry.humidity || 0,
              windSpeedAvg: entry.wind_speed_avg || entry.wind_speed || 0,
              windSpeedMax: entry.wind_speed_max || entry.wind_speed || 0,
              windDirection: entry.wind_direction || 0,
              rainfallPeriod: entry.rainfall_period || 0,
              rainfallTotal: entry.rainfall_total || 0,
              signalStrength: entry.signal_strength || 0,
              samples: entry.samples || 0,
              timestamp,
              timestampMs: timestamp.getTime(),
              deviceId: entry.device_id || '',
            };
          }
        } else if (entry.key) {
          jsonData = parseFirebaseWeatherDataToJSON(entry.key);
        }
        
        if (jsonData && jsonData.deviceId && jsonData.timestamp) {
          const deviceId = jsonData.deviceId.trim().toUpperCase();
          const timestamp = jsonData.timestamp.getTime();
          
          const existing = deviceIdTimestamps.get(deviceId);
          if (!existing || timestamp > existing) {
            deviceIdTimestamps.set(deviceId, timestamp);
          }
        }
      }
    }
    
    // Check each station's availability
    for (const station of stations) {
      let isActive = false;
      let lastSeen: Date | undefined = undefined;
      
      if (station.deviceId) {
        // Custom station: check exact device ID
        const deviceIdUpper = station.deviceId.toUpperCase().trim();
        const timestamp = deviceIdTimestamps.get(deviceIdUpper);
        if (timestamp) {
          lastSeen = new Date(timestamp);
          isActive = timestamp >= oneHourAgo;
        }
      } else {
        // Base station: check municipality patterns
        const patterns = getDeviceIdPatternsForMunicipality(station.municipality.name);
        for (const pattern of patterns) {
          const patternUpper = pattern.toUpperCase();
          const timestamp = deviceIdTimestamps.get(patternUpper);
          if (timestamp) {
            if (!lastSeen || timestamp > lastSeen.getTime()) {
              lastSeen = new Date(timestamp);
            }
            if (timestamp >= oneHourAgo) {
              isActive = true;
            }
          }
        }
      }
      
      availabilityMap.set(station.id, { isActive, lastSeen });
    }
  } catch (error) {
    // On error, mark all as inactive
    stations.forEach(station => {
      availabilityMap.set(station.id, { isActive: false });
    });
  }
  
  return availabilityMap;
}

