import { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

interface UseHybridRampOptions {
  visible: boolean;
  onClose: () => void;
}

interface UseHybridRampReturn {
  // Platform detection
  isWeb: boolean;
  screenWidth: number;
  
  // Animation values
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  slideAnim: Animated.Value;
  
  // Animation handlers
  handleClose: () => void;
  startEnterAnimation: () => void;
  startExitAnimation: (callback?: () => void) => void;
}

/**
 * Custom hook for Hybrid RAMP (Responsive Animated Modal Pattern)
 * Provides platform detection, animation values, and handlers for modal animations
 */
export function useHybridRamp({ visible, onClose }: UseHybridRampOptions): UseHybridRampReturn {
  // Platform detection
  const { width: screenWidth } = Dimensions.get('window');
  const isWeb = screenWidth > 768;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Start enter animation
  const startEnterAnimation = () => {
    // Reset animation values
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    slideAnim.setValue(50);
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Start exit animation
  const startExitAnimation = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 50, duration: 200, useNativeDriver: true }),
    ]).start(callback);
  };

  // Handle close with platform-specific behavior
  const handleClose = () => {
    if (isWeb) {
      // Animate out before closing
      startExitAnimation(onClose);
    } else {
      // Mobile: immediate close
      onClose();
    }
  };

  // Animation effects
  useEffect(() => {
    if (visible && isWeb) {
      startEnterAnimation();
    }
  }, [visible, isWeb]);

  return {
    isWeb,
    screenWidth,
    fadeAnim,
    scaleAnim,
    slideAnim,
    handleClose,
    startEnterAnimation,
    startExitAnimation,
  };
}
