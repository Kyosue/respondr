import { useState } from 'react';
import { HistoricalDataTable } from './HistoricalDataTable';

export interface HistoricalDataPoint {
  timestamp: Date;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  windDirection: number; // degrees (0-360)
}

interface HistoricalDataViewProps {
  data: HistoricalDataPoint[];
  loading?: boolean;
  onRefresh?: () => void;
}

type TimeRange = '10m' | '1h' | '6h' | '24h' | '3d';

export function HistoricalDataView({ data, loading, onRefresh }: HistoricalDataViewProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('10m');

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '10m', label: '10 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '3d', label: '3 Days' },
  ];

  const sampleDataByInterval = (range: TimeRange): HistoricalDataPoint[] => {
    if (data.length === 0) return [];

    // Sort data by timestamp (oldest first for proper sampling)
    const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    let intervalMs: number;
    
    switch (range) {
      case '10m':
        // Sample one data point every 10 minutes
        intervalMs = 10 * 60 * 1000; // 10 minutes in milliseconds
        break;
      case '1h':
        // Sample one data point every 1 hour
        intervalMs = 60 * 60 * 1000; // 1 hour in milliseconds
        break;
      case '6h':
        // Sample one data point every 6 hours
        intervalMs = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
        break;
      case '24h':
        // Sample one data point every 24 hours (daily)
        intervalMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        break;
      case '3d':
        // Sample one data point every 3 days
        intervalMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
        break;
    }

    const sampledData: HistoricalDataPoint[] = [];
    let lastSampledTime: number | null = null;

    // Iterate through sorted data and sample at specified intervals
    for (const point of sortedData) {
      const pointTime = point.timestamp.getTime();
      
      // If this is the first point or enough time has passed since last sample
      if (lastSampledTime === null || (pointTime - lastSampledTime) >= intervalMs) {
        sampledData.push(point);
        lastSampledTime = pointTime;
      }
    }

    // Return sampled data, sorted by newest first
    return sampledData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const filteredData = sampleDataByInterval(selectedRange);

  return (
    <HistoricalDataTable 
      data={filteredData} 
      loading={loading}
      selectedRange={selectedRange}
      onRangeChange={setSelectedRange}
      timeRanges={timeRanges}
      onRefresh={onRefresh}
    />
  );
}

