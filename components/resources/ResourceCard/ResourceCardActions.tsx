import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

import { Resource } from '@/types/Resource';

import { styles } from './ResourceCard.styles';

interface ResourceCardActionsProps {
  resource: Resource;
  onBorrow: (resource: Resource) => void;
  onReturn: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onActionsMenuToggle: () => void;
  isActionsMenuOpen: boolean;
  colors: any;
}

export function ResourceCardActions({ 
  resource, 
  onBorrow, 
  onReturn, 
  onEdit,
  onDelete,
  onActionsMenuToggle, 
  isActionsMenuOpen, 
  colors 
}: ResourceCardActionsProps) {
  const isExternalResource = resource.resourceType === 'external';
  const isBorrowable = resource.isBorrowable !== false; // Default to true for backward compatibility

  return (
    <View style={styles.rightSection}>
      {!isExternalResource && isBorrowable && (
        <TouchableOpacity 
          style={[styles.primaryActionButton, { 
            backgroundColor: resource.availableQuantity > 0 ? colors.primary : colors.success 
          }]}
          onPress={() => resource.availableQuantity > 0 ? onBorrow(resource) : onReturn(resource)}
        >
          <Ionicons 
            name={resource.availableQuantity > 0 ? "cart-outline" : "return-down-back-outline"} 
            size={16} 
            color="#fff" 
          />
        </TouchableOpacity>
      )}
      
      {isExternalResource && (
        <View style={[styles.externalIndicator, { backgroundColor: '#FFB74D' + '20' }]}>
          <Ionicons name="business-outline" size={16} color="#FF8F00" />
        </View>
      )}
      
      {(onEdit || onDelete) && (
        <TouchableOpacity 
          style={[styles.menuButton, { 
            backgroundColor: isActionsMenuOpen ? colors.primary + '20' : colors.text + '15' 
          }]}
          onPress={onActionsMenuToggle}
        >
          <Ionicons 
            name="ellipsis-horizontal" 
            size={16} 
            color={isActionsMenuOpen ? colors.primary : colors.text} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
