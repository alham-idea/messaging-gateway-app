import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { authService } from '@/lib/services/auth-client-service';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    }
    
    if (!password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.login({ username, password });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('خطأ في تسجيل الدخول', error instanceof Error ? error.message : 'حدث خطأ ما');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center items-center px-6 py-8">
          {/* Logo Section */}
          <View className="items-center mb-12">
            <Image
              source={require('@/assets/images/idea-logo.png')}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold text-foreground mt-6 text-center">
              بوابة الرسائل
            </Text>
            <Text className="text-sm text-muted mt-2 text-center">
              من تطوير آيديا للإستشارات والحلول التسويقية والتقنية
            </Text>
          </View>

          {/* Login Form */}
          <View className="w-full max-w-sm">
            {/* Username Input */}
            <View className="mb-6">
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
                placeholder="أدخل اسم المستخدم"
                placeholderTextColor={colors.muted}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) {
                    setErrors({ ...errors, username: undefined });
                  }
                }}
                editable={!loading}
              />
              {errors.username && (
                <Text className="text-xs text-error mt-1">{errors.username}</Text>
              )}
            </View>

            {/* Password Input */}
            <View className="mb-6">
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
                placeholder="أدخل كلمة المرور"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                secureTextEntry
                editable={!loading}
              />
              {errors.password && (
                <Text className="text-xs text-error mt-1">{errors.password}</Text>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
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
                  تسجيل الدخول
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center">
              <Text className="text-sm text-muted">ليس لديك حساب؟ </Text>
              <TouchableOpacity onPress={() => router.replace('/signup' as any)}>
                <Text className="text-sm font-semibold text-primary">
                  إنشاء حساب جديد
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="absolute bottom-6 left-0 right-0 items-center">
            <Text className="text-xs text-muted text-center">
              © 2026 آيديا للإستشارات والحلول التسويقية والتقنية
            </Text>
            <Text className="text-xs text-muted mt-1">
              جميع الحقوق محفوظة
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
