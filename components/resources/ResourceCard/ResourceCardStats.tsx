import { View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Resource } from '@/types/Resource';

import { styles } from './ResourceCard.styles';

interface ResourceCardStatsProps {
  resource: Resource;
  statusColor: string;
}

export function ResourceCardStats({ resource, statusColor }: ResourceCardStatsProps) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <ThemedText style={styles.statValue}>{resource.totalQuantity}</ThemedText>
        <ThemedText style={styles.statLabel}>TOTAL</ThemedText>
      </View>
      
      <View style={styles.statItem}>
        <ThemedText style={[styles.statValue, { color: statusColor }]}>
          {resource.availableQuantity}
        </ThemedText>
        <ThemedText style={styles.statLabel}>AVAILABLE</ThemedText>
      </View>
      
      <View style={styles.statItem}>
        <ThemedText style={styles.statValue}>
          {resource.totalQuantity - resource.availableQuantity}
        </ThemedText>
        <ThemedText style={styles.statLabel}>IN USE</ThemedText>
      </View>
    </View>
  );
}
