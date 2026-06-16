import { HistoricalDataPoint } from '../HistoricalDataView';
import { degreesToCardinal } from '../WeatherMetrics';
import { toISODateString } from './filterHistoricalDataByDateRange';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { saveAs } from 'file-saver';
import { Platform } from 'react-native';
import * as XLSX from 'xlsx';

const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildFilename(
  stationName?: string,
  dateRange?: { start: Date; end: Date }
): string {
  const stationPart = stationName
    ? sanitizeFilenamePart(stationName)
    : 'weather-station';

  if (dateRange) {
    const startPart = toISODateString(dateRange.start);
    const endPart = toISODateString(dateRange.end);
    return `${stationPart}-weather-history-${startPart}-to-${endPart}.xlsx`;
  }

  const datePart = toISODateString(new Date());
  return `${stationPart}-weather-history-${datePart}.xlsx`;
}

function buildWorkbook(data: HistoricalDataPoint[]): XLSX.WorkBook {
  const sorted = [...data].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const rows = sorted.map((point) => ({
    'Date & Time': formatDateTime(point.timestamp),
    'Temperature (°C)': Number(point.temperature.toFixed(1)),
    'Humidity (%)': Number(point.humidity.toFixed(0)),
    'Rainfall (mm)': Number(point.rainfall.toFixed(1)),
    'Wind Speed (km/h)': Number(point.windSpeed.toFixed(1)),
    'Wind Direction': degreesToCardinal(point.windDirection || 0),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historical Data');
  return workbook;
}

export async function exportHistoricalWeatherToExcel(
  data: HistoricalDataPoint[],
  stationName?: string,
  dateRange?: { start: Date; end: Date }
): Promise<void> {
  if (!data.length) {
    throw new Error('No historical data to export');
  }

  const workbook = buildWorkbook(data);
  const filename = buildFilename(stationName, dateRange);

  if (Platform.OS === 'web') {
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: EXCEL_MIME });
    saveAs(blob, filename);
    return;
  }

  const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: EXCEL_MIME,
    dialogTitle: 'Export Weather History',
    UTI: 'com.microsoft.excel.xlsx',
  });
}
