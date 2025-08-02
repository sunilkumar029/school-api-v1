
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}) => {
  const buttonStyle = [
    styles.button,
    variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
    disabled && styles.disabledButton,
    style,
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText,
    disabled && styles.disabledButtonText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#004AAD'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: '#004AAD',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#004AAD',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});
