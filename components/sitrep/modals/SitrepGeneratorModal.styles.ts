import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';

interface Colors {
  background: string;
  surface: string;
  text: string;
  border: string;
  primary: string;
}

export const createStyles = (colors: Colors) => {
  return StyleSheet.create({
    // ScrollView
    scrollView: {
      flex: 1,
      ...(Platform.OS === 'web' && {
        overflow: 'visible',
      } as any),
    },
    scrollViewContent: {
      padding: 24,
      backgroundColor: colors.background,
      ...(Platform.OS === 'web' && {
        overflow: 'visible',
      } as any),
    },

    // Operation Selector
    operationSelectorContainer: {
      marginBottom: 14,
      position: 'relative',
      zIndex: 10000,
    },
    operationSelectorWrapper: {
      position: 'relative',
      zIndex: 10000,
      elevation: 10000,
      ...(Platform.OS === 'web' && {
        isolation: 'isolate',
      } as any),
    },
    operationSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      } as any),
    },
    operationSelectorText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    operationDropdownBackdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'transparent',
    },
    operationDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 4,
      borderWidth: 1.5,
      borderRadius: 10,
      maxHeight: 300,
      zIndex: 10001,
      elevation: 10001,
      ...(Platform.OS === 'web' && {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        position: 'absolute',
      } as any),
    },
    operationDropdownScroll: {
      maxHeight: 300,
    },
    operationDropdownItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    operationDropdownItemText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    operationDropdownItemSubtext: {
      fontSize: 14,
      color: colors.text + '80',
    },
    operationDropdownEmpty: {
      padding: 16,
      textAlign: 'center',
      fontSize: 14,
    },

    // Tabs
    tabsContainer: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 24,
      paddingBottom: 4,
      position: 'relative',
      zIndex: 1,
    },
    tabsScrollView: {
      flexGrow: 0,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 4,
    },
    tabButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    tabButtonActive: {
      borderBottomWidth: 2,
      borderBottomColor: '#dc2626',
    },
    tabButtonInactive: {
      borderBottomWidth: 0,
      borderBottomColor: 'transparent',
    },
    tabText: {
      fontWeight: '600',
      textTransform: 'capitalize',
      fontSize: 16,
    },
    tabTextActive: {
      color: '#dc2626',
    },
    tabTextInactive: {
      color: colors.text,
    },

    // Form sections
    section: {
      gap: 24,
    },
    sectionLarge: {
      gap: 32,
    },
    sectionTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.text,
    },
    sectionSubtitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 10,
      color: colors.text,
    },

    // Form fields
    formRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    formField: {
      flex: 1,
      minWidth: '45%',
    },
    textInput: {
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      ...(Platform.OS === 'web' && {
        transition: 'all 0.2s ease',
      } as any),
    },
    textInputMultiline: {
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      textAlignVertical: 'top',
      minHeight: 150,
      ...(Platform.OS === 'web' && {
        transition: 'all 0.2s ease',
      } as any),
    },
    textInputNested: {
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      fontSize: 16,
      backgroundColor: colors.background,
      color: colors.text,
      ...(Platform.OS === 'web' && {
        transition: 'all 0.2s ease',
      } as any),
    },
    textInputFlex: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      ...(Platform.OS === 'web' && {
        transition: 'all 0.2s ease',
      } as any),
    },

    // Buttons
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#16a34a',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      ...(Platform.OS === 'web' && {
        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
        transition: 'all 0.2s ease',
      } as any),
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2563eb',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      ...(Platform.OS === 'web' && {
        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
        transition: 'all 0.2s ease',
      } as any),
    },
    exportButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
      marginLeft: 6,
    },
    closeButton: {
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        transition: 'all 0.2s ease',
      } as any),
    },
    deleteButton: {
      padding: 10,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    deleteButtonArea: {
      marginTop: 32,
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    imageDeleteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#dc2626',
      padding: 8,
      borderRadius: 20,
      ...(Platform.OS === 'web' && {
        boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
      } as any),
    },
    primaryButton: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
      ...(Platform.OS === 'web' && {
        boxShadow: '0 2px 4px rgba(67, 97, 238, 0.2)',
        transition: 'all 0.2s ease',
      } as any),
    },
    primaryButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },

    // Item containers
    itemContainer: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'flex-start',
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: 20,
      borderRadius: 12,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      } as any),
    },
    itemRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
      alignItems: 'center',
    },
    itemRowFlex: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    personnelDivider: {
      width: 1,
      height: 32,
      opacity: 0.3,
    },
    personnelBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1.5,
      minWidth: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    personnelBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    itemContent: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    itemHeaderWithMargin: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },

    // Image upload
    imageUploadSection: {
      borderTopWidth: 1.5,
      borderTopColor: colors.border,
      paddingTop: 28,
      marginTop: 28,
    },
    imageUploadButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: 32,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      } as any),
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 20,
    },
    imageItem: {
      position: 'relative',
      width: '30%',
      minWidth: 100,
      borderRadius: 12,
      overflow: 'hidden',
      ...(Platform.OS === 'web' && {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      } as any),
    },
    image: {
      width: '100%',
      height: 160,
      borderRadius: 12,
    },
    imageName: {
      fontSize: 14,
      marginTop: 4,
    },
    imageUploadText: {
      fontSize: 16,
      marginTop: 8,
    },
    imageUploadSubtext: {
      fontSize: 14,
      marginTop: 4,
      opacity: 0.7,
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalOverlayWeb: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 24,
      maxWidth: 400,
      width: '100%',
    },
    modalContainerWeb: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: '85%',
      overflow: 'hidden',
      ...(Platform.OS === 'web' && {
        maxWidth: 1000,
        maxHeight: '95vh' as any,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      } as any),
    },
    modalContent: {
      flex: 1,
      ...(Platform.OS === 'web' && {
        maxHeight: '95vh' as any,
        overflow: 'visible',
        position: 'relative',
      } as any),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
      ...(Platform.OS === 'web' && {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      } as any),
    },
    modalHeaderTitle: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    modalHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      opacity: 0.7,
    },

    // Text styles
    textTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    textSubtitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    textLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    textSmall: {
      fontSize: 14,
    },
    textWhite: {
      color: '#fff',
    },
  });
};

// Helper function to get placeholder text color
export const getPlaceholderColor = (textColor: string) => `${textColor}80`;

// Helper function to get tab button style
export const getTabButtonStyle = (isActive: boolean, colors: { primary: string; surface: string }): ViewStyle => ({
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderBottomWidth: isActive ? 3 : 0,
  borderBottomColor: isActive ? colors.primary : 'transparent',
  borderRadius: 8,
  marginBottom: -1,
  ...(Platform.OS === 'web' && {
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? colors.surface : 'transparent',
  } as any),
});

// Helper function to get tab text style
export const getTabTextStyle = (isActive: boolean, textColor: string, primaryColor: string): TextStyle => ({
  fontWeight: isActive ? '700' : '600',
  textTransform: 'capitalize',
  fontSize: 16,
  color: isActive ? primaryColor : textColor,
  letterSpacing: 0.3,
});

