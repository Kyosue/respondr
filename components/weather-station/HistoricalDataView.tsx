import { useState } from 'react';
import { HistoricalDataTable } from './HistoricalDataTable';

export interface HistoricalDataPoint {
  timestamp: Date;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
}

interface HistoricalDataViewProps {
  data: HistoricalDataPoint[];
  loading?: boolean;
}

type TimeRange = '1h' | '6h' | '24h' | '7d';

export function HistoricalDataView({ data, loading }: HistoricalDataViewProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('24h');

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
  ];

  const filterDataByRange = (range: TimeRange): HistoricalDataPoint[] => {
    const now = new Date();
    const cutoff = new Date();

    switch (range) {
      case '1h':
        cutoff.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoff.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoff.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
    }

    return data.filter(point => point.timestamp >= cutoff);
  };

  const filteredData = filterDataByRange(selectedRange);

  return (
    <HistoricalDataTable 
      data={filteredData} 
      loading={loading}
      selectedRange={selectedRange}
      onRangeChange={setSelectedRange}
      timeRanges={timeRanges}
    />
  );
}

