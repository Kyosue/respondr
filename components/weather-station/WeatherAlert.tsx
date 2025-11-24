import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { WeatherData } from './WeatherMetrics';

export interface AlertThreshold {
  temperature?: { min: number; max: number };
  humidity?: { min: number; max: number };
  rainfall?: { max: number }; // Alert if exceeds
  windSpeed?: { max: number }; // Alert if exceeds
}

interface WeatherAlertProps {
  data: WeatherData | null;
  thresholds?: AlertThreshold;
  dismissedAlerts?: Set<string>;
  onDismiss?: (alertId: string) => void;
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

export function WeatherAlert({ data, thresholds, dismissedAlerts, onDismiss }: WeatherAlertProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const checkAlerts = (): Alert[] => {
    if (!data || !thresholds) return [];

    const alerts: Alert[] = [];

    // Temperature alerts
    if (thresholds.temperature) {
      if (data.temperature < thresholds.temperature.min) {
        alerts.push({
          id: 'temp-low',
          type: 'warning',
          message: `Temperature is below threshold (${thresholds.temperature.min}°C)`,
          metric: 'Temperature',
          value: data.temperature,
          threshold: thresholds.temperature.min,
        });
      }
      if (data.temperature > thresholds.temperature.max) {
        alerts.push({
          id: 'temp-high',
          type: 'critical',
          message: `Temperature exceeds threshold (${thresholds.temperature.max}°C)`,
          metric: 'Temperature',
          value: data.temperature,
          threshold: thresholds.temperature.max,
        });
      }
    }

    // Humidity alerts
    if (thresholds.humidity) {
      if (data.humidity < thresholds.humidity.min) {
        alerts.push({
          id: 'humidity-low',
          type: 'warning',
          message: `Humidity is below threshold (${thresholds.humidity.min}%)`,
          metric: 'Humidity',
          value: data.humidity,
          threshold: thresholds.humidity.min,
        });
      }
      if (data.humidity > thresholds.humidity.max) {
        alerts.push({
          id: 'humidity-high',
          type: 'critical',
          message: `Humidity exceeds threshold (${thresholds.humidity.max}%)`,
          metric: 'Humidity',
          value: data.humidity,
          threshold: thresholds.humidity.max,
        });
      }
    }

    // Rainfall alerts (critical if exceeds)
    if (thresholds.rainfall && data.rainfall > thresholds.rainfall.max) {
      alerts.push({
        id: 'rainfall-high',
        type: 'critical',
        message: `Heavy rainfall detected! Exceeds threshold (${thresholds.rainfall.max}mm)`,
        metric: 'Rainfall',
        value: data.rainfall,
        threshold: thresholds.rainfall.max,
      });
    }

    // Wind speed alerts (critical if exceeds)
    if (thresholds.windSpeed && data.windSpeed > thresholds.windSpeed.max) {
      alerts.push({
        id: 'wind-high',
        type: 'critical',
        message: `High wind speed detected! Exceeds threshold (${thresholds.windSpeed.max}km/h)`,
        metric: 'Wind Speed',
        value: data.windSpeed,
        threshold: thresholds.windSpeed.max,
      });
    }

    return alerts;
  };

  const allAlerts = checkAlerts();
  
  // Filter out dismissed alerts
  const alerts = dismissedAlerts
    ? allAlerts.filter(alert => !dismissedAlerts.has(alert.id))
    : allAlerts;

  if (alerts.length === 0) {
    return null;
  }

  // Sort alerts: critical first
  const sortedAlerts = alerts.sort((a, b) => {
    if (a.type === 'critical' && b.type !== 'critical') return -1;
    if (a.type !== 'critical' && b.type === 'critical') return 1;
    return 0;
  });

  return (
    <View style={styles.container}>
      {sortedAlerts.map((alert) => {
        const isCritical = alert.type === 'critical';
        const alertColor = isCritical ? colors.error : colors.warning || '#FF9800';
        const bgColor = isCritical 
          ? `${colors.error}15` 
          : `${colors.warning || '#FF9800'}15`;

        return (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              { 
                backgroundColor: bgColor,
                borderLeftColor: alertColor,
                borderColor: colors.border,
              }
            ]}
          >
            <View style={styles.alertContent}>
              <View style={styles.alertIconContainer}>
                <Ionicons
                  name={isCritical ? 'alert-circle' : 'warning'}
                  size={24}
                  color={alertColor}
                />
              </View>
              <View style={styles.alertTextContainer}>
                <ThemedText style={[styles.alertTitle, { color: alertColor }]}>
                  {isCritical ? 'Critical Alert' : 'Warning'}
                </ThemedText>
                <ThemedText style={[styles.alertMessage, { color: colors.text }]}>
                  {alert.message}
                </ThemedText>
                <ThemedText style={[styles.alertDetails, { color: colors.text, opacity: 0.7 }]}>
                  Current: {alert.value.toFixed(1)} | Threshold: {alert.threshold}
                </ThemedText>
              </View>
              {onDismiss && (
                <TouchableOpacity
                  onPress={() => onDismiss(alert.id)}
                  style={styles.dismissButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={colors.text} style={{ opacity: 0.5 }} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    gap: 12,
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 4,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertIconContainer: {
    marginTop: 2,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  alertMessage: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 21,
  },
  alertDetails: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
});

