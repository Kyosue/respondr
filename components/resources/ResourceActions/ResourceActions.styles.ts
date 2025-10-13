import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  actionsMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0, 
    bottom: 0,
    zIndex: 1000,
  },
  actionsMenu: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    minWidth: 140,
    zIndex: 1002,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionMenuText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
});
