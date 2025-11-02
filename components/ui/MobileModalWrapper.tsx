import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * MobileModalSafeAreaWrapper - A reusable wrapper component for mobile modals
 * that handles safe area insets and status bar styling.
 * 
 * This component ensures modals:
 * - Don't overlap with the status bar
 * - Have proper contrast in dark/light modes
 * - Work correctly on iOS and Android
 * 
 * Usage:
 * ```tsx
 * <Modal>
 *   <MobileModalSafeAreaWrapper>
 *     <YourModalContent />
 *   </MobileModalSafeAreaWrapper>
 * </Modal>
 * ```
 */
interface MobileModalSafeAreaWrapperProps {
  children: ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function MobileModalSafeAreaWrapper({ 
  children, 
  backgroundColor,
  style 
}: MobileModalSafeAreaWrapperProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <SafeAreaView 
      style={[
        { flex: 1, backgroundColor: backgroundColor || colors.background }, 
        style
      ]} 
      edges={['top']}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </SafeAreaView>
  );
}

/**
 * MobileModalConfig - Helper to get consistent modal props for mobile
 */
export function getMobileModalConfig() {
  return {
    animationType: 'slide' as const,
    presentationStyle: Platform.OS === 'ios' ? ('pageSheet' as const) : ('fullScreen' as const),
  };
}

