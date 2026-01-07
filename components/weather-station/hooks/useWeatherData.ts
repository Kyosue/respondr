import { useCallback, useState } from 'react';
import { calculateRainfallAnalytics, RainfallAnalytics } from '@/services/pagasaAdvisoryService';
import { fetchWeatherData as fetchApiWeather, fetchHistoricalWeatherData } from '@/services/weatherApi';
import { WeatherStation } from '@/types/WeatherStation';
import { HistoricalDataPoint } from '../HistoricalDataView';
import { WeatherData } from '../WeatherMetrics';

/**
 * Custom hook for fetching and managing weather data
 */
export function useWeatherData(selectedStation: WeatherStation | null) {
  const [currentData, setCurrentData] = useState<WeatherData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [rainfallAnalytics, setRainfallAnalytics] = useState<RainfallAnalytics | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const transformHistoricalData = (historical: any[]): HistoricalDataPoint[] => {
    return historical.map(h => ({
      timestamp: h.timestamp,
      temperature: h.temperature,
      humidity: h.humidity,
      rainfall: h.rainfall,
      windSpeed: h.windSpeed,
      windDirection: h.windDirection || 0,
    }));
  };

  const updateAnalytics = (data: HistoricalDataPoint[]) => {
    const analytics = calculateRainfallAnalytics(data);
    setRainfallAnalytics(analytics);
  };

  const fetchWeatherData = useCallback(async (stationId: string, isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (!selectedStation) return;

      const municipalityName = selectedStation.municipality.name;
      const exactDeviceId = selectedStation.deviceId;
      
      // Fetch current weather data
      const current = await fetchApiWeather(municipalityName, exactDeviceId);
      
      if (current) {
        // Set current weather data
        setCurrentData({
          temperature: current.temperature,
          humidity: current.humidity,
          rainfall: current.rainfall,
          windSpeed: current.windSpeed,
          windDirection: current.windDirection || 0,
          lastUpdated: current.timestamp,
        });
        setIsConnected(true);

        // Fetch historical data (last 7 days)
        const historical = await fetchHistoricalWeatherData(municipalityName, exactDeviceId, 7);
        
        if (historical.length > 0) {
          const transformedHistorical = transformHistoricalData(historical);
          setHistoricalData(transformedHistorical);
          updateAnalytics(transformedHistorical);
        } else {
          // If no historical data, create a single point from current data
          const singlePoint = transformHistoricalData([current]);
          setHistoricalData(singlePoint);
          updateAnalytics(singlePoint);
        }
      } else {
        // If API call failed, clear all data
        setCurrentData(null);
        setHistoricalData([]);
        setRainfallAnalytics(null);
        setIsConnected(false);
      }
    } catch (error) {
      // Error fetching weather data - clear data to prevent showing stale data
      setCurrentData(null);
      setHistoricalData([]);
      setRainfallAnalytics(null);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedStation]);

  const clearData = () => {
    setCurrentData(null);
    setHistoricalData([]);
    setRainfallAnalytics(null);
  };

  const updateCurrentData = (data: WeatherData) => {
    setCurrentData(data);
    setIsConnected(true);
  };

  const updateHistoricalData = (data: HistoricalDataPoint[]) => {
    setHistoricalData(data);
    updateAnalytics(data);
  };

  return {
    currentData,
    historicalData,
    rainfallAnalytics,
    isConnected,
    isLoading,
    isRefreshing,
    fetchWeatherData,
    clearData,
    updateCurrentData,
    updateHistoricalData,
    setIsConnected,
  };
}

