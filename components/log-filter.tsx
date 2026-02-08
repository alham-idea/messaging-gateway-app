import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { LogFilter } from '@/lib/services/log-service';

interface LogFilterProps {
  filter: LogFilter;
  onFilterChange: (filter: Partial<LogFilter>) => void;
  onReset: () => void;
}

export function LogFilterComponent({ filter, onFilterChange, onReset }: LogFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filterOptions = {
    type: [
      { label: 'الكل', value: 'all' },
      { label: 'واتساب', value: 'whatsapp' },
      { label: 'رسائل نصية', value: 'sms' },
      { label: 'نظام', value: 'system' },
      { label: 'أخطاء', value: 'error' },
    ],
    direction: [
      { label: 'الكل', value: 'all' },
      { label: 'مرسل', value: 'sent' },
      { label: 'مستقبل', value: 'received' },
      { label: 'داخلي', value: 'internal' },
    ],
    status: [
      { label: 'الكل', value: 'all' },
      { label: 'معلق', value: 'pending' },
      { label: 'مرسل', value: 'sent' },
      { label: 'مُسلّم', value: 'delivered' },
      { label: 'مقروء', value: 'read' },
      { label: 'فشل', value: 'failed' },
    ],
  };

  const FilterButton = ({
    label,
    value,
    isActive,
    onPress,
  }: {
    label: string;
    value: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-2 rounded-full mr-2 mb-2 ${
        isActive
          ? 'bg-primary'
          : 'bg-surface border border-border'
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          isActive ? 'text-white' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="bg-surface rounded-lg p-4 border border-border mb-4">
      {/* البحث */}
      <View className="mb-4">
        <Text className="text-xs text-muted mb-2">البحث</Text>
        <TextInput
          placeholder="ابحث عن رقم أو رسالة..."
          placeholderTextColor="#9BA1A6"
          onChangeText={(text) => onFilterChange({ searchText: text })}
          className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
        />
      </View>

      {/* فلتر النوع */}
      <View className="mb-4">
        <Text className="text-xs text-muted mb-2">النوع</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterOptions.type.map((option) => (
            <FilterButton
              key={option.value}
              label={option.label}
              value={option.value}
              isActive={filter.type === option.value}
              onPress={() => onFilterChange({ type: option.value as any })}
            />
          ))}
        </ScrollView>
      </View>

      {/* فلتر الاتجاه */}
      <View className="mb-4">
        <Text className="text-xs text-muted mb-2">الاتجاه</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterOptions.direction.map((option) => (
            <FilterButton
              key={option.value}
              label={option.label}
              value={option.value}
              isActive={filter.direction === option.value}
              onPress={() => onFilterChange({ direction: option.value as any })}
            />
          ))}
        </ScrollView>
      </View>

      {/* فلتر الحالة */}
      <View className="mb-4">
        <Text className="text-xs text-muted mb-2">الحالة</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterOptions.status.map((option) => (
            <FilterButton
              key={option.value}
              label={option.label}
              value={option.value}
              isActive={filter.status === option.value}
              onPress={() => onFilterChange({ status: option.value as any })}
            />
          ))}
        </ScrollView>
      </View>

      {/* زر إعادة التعيين */}
      <TouchableOpacity
        onPress={onReset}
        className="bg-error/10 border border-error rounded-lg py-2 items-center"
      >
        <Text className="text-error text-xs font-semibold">إعادة تعيين الفلاتر</Text>
      </TouchableOpacity>
    </View>
  );
}
