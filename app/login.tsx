import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSignup, setIsSignup] = useState(false);
  const [companyName, setCompanyName] = useState('');

  // التحقق من وجود مستخدم مسجل عند فتح التطبيق
  useEffect(() => {
    checkExistingUser();
  }, []);

  const checkExistingUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        // إذا كان هناك مستخدم مسجل، انتقل مباشرة للشاشة الرئيسية
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    // التحقق من البريد الإلكتروني
    if (!email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    // التحقق من كلمة المرور
    if (!password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    // التحقق من اسم الشركة في حالة التسجيل الجديد
    if (isSignup && !companyName.trim()) {
      newErrors.email = 'اسم الشركة مطلوب';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // بيانات المستخدم
      const userData = {
        email,
        name: isSignup ? companyName : 'المستخدم',
        plan: 'Enterprise',
        joinDate: new Date().toLocaleDateString('ar-SA'),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA'),
        status: 'active',
        isSignup,
      };

      // حفظ بيانات المستخدم
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('authToken', `token_${Date.now()}`);

      // عرض رسالة نجاح
      Alert.alert(
        isSignup ? 'تم التسجيل بنجاح' : 'تم تسجيل الدخول بنجاح',
        `مرحباً ${userData.name}`,
        [
          {
            text: 'متابعة',
            onPress: () => {
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'خطأ',
        error instanceof Error ? error.message : 'حدث خطأ ما'
      );
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
            <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-6">
              <Text className="text-5xl">💬</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground text-center">
              بوابة الرسائل
            </Text>
            <Text className="text-sm text-muted mt-2 text-center">
              {isSignup ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </Text>
          </View>

          {/* Login/Signup Form */}
          <View className="w-full max-w-sm">
            {/* Company Name Input (Signup only) */}
            {isSignup && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  اسم الشركة/المنصة
                </Text>
                <TextInput
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border text-foreground',
                    errors.email
                      ? 'border-error bg-error/10'
                      : 'border-border bg-surface'
                  )}
                  placeholder="مثال: المستشفى السعودي الألماني"
                  placeholderTextColor={colors.muted}
                  value={companyName}
                  onChangeText={setCompanyName}
                  editable={!loading}
                />
              </View>
            )}

            {/* Email Input */}
            <View className="mb-6">
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
                placeholder="example@company.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              {errors.email && (
                <Text className="text-error text-xs mt-2">{errors.email}</Text>
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
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
              {errors.password && (
                <Text className="text-error text-xs mt-2">{errors.password}</Text>
              )}
            </View>

            {/* Login/Signup Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={cn(
                'w-full py-3 rounded-lg items-center justify-center mb-4',
                loading ? 'bg-primary/50' : 'bg-primary'
              )}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text className="text-base font-semibold text-background">
                  {isSignup ? 'إنشاء حساب' : 'تسجيل الدخول'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Signup/Login */}
            <View className="flex-row justify-center items-center">
              <Text className="text-sm text-muted">
                {isSignup ? 'هل لديك حساب بالفعل؟ ' : 'ليس لديك حساب؟ '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignup(!isSignup);
                  setEmail('');
                  setPassword('');
                  setCompanyName('');
                  setErrors({});
                }}
                disabled={loading}
              >
                <Text className="text-sm font-semibold text-primary">
                  {isSignup ? 'تسجيل الدخول' : 'إنشاء حساب'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Demo Credentials */}
            <View className="bg-primary/10 rounded-lg p-4 mt-8 border border-primary/20">
              <Text className="text-xs font-semibold text-foreground mb-2">
                📝 بيانات تجريبية:
              </Text>
              <Text className="text-xs text-muted">
                البريد: special.sanaa@gmail.com
              </Text>
              <Text className="text-xs text-muted">
                كلمة المرور: 28d1e87a62898d39980c18d74519bbdb
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
