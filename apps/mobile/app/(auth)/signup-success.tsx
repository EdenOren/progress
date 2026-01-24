import React, { useState, useEffect, useCallback } from 'react';
import { YStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components';
import { useAuth } from '../../src/hooks';

const RESEND_COOLDOWN_SECONDS = 30;

export default function SignupSuccessScreen(): React.ReactElement {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { resendVerification } = useAuth();
  const theme = useTheme();

  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendState, setResendState] = useState<'waiting' | 'ready' | 'sending' | 'sent' | 'error'>('waiting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) {
      setResendState('ready');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (!email) return;

    setResendState('sending');
    setError(null);

    const result = await resendVerification(email);

    if (result.success) {
      setResendState('sent');
      setTimeout(() => {
        setCountdown(RESEND_COOLDOWN_SECONDS);
        setResendState('waiting');
      }, 2000);
    } else {
      setError('Failed to resend. Please try again.');
      setResendState('ready');
    }
  }, [email, resendVerification]);

  const getResendLabel = (): string => {
    switch (resendState) {
      case 'waiting':
        return `Resend in ${countdown}s`;
      case 'ready':
        return 'Resend Verification Email';
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Email sent!';
      case 'error':
        return 'Resend Verification Email';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }}>
      <YStack flex={1} padding={32} justifyContent="center" alignItems="center" gap={0}>
        {/* Icon */}
        <Stack
          width={80}
          height={80}
          borderRadius={40}
          backgroundColor="rgba(139, 92, 246, 0.15)"
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={36} color="$primary">
            ✓
          </Text>
        </Stack>

        {/* Title */}
        <Text fontSize={28} fontWeight="700" color="$color" marginTop={24} textAlign="center">
          Check your inbox
        </Text>

        {/* Message */}
        <Text fontSize={16} color="$textSecondary" marginTop={8} textAlign="center">
          We sent a verification link to{' '}
          <Text fontSize={16} fontWeight="600" color="$color">
            {email}
          </Text>
          . Tap the link to activate your account.
        </Text>

        {/* Spam hint */}
        <Text fontSize={14} color="$textMuted" marginTop={24} textAlign="center">
          Didn't get it? Check your spam folder.
        </Text>

        {/* Error */}
        {error && (
          <Stack
            marginTop={16}
            backgroundColor="rgba(239, 68, 68, 0.15)"
            padding={12}
            borderRadius={8}
            width="100%"
          >
            <Text color="$error" fontSize={14} textAlign="center">
              {error}
            </Text>
          </Stack>
        )}

        {/* Resend button */}
        <Stack marginTop={16} width="100%">
          <Button
            variant="secondary"
            fullWidth
            disabled={resendState === 'waiting' || resendState === 'sending'}
            loading={resendState === 'sending'}
            onPress={handleResend}
          >
            {getResendLabel()}
          </Button>
        </Stack>

        {/* Back to login */}
        <Stack marginTop={12} width="100%">
          <Button
            variant="ghost"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          >
            Back to Login
          </Button>
        </Stack>
      </YStack>
    </SafeAreaView>
  );
}
