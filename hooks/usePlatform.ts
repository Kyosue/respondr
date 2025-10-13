import { useMemo } from 'react';
import { Platform } from 'react-native';

export function usePlatform() {
  return useMemo(() => ({
    isWeb: Platform.OS === 'web',
    isMobile: Platform.OS === 'ios' || Platform.OS === 'android',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    platform: Platform.OS,
  }), []);
}

export function usePlatformSelect<T>(options: {
  web?: T;
  ios?: T;
  android?: T;
  default?: T;
}): T | undefined {
  const { platform } = usePlatform();
  
  if (platform === 'web' && options.web !== undefined) return options.web;
  if (platform === 'ios' && options.ios !== undefined) return options.ios;
  if (platform === 'android' && options.android !== undefined) return options.android;
  return options.default;
}
