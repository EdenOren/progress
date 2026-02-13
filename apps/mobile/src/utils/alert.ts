import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

// Type-safe access to window for web platform
const webWindow = globalThis as unknown as {
  confirm: (message: string) => boolean;
  alert: (message: string) => void;
};

/**
 * Cross-platform alert that works on both native and web.
 * On web, uses window.confirm for simple yes/no dialogs.
 * On native, uses React Native's Alert.alert.
 */
export function showAlert(
  title: string,
  message: string,
  buttons: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    // On web, use window.confirm for destructive actions
    const confirmButton = buttons.find(b => b.style === 'destructive' || b.text === 'Delete' || b.text === 'Complete');
    const cancelButton = buttons.find(b => b.style === 'cancel' || b.text === 'Cancel');

    if (confirmButton) {
      const confirmed = webWindow.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        confirmButton.onPress?.();
      } else {
        cancelButton?.onPress?.();
      }
    } else {
      // Just an informational alert
      webWindow.alert(`${title}\n\n${message}`);
      buttons[0]?.onPress?.();
    }
  } else {
    // On native, use Alert.alert
    Alert.alert(title, message, buttons);
  }
}

/**
 * Show a confirmation dialog for destructive actions.
 * Returns a promise that resolves to true if confirmed, false if cancelled.
 */
export function confirmAction(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(webWindow.confirm(`${title}\n\n${message}`));
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Confirm', style: 'destructive', onPress: () => resolve(true) },
      ]);
    }
  });
}
