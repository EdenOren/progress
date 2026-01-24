import React, { useState } from 'react';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '../../src/components';
import { useAuth } from '../../src/hooks';
import { getErrorMessage } from '../../src/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen(): React.ReactElement {
  const { signIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const result = await signIn(data);

    if (!result.success) {
      setError(getErrorMessage(result.error));
    } else {
      router.replace('/(tabs)');
    }

    setIsLoading(false);
  };

  const onGoogleSignIn = async (): Promise<void> => {
    setIsGoogleLoading(true);
    setError(null);

    const result = await signInWithGoogle();

    if (!result.success) {
      setError(getErrorMessage(result.error));
    }

    setIsGoogleLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }}>
      <YStack flex={1} padding="$5" justifyContent="center" gap="$4">
        <YStack gap="$2" marginBottom="$6">
          <Text fontSize={28} fontWeight="700" color="$color">
            Welcome back
          </Text>
          <Text fontSize={16} color="$textSecondary">
            Sign in to continue tracking your progress
          </Text>
        </YStack>

        {error && (
          <Stack
            backgroundColor="rgba(239, 68, 68, 0.15)"
            padding={16}
            borderRadius={8}
          >
            <Text color="$error" fontSize={14}>
              {error}
            </Text>
          </Stack>
        )}

        <YStack gap="$3">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Stack marginTop={8}>
            <Button
              variant="primary"
              fullWidth
              loading={isLoading}
              onPress={handleSubmit(onSubmit)}
            >
              Sign In
            </Button>
          </Stack>
        </YStack>

        <XStack alignItems="center" gap="$3" marginVertical="$2">
          <Stack flex={1} height={1} backgroundColor="$borderColor" />
          <Text color="$textMuted" fontSize={12}>
            or
          </Text>
          <Stack flex={1} height={1} backgroundColor="$borderColor" />
        </XStack>

        <Button
          variant="secondary"
          fullWidth
          loading={isGoogleLoading}
          onPress={onGoogleSignIn}
        >
          Continue with Google
        </Button>

        <XStack justifyContent="center" gap="$2" marginTop="$4">
          <Text color="$textSecondary">Don't have an account?</Text>
          <Link href="/(auth)/signup" asChild>
            <Text color="$primaryLight" fontWeight="600" pressStyle={{ opacity: 0.7 }}>
              Sign Up
            </Text>
          </Link>
        </XStack>
      </YStack>
    </SafeAreaView>
  );
}
