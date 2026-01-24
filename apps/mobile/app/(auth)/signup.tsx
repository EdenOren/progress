import React, { useState } from 'react';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert } from 'react-native';
import { Button, Input } from '../../src/components';
import { useAuth } from '../../src/hooks';
import { getErrorMessage } from '../../src/utils';

const signupSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen(): React.ReactElement {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupForm): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const result = await signUp({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    if (!result.success) {
      setError(getErrorMessage(result.error));
    } else {
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Please verify your email to continue.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }}>
      <YStack flex={1} padding="$5" justifyContent="center" gap="$4">
        <YStack gap="$2" marginBottom="$6">
          <Text fontSize={28} fontWeight="700" color="$color">
            Create account
          </Text>
          <Text fontSize={16} color="$textSecondary">
            Start tracking your progress today
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
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Name"
                placeholder="Your name"
                autoCapitalize="words"
                autoComplete="name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.displayName?.message}
              />
            )}
          />

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
                placeholder="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                secureTextEntry
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.confirmPassword?.message}
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
              Create Account
            </Button>
          </Stack>
        </YStack>

        <XStack justifyContent="center" gap="$2" marginTop="$4">
          <Text color="$textSecondary">Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Text color="$primaryLight" fontWeight="600" pressStyle={{ opacity: 0.7 }}>
              Sign In
            </Text>
          </Link>
        </XStack>
      </YStack>
    </SafeAreaView>
  );
}
