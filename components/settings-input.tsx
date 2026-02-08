import React from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity } from 'react-native';

interface SettingsInputProps {
  label: string;
  description?: string;
  type: 'text' | 'number' | 'toggle' | 'button';
  value?: string | number | boolean;
  onValueChange?: (value: string | number | boolean) => void;
  onPress?: () => void;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  buttonLabel?: string;
  buttonColor?: string;
}

export function SettingsInput({
  label,
  description,
  type,
  value,
  onValueChange,
  onPress,
  placeholder,
  min,
  max,
  disabled,
  buttonLabel,
  buttonColor = '#0a7ea4',
}: SettingsInputProps) {
  if (type === 'toggle') {
    return (
      <View className="bg-surface rounded-lg p-4 border border-border mb-3 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          {description && (
            <Text className="text-xs text-muted mt-1">{description}</Text>
          )}
        </View>
        <Switch
          value={Boolean(value)}
          onValueChange={(newValue) => onValueChange?.(newValue)}
          disabled={disabled}
          trackColor={{ false: '#e5e7eb', true: '#10b981' }}
          thumbColor={Boolean(value) ? '#10b981' : '#f3f4f6'}
        />
      </View>
    );
  }

  if (type === 'button') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        className={`rounded-lg p-4 border border-border mb-3 items-center ${
          disabled ? 'opacity-50' : ''
        }`}
        style={{ backgroundColor: buttonColor + '20', borderColor: buttonColor }}
      >
        <Text
          className="font-semibold"
          style={{ color: buttonColor }}
        >
          {buttonLabel || label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View className="bg-surface rounded-lg p-4 border border-border mb-3">
      <Text className="text-sm font-semibold text-foreground mb-2">{label}</Text>
      {description && (
        <Text className="text-xs text-muted mb-2">{description}</Text>
      )}
      <TextInput
        value={String(value || '')}
        onChangeText={(text) => {
          if (type === 'number') {
            const num = parseInt(text) || 0;
            const validNum = min !== undefined && num < min ? min : max !== undefined && num > max ? max : num;
            onValueChange?.(validNum);
          } else {
            onValueChange?.(text);
          }
        }}
        placeholder={placeholder}
        placeholderTextColor="#9BA1A6"
        keyboardType={type === 'number' ? 'numeric' : 'default'}
        editable={!disabled}
        className="bg-background border border-border rounded px-3 py-2 text-foreground"
      />
      {type === 'number' && (min !== undefined || max !== undefined) && (
        <Text className="text-xs text-muted mt-2">
          {min !== undefined && max !== undefined
            ? `النطاق: ${min} - ${max}`
            : min !== undefined
              ? `الحد الأدنى: ${min}`
              : `الحد الأقصى: ${max}`}
        </Text>
      )}
    </View>
  );
}
