import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MaintenanceUtils } from '@/utils/maintenanceUtils';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

export function ResourceStatus() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state } = useResources();

  // Calculate stats directly from resources (more reliable than waiting for stats to be set)
  // Use total quantities, not resource count
  const totalQuantity = state.resources.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);
  const availableQuantity = state.resources.reduce((sum, r) => sum + (r.availableQuantity || 0), 0);
  const borrowedQuantity = state.resources.reduce((sum, r) => sum + ((r.totalQuantity || 0) - (r.availableQuantity || 0)), 0);
  
  const utilizationPercentage = totalQuantity > 0 
    ? Math.round((borrowedQuantity / totalQuantity) * 100)
    : 0;
  const availabilityPercentage = totalQuantity > 0
    ? Math.round((availableQuantity / totalQuantity) * 100)
    : 0;

  // Get resources due for maintenance
  const maintenanceSchedule = MaintenanceUtils.getMaintenanceSchedule(state.resources);
  const maintenanceDue = maintenanceSchedule
    .filter(item => item.daysUntilDue <= 7 && item.daysUntilDue >= 0)
    .slice(0, 5);

  // Get low stock resources (less than 10% available)
  const lowStockResources = state.resources
    .filter(resource => {
      if (resource.totalQuantity === 0) return false;
      const availabilityPercent = (resource.availableQuantity / resource.totalQuantity) * 100;
      return availabilityPercent < 10 && resource.availableQuantity > 0;
    })
    .slice(0, 3);

  const { isMobile } = useScreenSize();
  
  return (
    <ThemedView style={[styles.card, isMobile && styles.cardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerSection}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="cube" size={20} color={colors.success} />
          </View>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Resource Status
          </ThemedText>
        </View>
      </View>

      {/* Resource Availability */}
      <View style={styles.section}>
        <View style={styles.progressHeader}>
          <ThemedText style={[styles.progressLabel, { color: colors.text }]}>
            Availability
          </ThemedText>
          <ThemedText style={[styles.progressValue, { color: colors.primary }]}>
            {availabilityPercentage}%
          </ThemedText>
        </View>
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${availabilityPercentage}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
        <View style={styles.progressStats}>
          <ThemedText style={[styles.progressStatText, { color: colors.text, opacity: 0.7 }]}>
            {availableQuantity} available
          </ThemedText>
          <ThemedText style={[styles.progressStatText, { color: colors.text, opacity: 0.7 }]}>
            {borrowedQuantity} in use
          </ThemedText>
        </View>
      </View>

      {/* Maintenance Alerts */}
      {maintenanceDue.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={[styles.alertTitle, { color: colors.warning }]}>
            Maintenance Due
          </ThemedText>
          {maintenanceDue.map((item) => (
            <View key={item.resourceId} style={styles.alertItem}>
              <ThemedText
                style={[styles.alertItemText, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.resourceName}
              </ThemedText>
              <ThemedText style={[styles.alertItemMeta, { color: colors.text, opacity: 0.7 }]}>
                {item.daysUntilDue === 0 ? 'Today' : `${item.daysUntilDue}d`}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Low Stock Warnings */}
      {lowStockResources.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={[styles.alertTitle, { color: colors.error }]}>
            Low Stock
          </ThemedText>
          {lowStockResources.map((resource) => (
            <View key={resource.id} style={styles.alertItem}>
              <ThemedText
                style={[styles.alertItemText, { color: colors.text }]}
                numberOfLines={1}
              >
                {resource.name}
              </ThemedText>
              <ThemedText style={[styles.alertItemMeta, { color: colors.text, opacity: 0.7 }]}>
                {resource.availableQuantity} left
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {maintenanceDue.length === 0 && lowStockResources.length === 0 && (
        <ThemedText style={[styles.emptyText, { color: colors.text, opacity: 0.6 }]}>
          All resources in good condition
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardMobile: {
    padding: 16,
    marginBottom: 16,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  section: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Gabarito',
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStatText: {
    fontSize: 12,
    fontFamily: 'Gabarito',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Gabarito',
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  alertItemText: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
    fontFamily: 'Gabarito',
    fontWeight: '500',
  },
  alertItemMeta: {
    fontSize: 12,
    fontFamily: 'Gabarito',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: 'Gabarito',
  },
});

