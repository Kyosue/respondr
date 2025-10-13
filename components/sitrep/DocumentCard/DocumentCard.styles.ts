import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 16,
    width: 100, // Fixed width for consistent icon container size
    ...Platform.select({
      web: {
        marginBottom: 20,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 0,
    alignItems: 'center',
    marginBottom: 2,
    position: 'relative',
    ...Platform.select({
      web: {
        width: 100,
        height: 100,
        borderRadius: 24,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      },
    }),
  },
  backgroundIcon: {
    position: 'absolute',
    zIndex: 0,
  },
  fileTypeText: {
    marginTop: 40,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    backgroundColor: 'white',
    width: '62%',
    textAlign: 'center',
    zIndex: 1,
    ...Platform.select({
      web: {
        fontSize: 14,
      },
    }),
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 14,
    ...Platform.select({
      web: {
        fontSize: 14,
        maxWidth: 100,
        lineHeight: 16,
      },
      default: {
        maxWidth: 80,
      },
    }),
  },
});
