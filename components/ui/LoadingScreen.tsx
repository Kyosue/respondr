import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LoadingScreenProps {
  message?: string;
}

const { width, height } = Dimensions.get('window');
const logoSize = Math.min(width * 0.25, 120);

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Scale animation for logo
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Continuous rotation for spinner
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    // Pulse animation for decorative circles
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Second pulse animation (offset for variety)
    const pulseAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim2, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim2, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation2.start();

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
      pulseAnimation2.stop();
    };
  }, [fadeAnim, scaleAnim, rotateAnim, pulseAnim, pulseAnim2]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={isDark ? 
          ['#121212', '#1E1E1E', '#121212'] : 
          [colors.background, '#f5f7fa', colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Decorative elements */}
      <View style={styles.decorationContainer}>
        <Animated.View 
          style={[
            styles.decorationCircle, 
            { 
              backgroundColor: `${colors.primary}15`,
              transform: [{ scale: pulseAnim }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.decorationCircle, 
            styles.decorationCircle2, 
            { 
              backgroundColor: `${colors.secondary}10`,
              transform: [{ scale: pulseAnim2 }]
            }
          ]} 
        />
      </View>

      {/* Main content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },  
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/respondr-1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Name */}
        <ThemedText type="title" style={[styles.appName, { color: colors.text }]}>
          Respondr
        </ThemedText>

        {/* Loading spinner */}
        <View style={styles.spinnerContainer}>
          <Animated.View
            style={[
              styles.spinnerWrapper,
              {
                transform: [{ rotate: rotation }],
              },
            ]}
          >
            <Ionicons 
              name="sync" 
              size={32} 
              color={colors.primary} 
              style={styles.spinner}
            />
          </Animated.View>
        </View>

        {/* Loading message */}
        <ThemedText style={[styles.message, { color: colors.text, opacity: 0.7 }]}>
          {message}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorationContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.6,
  },
  decorationCircle2: {
    top: '20%',
    right: '10%',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoContainer: {
    width: logoSize,
    height: logoSize,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  spinnerContainer: {
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    // Spinner icon
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

