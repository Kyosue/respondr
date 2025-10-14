import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Dimensions, Platform, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Resource } from '@/types/Resource';

import { styles } from './ResourceActions.styles';

interface ResourceActionsMenuProps {
  visible: boolean;
  resource: Resource | null;
  cardPosition?: { x: number; y: number; width: number; height: number };
  onClose: () => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
}

export function ResourceActionsMenu({
  visible,
  resource,
  cardPosition,
  onClose,
  onEdit,
  onDelete
}: ResourceActionsMenuProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!visible || !resource) return null;

  // Calculate menu position based on card position
  const getMenuPosition = () => {
    if (!cardPosition) {
      // Fallback to original position if no card position provided
      return { top: 100, right: 20 };
    }

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const { x, y, width, height } = cardPosition;
    const menuWidth = 140; // minWidth from styles
    const menuHeight = 120; // Approximate height for 3 menu items
    const padding = 20;

    // Position menu to the right of the card, aligned with the ellipsis button
    // The ellipsis button is typically in the bottom-right of the card's right section
    // We'll position the menu to appear near the ellipsis button
    let top = y + height - 260; // Position near the bottom of the card where the ellipsis button is
    let right = screenWidth - x - width - menuWidth - 10; // 10px gap from card

    // If there's not enough space to the right, position to the left of the card
    if (right < padding) {
      right = x - menuWidth - 10; // 10px gap from card
    }

    // Ensure minimum padding from screen edges
    right = Math.max(padding, Math.min(right, screenWidth - menuWidth - padding));

    // Adjust if menu would go off screen vertically
    if (top + menuHeight > screenHeight) {
      top = Math.max(padding, screenHeight - menuHeight - padding);
    }
    if (top < padding) {
      top = padding;
    }

    return { top, right };
  };

  const menuPosition = getMenuPosition();

  return (
    <TouchableOpacity 
      style={styles.actionsMenuOverlay}
      onPress={onClose}
      activeOpacity={1}
    >
      <BlurView
        intensity={75}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={styles.blurBackground}
      />
      <TouchableOpacity 
        style={[styles.actionsMenu, { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          top: menuPosition.top,
          right: menuPosition.right,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        }]}
        onPress={(e) => e.stopPropagation()}
        activeOpacity={1}
      >
        {onEdit && (
          <TouchableOpacity 
            style={styles.actionMenuItem}
            onPress={() => {
              onClose();
              onEdit(resource);
            }}
          >
            <Ionicons name="create-outline" size={16} color="#3B82F6" />
            <ThemedText style={styles.actionMenuText}>Edit</ThemedText>
          </TouchableOpacity>
        )}
        
        {onDelete && (
          <TouchableOpacity 
            style={styles.actionMenuItem}
            onPress={() => {
              onClose();
              onDelete(resource);
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <ThemedText style={styles.actionMenuText}>Delete</ThemedText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
