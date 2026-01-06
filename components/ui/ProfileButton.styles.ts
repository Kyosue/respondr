import { Dimensions, Platform, StyleSheet } from 'react-native';

export const profileButtonStyles = StyleSheet.create({
  profileContainer: {
    position: 'relative',
    ...Platform.select({
      web: {
        zIndex: 1000,
      },
    }),
  },
  buttonWrapper: {
    position: 'relative',
  },
  profileButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chevronIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  chevronIconBackground: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontWeight: 'bold',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      web: {
        position: 'fixed',
        zIndex: 99998,
        pointerEvents: 'auto',
      },
      default: {
        zIndex: 999,
      },
    }),
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  profileContainerWrapper: {
    position: 'relative',
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        zIndex: 100000,
        pointerEvents: 'auto',
      },
    }),
  },
  profileContainerWrapperSplit: {
    ...Platform.select({
      web: {
        gap: 16,
      },
    }),
  },
  profileDropdown: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        zIndex: 100000,
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
      },
      ios: {
        right: 0,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        right: 0,
        zIndex: 1000,
        elevation: 12,
      },
    }),
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        paddingHorizontal: 20,
        paddingVertical: 18,
      },
      default: {
        paddingHorizontal: 16,
        paddingVertical: 14,
      },
    }),
  },
  headerDivider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    marginRight: 12,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContent: {
    ...Platform.select({
      web: {
        flexGrow: 0, // Don't grow beyond content
        flexShrink: 1, // Allow shrinking if needed
      },
      default: {
        flex: 1,
      },
    }),
  },
  profileContentContainer: {
    flexGrow: 0, // Don't grow beyond content
    flexShrink: 1, // Allow shrinking if needed
  },
  profileHeaderSection: {
    alignItems: 'center',
    paddingVertical: 24,
    ...Platform.select({
      web: {
        paddingHorizontal: 20,
      },
      default: {
        paddingHorizontal: 16,
      },
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  profileAvatarText: {
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonAvatarImage: {
    resizeMode: 'cover',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  userTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileDetailsSection: {
    ...Platform.select({
      web: {
        paddingHorizontal: 20,
      },
      default: {
        paddingHorizontal: 16,
      },
    }),
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        minHeight: 56,
      },
      default: {
        minHeight: 50,
      },
    }),
  },
  detailItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsSection: {
    paddingVertical: 20,
    ...Platform.select({
      web: {
        paddingHorizontal: 20,
      },
      default: {
        paddingHorizontal: 16,
      },
    }),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  editProfileButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  editModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999999,
      },
    }),
  },
  editModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  editModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '80%',
    ...Platform.select({
      web: {
        zIndex: 1000000,
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  editModalCloseButton: {
    padding: 4,
  },
  editProfilePanel: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 400,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        zIndex: 99999, // Lower than profile dropdown (100000) so it appears behind
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: Dimensions.get('window').height - 32, // Allow scrolling if content is too tall
        pointerEvents: 'auto',
      },
    }),
  },
  editModalBody: {
    padding: 20,
    flexGrow: 0, // Don't grow beyond content
    flexShrink: 1, // Allow shrinking if needed
  },
  editInputContainer: {
    marginBottom: 20,
  },
  editInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  editInputError: {
    fontSize: 12,
    marginTop: 4,
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  editModalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  editModalSaveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

