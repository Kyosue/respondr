import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a', // Modern dark slate background
    borderRadius: 16,
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    // Subtle border for depth
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    }),
  },
  canvas: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
  },
  zoomControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    // Modern glassmorphism effect
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      default: {},
    }),
  },
  zoomButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glassmorphism background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Modern shadow
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  zoomButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    backgroundColor: 'rgba(59, 130, 246, 0.9)', // Modern blue with transparency
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    // Modern shadow
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)',
        transition: 'all 0.2s ease',
      },
      default: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
});

