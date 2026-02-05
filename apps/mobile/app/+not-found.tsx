import { useEffect } from 'react';
import { router } from 'expo-router';

export default function NotFoundScreen() {
  useEffect(() => {
    // Redirect to home screen
    router.replace('/');
  }, []);

  return null;
}
