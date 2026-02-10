import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { authService } from '@/lib/services/auth-client-service';

export default function SignupScreen() {
  const router = useRouter();
  const colors = useColors();
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'اسم المنشأة مطلوب';
    }

    if (!formData.businessPhone.trim()) {
      newErrors.businessPhone = 'رقم الهاتف مطلوب';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    } else if (formData.username.length < 3) {
      newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.register({
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        businessPhone: formData.businessPhone,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      Alert.alert('نجح التسجيل', 'تم إنشاء حسابك بنجاح', [
        {
          text: 'تسجيل الدخول',
          onPress: () => router.replace('/login'),
        },
      ]);
    } catch (error) {
      Alert.alert('خطأ في التسجيل', error instanceof Error ? error.message : 'حدث خطأ ما');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          {/* Logo Section */}
          <View className="items-center mb-8">
            <Image
              source={require('@/assets/images/idea-logo.png')}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold text-foreground mt-4 text-center">
              إنشاء حساب جديد
            </Text>
            <Text className="text-sm text-muted mt-2 text-center">
              انضم إلى منصة بوابة الرسائل
            </Text>
          </View>

          {/* Signup Form */}
          <View className="w-full max-w-sm self-center">
            {/* Business Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                اسم المنشأة
              </Text>
              <TextInput
                className={cn(
                  'w-full px-4 py-3 rounded-lg border text-foreground',
                  errors.businessName
                    ? 'border-error bg-error/10'
                    : 'border-border bg-surface'
                )}
                placeholder="اسم شركتك أو منشأتك"
                placeholderTextColor={colors.muted}
                value={formData.businessName}
                onChangeText={(value) => handleInputChange('businessName', value)}
                editable={!loading}
              />
              {errors.businessName && (
                <Text className="text-xs text-error mt-1">{errors.businessName}</Text>
              )}
            </View>

            {/* Business Address */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                عنوان المنشأة (اختياري)
              </Text>
              <TextInput
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground"
                placeholder="العنوان الكامل"
                placeholderTextColor={colors.muted}
                value={formData.businessAddress}
                onChangeText={(value) => handleInputChange('businessAddress', value)}
                editable={!loading}
              />
            </View>

            {/* Business Phone */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                رقم الهاتف
              </Text>
              <TextInput
                className={cn(
                  'w-full px-4 py-3 rounded-lg border text-foreground',
                  errors.businessPhone
                    ? 'border-error bg-error/10'
                    : 'border-border bg-surface'
                )}
                placeholder="رقم الهاتف"
                placeholderTextColor={colors.muted}
                value={formData.businessPhone}
                onChangeText={(value) => handleInputChange('businessPhone', value)}
                keyboardType="phone-pad"
                editable={!loading}
              />
              {errors.businessPhone && (
                <Text className="text-xs text-error mt-1">{errors.businessPhone}</Text>
              )}
            </View>

            {/* Username */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                اسم المستخدم
              </Text>
              <TextInput
                className={cn(
                  'w-full px-4 py-3 rounded-lg border text-foreground',
                  errors.username
                    ? 'border-error bg-error/10'
                    : 'border-border bg-surface'
                )}
                placeholder="اسم المستخدم"
                placeholderTextColor={colors.muted}
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                editable={!loading}
              />
              {errors.username && (
                <Text className="text-xs text-error mt-1">{errors.username}</Text>
              )}
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                البريد الإلكتروني
              </Text>
              <TextInput
                className={cn(
                  'w-full px-4 py-3 rounded-lg border text-foreground',
                  errors.email
                    ? 'border-error bg-error/10'
                    : 'border-border bg-surface'
                )}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={colors.muted}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                editable={!loading}
              />
              {errors.email && (
                <Text className="text-xs text-error mt-1">{errors.email}</Text>
              )}
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                كلمة المرور
              </Text>
              <TextInput
                className={cn(
                  'w-full px-4 py-3 rounded-lg border text-foreground',
                  errors.password
                    ? 'border-error bg-error/10'
                    : 'border-border bg-surface'
                )}
                placeholder="كلمة المرور"
                placeholderTextColor={colors.muted}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry
                editable={!loading}
              />
              {errors.password && (
                <Text className="text-xs text-error mt-1">{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">
                تأكيد كلمة المرور
              </Text>
              <TextInput
                className={cn(
                  'w-full px-4 py-3 rounded-lg border text-foreground',
                  errors.confirmPassword
                    ? 'border-error bg-error/10'
                    : 'border-border bg-surface'
                )}
                placeholder="تأكيد كلمة المرور"
                placeholderTextColor={colors.muted}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
                editable={!loading}
              />
              {errors.confirmPassword && (
                <Text className="text-xs text-error mt-1">{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className={cn(
                'w-full py-3 rounded-lg items-center justify-center mb-4',
                loading ? 'bg-primary/50' : 'bg-primary'
              )}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="text-base font-semibold text-background">
                  إنشاء حساب
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row items-center justify-center mb-8">
              <Text className="text-sm text-muted">لديك حساب بالفعل؟ </Text>
              <TouchableOpacity onPress={() => router.push('/login' as any)}>
                <Text className="text-sm font-semibold text-primary">
                  تسجيل الدخول
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="items-center">
              <Text className="text-xs text-muted text-center">
                © 2026 آيديا للإستشارات والحلول التسويقية والتقنية
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
