import { usePlatform } from '@/hooks/usePlatform';
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  centerContent?: boolean;
}

export function ResponsiveContainer({ 
  children, 
  style, 
  maxWidth = 1200,
  centerContent = true 
}: ResponsiveContainerProps) {
  const { isWeb } = usePlatform();

  const containerStyle: ViewStyle = {
    ...(isWeb && {
      maxWidth,
      width: '100%',
      ...(centerContent && { alignSelf: 'center' }),
    }),
    ...style,
  };

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
}
