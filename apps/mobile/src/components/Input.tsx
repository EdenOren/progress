import React, { forwardRef, useState } from 'react';
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, helperText, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>{label}</Text>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error ? styles.inputError : undefined,
            style,
          ]}
          placeholderTextColor="#9ca3af"
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        {helperText && !error && (
          <Text style={styles.helperText}>{helperText}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#f9fafb',
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#f9fafb',
  },
  inputFocused: {
    borderColor: '#60a5fa',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  helperText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
