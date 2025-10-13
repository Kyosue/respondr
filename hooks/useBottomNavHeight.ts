import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook to calculate the height of the bottom navigation bar
 * This includes the height of the bar itself plus any insets (like iPhone home indicator)
 */
export function useBottomNavHeight() {
  const insets = useSafeAreaInsets();
  
  // Base height of the navigation bar
  const baseNavHeight = 70;
  
  // Calculate total height including insets
  const bottomNavHeight = Platform.OS === 'ios'
    ? baseNavHeight + (insets.bottom > 0 ? 0 : 10) // On iOS with notch, insets.bottom already accounts for space
    : baseNavHeight;
    
  return bottomNavHeight;
}
