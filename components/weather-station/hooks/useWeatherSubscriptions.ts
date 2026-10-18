import { useEffect, useRef } from 'react';
import { isMatiCity, STATION_DATA_STALE_AFTER_MS, subscribeToHistoricalWeatherUpdates, subscribeToWeatherUpdates } from '@/services/weatherApi';
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
  onStationStatusUpdate: (stationId: string, updates: { isActive: boolean; lastSeen?: Date; apiAvailable: boolean }) => void
) {
  const selectedStationRef = useRef(selectedStation);
  
  useEffect(() => {
    selectedStationRef.current = selectedStation;
  }, [selectedStation]);

  useEffect(() => {
    if (!selectedStation) return;

    const municipalityName = selectedStation.municipality.name;
    const exactDeviceId = selectedStation.deviceId;
    const hasStationSource = isMatiCity(municipalityName) || Boolean(exactDeviceId);
    
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
          dataSource: data.source,
        });
        onConnectionChange(true);
        
        // Only Firebase readings indicate physical station activity. Forecast
        // data keeps weather available without making an offline station appear online.
        const currentStation = selectedStationRef.current;
        if (currentStation) {
          if (!hasStationSource) {
            onStationStatusUpdate(currentStation.id, {
              isActive: true,
              lastSeen: data.timestamp,
              apiAvailable: true,
            });
          } else if (data.source === 'firebase') {
            const isFresh = Date.now() - data.timestamp.getTime() < STATION_DATA_STALE_AFTER_MS;
            onStationStatusUpdate(currentStation.id, {
              isActive: isFresh,
              lastSeen: data.timestamp,
              apiAvailable: isFresh,
            });
          } else {
            onStationStatusUpdate(currentStation.id, {
              isActive: false,
              apiAvailable: false,
            });
          }
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

