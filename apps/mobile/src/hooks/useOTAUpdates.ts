import { useEffect } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';
import { logWarn, logError } from '@progress/shared';
import { showSuccessToast } from '../utils/toast';

async function checkAndApplyUpdate(): Promise<void> {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) {
      return;
    }

    logWarn('OTA update available, downloading…');
    await Updates.fetchUpdateAsync();
    showSuccessToast('Restarting to apply update…', 'Update Available');
    await Updates.reloadAsync();
  } catch (error) {
    logError('OTA update check failed', { error });
  }
}

export function useOTAUpdates(): void {
  useEffect(() => {
    if (__DEV__ || Platform.OS === 'web') {
      return;
    }

    checkAndApplyUpdate();

    function handleAppStateChange(nextState: AppStateStatus): void {
      if (nextState === 'active') {
        checkAndApplyUpdate();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);
}
