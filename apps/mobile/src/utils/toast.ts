import Toast from 'react-native-toast-message';

/**
 * Show an error toast notification
 */
export function showErrorToast(message: string, title = 'Error'): void {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
    bottomOffset: 100,
  });
}

/**
 * Show a success toast notification
 */
export function showSuccessToast(message: string, title?: string): void {
  Toast.show({
    type: 'success',
    text1: title ?? message,
    text2: title ? message : undefined,
    position: 'bottom',
    visibilityTime: 2000,
    bottomOffset: 100,
  });
}

/**
 * Show a warning toast notification
 */
export function showWarningToast(message: string, title = 'Warning'): void {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 3000,
    bottomOffset: 100,
  });
}

/**
 * Hide the current toast
 */
export function hideToast(): void {
  Toast.hide();
}
