import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaintenanceUtils } from '@/utils/maintenanceUtils';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error';
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function SystemAlerts() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state } = useResources();

  const alerts: Alert[] = [];

  // Check for low stock resources
  const lowStockResources = state.resources.filter(resource => {
    if (resource.totalQuantity === 0) return false;
    const availabilityPercent = (resource.availableQuantity / resource.totalQuantity) * 100;
    return availabilityPercent < 10 && resource.availableQuantity > 0;
  });

  if (lowStockResources.length > 0) {
    alerts.push({
      id: 'low-stock',
      type: 'warning',
      message: `${lowStockResources.length} resource${lowStockResources.length > 1 ? 's' : ''} running low on stock`,
      icon: 'warning',
    });
  }

  // Check for maintenance due
  const maintenanceSchedule = MaintenanceUtils.getMaintenanceSchedule(state.resources);
  const maintenanceDue = maintenanceSchedule.filter(item => item.daysUntilDue <= 7 && item.daysUntilDue >= 0);

  if (maintenanceDue.length > 0) {
    alerts.push({
      id: 'maintenance',
      type: 'info',
      message: `${maintenanceDue.length} resource${maintenanceDue.length > 1 ? 's' : ''} due for maintenance`,
      icon: 'construct',
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'info':
        return '#3B82F6';
      default:
        return colors.text;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.text }]}>System Alerts</ThemedText>
      </View>
      <View style={styles.alertsList}>
        {alerts.map((alert) => {
          const alertColor = getAlertColor(alert.type);
          return (
            <View
              key={alert.id}
              style={[styles.alertItem, { backgroundColor: `${alertColor}15`, borderLeftColor: alertColor }]}
            >
              <Ionicons name={alert.icon} size={20} color={alertColor} />
              <ThemedText style={[styles.alertMessage, { color: colors.text }]}>
                {alert.message}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    ...(Platform.OS !== 'web' && {
      padding: 12,
      marginBottom: 16,
      borderRadius: 12,
    }),
  },
  header: {
    marginBottom: Platform.OS === 'web' ? 10 : 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  alertsList: {
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    gap: 10,
    ...(Platform.OS !== 'web' && {
      padding: 9,
      borderRadius: 8,
      gap: 8,
    }),
  },
  alertMessage: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Gabarito',
    ...(Platform.OS !== 'web' && {
      fontSize: 13,
      lineHeight: 18,
    }),
  },
});

