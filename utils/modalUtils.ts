import { ModalProps, Platform } from 'react-native';

type ModalPresentationStyle = NonNullable<ModalProps['presentationStyle']>;

/**
 * Platform-specific modal configuration
 * Ensures consistent modal behavior across iOS and Android
 */
export const getModalConfig = (): Pick<ModalProps, 'animationType' | 'presentationStyle'> => ({
  animationType: 'slide',
  presentationStyle: Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen',
});

/**
 * Platform-specific alert configuration
 * Ensures consistent alert behavior across platforms
 */
export const getAlertConfig = (cancelable: boolean = false) => ({
  cancelable,
});

/**
 * Success alert handler with proper callback ordering
 * Ensures modal closes before triggering success callback
 */
export const showSuccessAlert = (
  title: string,
  message: string,
  onPress: () => void,
  delay: number = 100
) => {
  return {
    title,
    message,
    buttons: [
      {
        text: 'OK',
        onPress: () => {
          setTimeout(() => {
            onPress();
          }, delay);
        }
      }
    ],
    options: getAlertConfig(false)
  };
};

/**
 * Error alert handler
 */
export const showErrorAlert = (
  title: string,
  message: string,
  onPress?: () => void
) => {
  return {
    title,
    message,
    buttons: onPress ? [{ text: 'OK', onPress }] : [{ text: 'OK' }],
    options: getAlertConfig(true)
  };
};
