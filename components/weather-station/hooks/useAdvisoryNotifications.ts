import { useEffect, useRef } from 'react';
import { getUsersWithFilters } from '@/firebase/auth';
import { PAGASAAdvisory as PAGASAAdvisoryType, RainfallAnalytics } from '@/services/pagasaAdvisoryService';
import { notifyAdvisoryLevelChange } from '@/utils/notificationHelpers';
import { WeatherStation } from '@/types/WeatherStation';

/**
 * Custom hook for handling PAGASA advisory level change notifications
 */
export function useAdvisoryNotifications(
  rainfallAnalytics: RainfallAnalytics | null,
  selectedStation: WeatherStation | null
) {
  const previousCurrentAdvisory = useRef<PAGASAAdvisoryType | null>(null);
  const previousPredictedAdvisory = useRef<PAGASAAdvisoryType | null>(null);

  useEffect(() => {
    if (!rainfallAnalytics) return;

    const checkAndNotifyAdvisoryChange = async () => {
      try {
        const currentAdvisory = rainfallAnalytics.currentAdvisory;
        const predictedAdvisory = rainfallAnalytics.predictedAdvisory;
        const municipalityName = selectedStation?.municipality.name;

        // Check current advisory level change
        if (previousCurrentAdvisory.current) {
          const prev = previousCurrentAdvisory.current;
          const curr = currentAdvisory;
          
          // Only notify if level or color changed
          if (prev.level !== curr.level || prev.color !== curr.color) {
            const allActiveUsers = await getUsersWithFilters({ status: 'active' });
            const userIds = allActiveUsers.map(user => user.id);
            
            if (userIds.length > 0) {
              await notifyAdvisoryLevelChange(
                userIds,
                prev.level,
                prev.color,
                curr.level,
                curr.color,
                municipalityName,
                false // isPredicted = false for current advisory
              );
            }
          }
        }
        
        // Check predicted advisory level change (if available)
        if (predictedAdvisory && rainfallAnalytics.continuationPrediction.willContinue) {
          if (previousPredictedAdvisory.current) {
            const prev = previousPredictedAdvisory.current;
            const curr = predictedAdvisory;
            
            // Only notify if level or color changed
            if (prev.level !== curr.level || prev.color !== curr.color) {
              const allActiveUsers = await getUsersWithFilters({ status: 'active' });
              const userIds = allActiveUsers.map(user => user.id);
              
              if (userIds.length > 0) {
                await notifyAdvisoryLevelChange(
                  userIds,
                  prev.level,
                  prev.color,
                  curr.level,
                  curr.color,
                  municipalityName,
                  true // isPredicted = true for predicted advisory
                );
              }
            }
          }
        }
        
        // Update previous advisory levels
        previousCurrentAdvisory.current = { ...currentAdvisory };
        if (predictedAdvisory && rainfallAnalytics.continuationPrediction.willContinue) {
          previousPredictedAdvisory.current = { ...predictedAdvisory };
        } else {
          previousPredictedAdvisory.current = null;
        }
      } catch (error) {
        // Don't throw - this is a background notification process
      }
    };

    // Only check for changes after initial load (skip first render)
    if (previousCurrentAdvisory.current !== null || previousPredictedAdvisory.current !== null) {
      checkAndNotifyAdvisoryChange();
    } else {
      // Initialize previous values on first load (don't notify)
      previousCurrentAdvisory.current = { ...rainfallAnalytics.currentAdvisory };
      if (rainfallAnalytics.predictedAdvisory && rainfallAnalytics.continuationPrediction.willContinue) {
        previousPredictedAdvisory.current = { ...rainfallAnalytics.predictedAdvisory };
      }
    }
  }, [rainfallAnalytics, selectedStation]);

  const resetAdvisoryTracking = () => {
    previousCurrentAdvisory.current = null;
    previousPredictedAdvisory.current = null;
  };

  return { resetAdvisoryTracking };
}

