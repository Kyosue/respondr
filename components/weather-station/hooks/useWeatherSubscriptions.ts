import { useEffect, useRef } from 'react';
import { subscribeToHistoricalWeatherUpdates, subscribeToWeatherUpdates } from '@/services/weatherApi';
import { WeatherStation } from '@/types/WeatherStation';
import { HistoricalDataPoint } from '../HistoricalDataView';
import { WeatherData } from '../WeatherMetrics';

/**
 * Custom hook for managing real-time weather data subscriptions
 */
export function useWeatherSubscriptions(
  selectedStation: WeatherStation | null,
  onCurrentDataUpdate: (data: WeatherData) => void,
  onHistoricalDataUpdate: (data: HistoricalDataPoint[]) => void,
  onConnectionChange: (connected: boolean) => void,
  onStationStatusUpdate: (stationId: string, updates: { isActive: boolean; lastSeen: Date; apiAvailable: boolean }) => void
) {
  const selectedStationRef = useRef(selectedStation);
  
  useEffect(() => {
    selectedStationRef.current = selectedStation;
  }, [selectedStation]);

  useEffect(() => {
    if (!selectedStation) return;

    const municipalityName = selectedStation.municipality.name;
    const exactDeviceId = selectedStation.deviceId;
    
    // Set up real-time listener for current weather data
    const unsubscribeCurrent = subscribeToWeatherUpdates(
      municipalityName,
      exactDeviceId,
      (data) => {
        // Update current weather data when new data is detected
        onCurrentDataUpdate({
          temperature: data.temperature,
          humidity: data.humidity,
          rainfall: data.rainfall,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection || 0,
          lastUpdated: data.timestamp,
        });
        onConnectionChange(true);
        
        // Update station status
        const currentStation = selectedStationRef.current;
        if (currentStation) {
          onStationStatusUpdate(currentStation.id, {
            isActive: true,
            lastSeen: data.timestamp,
            apiAvailable: true,
          });
        }
      },
      (error) => {
        onConnectionChange(false);
      }
    );

    // Set up real-time listener for historical data
    const unsubscribeHistorical = subscribeToHistoricalWeatherUpdates(
      municipalityName,
      exactDeviceId,
      (historicalData) => {
        if (historicalData.length > 0) {
          // Transform historical data to match expected format
          const transformedHistorical = historicalData.map(h => ({
            timestamp: h.timestamp,
            temperature: h.temperature,
            humidity: h.humidity,
            rainfall: h.rainfall,
            windSpeed: h.windSpeed,
            windDirection: h.windDirection || 0,
          }));
          
          // Update historical data (analytics will be calculated by parent)
          onHistoricalDataUpdate(transformedHistorical);
        }
      },
      (error) => {
        // Historical listener error
      }
    );

    // Cleanup: unsubscribe when station changes or component unmounts
    return () => {
      unsubscribeCurrent();
      unsubscribeHistorical();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStation?.id]); // Only re-subscribe when station ID changes
}

