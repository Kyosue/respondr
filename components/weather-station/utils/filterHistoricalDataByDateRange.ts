import { HistoricalDataPoint } from '../HistoricalDataView';

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDataDateBounds(
  data: HistoricalDataPoint[]
): { min: Date; max: Date } | null {
  if (data.length === 0) {
    return null;
  }

  let min = data[0].timestamp;
  let max = data[0].timestamp;

  for (const point of data) {
    if (point.timestamp < min) {
      min = point.timestamp;
    }
    if (point.timestamp > max) {
      max = point.timestamp;
    }
  }

  return {
    min: startOfDay(min),
    max: startOfDay(max),
  };
}

export function filterHistoricalDataByDateRange(
  data: HistoricalDataPoint[],
  startDate: Date,
  endDate: Date
): HistoricalDataPoint[] {
  const rangeStart = startOfDay(startDate).getTime();
  const rangeEnd = endOfDay(endDate).getTime();

  return data.filter((point) => {
    const time = point.timestamp.getTime();
    return time >= rangeStart && time <= rangeEnd;
  });
}

export function clampDateToBounds(
  date: Date,
  min: Date,
  max: Date
): Date {
  const time = startOfDay(date).getTime();
  const minTime = startOfDay(min).getTime();
  const maxTime = startOfDay(max).getTime();

  if (time < minTime) {
    return startOfDay(min);
  }
  if (time > maxTime) {
    return startOfDay(max);
  }
  return startOfDay(date);
}
