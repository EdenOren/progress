import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  pressable?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, pressable, elevated, onPress, style }: CardProps): React.ReactElement {
  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    style,
  ];

  if (pressable && onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  elevated: {
    elevation: 3,
  },
  pressed: {
    backgroundColor: '#1f2937',
    transform: [{ scale: 0.98 }],
  },
});
