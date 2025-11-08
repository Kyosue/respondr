import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  searchContainer: {
    marginBottom: 12,
  },
  searchInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    paddingLeft: 48,
    paddingRight: 48,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
      },
    }),
  },
  clearSearchButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
    padding: 4,
  },
});
