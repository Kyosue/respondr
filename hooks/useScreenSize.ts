import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useScreenSize(): ScreenSize {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const isMobile = dimensions.width < MOBILE_BREAKPOINT;
  const isTablet = dimensions.width >= MOBILE_BREAKPOINT && dimensions.width < TABLET_BREAKPOINT;
  const isDesktop = dimensions.width >= TABLET_BREAKPOINT;

  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile,
    isTablet,
    isDesktop,
  };
}

