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
  municipalityName?: string; // Municipality name for device_id filtering
  onRefresh?: () => void;
}

export function HistoricalDataView({ data, loading, municipalityName, onRefresh }: HistoricalDataViewProps) {
  // If no data is provided or data is empty, let HistoricalDataTable fetch from Firebase
  // Pass data directly without any filtering or sampling
  return (
    <HistoricalDataTable 
      data={data.length > 0 ? data : undefined} 
      loading={loading}
      municipalityName={municipalityName}
      onRefresh={onRefresh}
    />
  );
}

