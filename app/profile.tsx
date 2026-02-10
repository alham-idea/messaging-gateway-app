import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: number;
  businessName: string;
  businessAddress: string | null;
  businessPhone: string;
  username: string;
  email: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // TODO: استخدام التوكن المحفوظ
      const response = await fetch('http://localhost:3000/api/user/profile', {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName?.trim()) {
      newErrors.businessName = 'اسم المنشأة مطلوب';
    }

    if (!formData.businessPhone?.trim()) {
      newErrors.businessPhone = 'رقم الهاتف مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          businessPhone: formData.businessPhone,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditing(false);
        Alert.alert('نجح', 'تم تحديث البيانات بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل تحديث البيانات');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل الاتصال بالخادم');
      console.error('Update profile error:', error);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-foreground">فشل تحميل البيانات</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground">بيانات الحساب</Text>
          <TouchableOpacity
            onPress={() => {
              if (editing) {
                setFormData(profile);
              }
              setEditing(!editing);
            }}
            className="px-4 py-2 bg-primary rounded-lg"
          >
            <Text className="text-background font-semibold">
              {editing ? 'إلغاء' : 'تعديل'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Business Information Section */}
        <View className="bg-surface rounded-lg p-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">
            بيانات المنشأة
          </Text>

          {/* Business Name */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              اسم المنشأة
            </Text>
            {editing ? (
              <>
                <TextInput
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border text-foreground',
                    errors.businessName
                      ? 'border-error bg-error/10'
                      : 'border-border bg-background'
                  )}
                  value={formData.businessName}
                  onChangeText={(value) => {
                    setFormData({ ...formData, businessName: value });
                    if (errors.businessName) {
                      const newErrors = { ...errors };
                      delete newErrors.businessName;
                      setErrors(newErrors);
                    }
                  }}
                />
                {errors.businessName && (
                  <Text className="text-xs text-error mt-1">{errors.businessName}</Text>
                )}
              </>
            ) : (
              <Text className="text-base text-muted">{profile.businessName}</Text>
            )}
          </View>

          {/* Business Address */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              العنوان
            </Text>
            {editing ? (
              <TextInput
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                value={formData.businessAddress || ''}
                onChangeText={(value) => setFormData({ ...formData, businessAddress: value })}
                placeholder="العنوان الكامل"
              />
            ) : (
              <Text className="text-base text-muted">
                {profile.businessAddress || 'لم يتم تحديد عنوان'}
              </Text>
            )}
          </View>

          {/* Business Phone */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              رقم الهاتف
            </Text>
            {editing ? (
              <>
                <TextInput
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border text-foreground',
                    errors.businessPhone
                      ? 'border-error bg-error/10'
                      : 'border-border bg-background'
                  )}
                  value={formData.businessPhone}
                  onChangeText={(value) => {
                    setFormData({ ...formData, businessPhone: value });
                    if (errors.businessPhone) {
                      const newErrors = { ...errors };
                      delete newErrors.businessPhone;
                      setErrors(newErrors);
                    }
                  }}
                  keyboardType="phone-pad"
                />
                {errors.businessPhone && (
                  <Text className="text-xs text-error mt-1">{errors.businessPhone}</Text>
                )}
              </>
            ) : (
              <Text className="text-base text-muted">{profile.businessPhone}</Text>
            )}
          </View>
        </View>

        {/* Account Information Section */}
        <View className="bg-surface rounded-lg p-4 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">
            بيانات الحساب
          </Text>

          {/* Username */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              اسم المستخدم
            </Text>
            <Text className="text-base text-muted">{profile.username}</Text>
          </View>

          {/* Email */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              البريد الإلكتروني
            </Text>
            <Text className="text-base text-muted">{profile.email}</Text>
          </View>
        </View>

        {/* Save Button */}
        {editing && (
          <TouchableOpacity
            onPress={handleSave}
            className="bg-primary rounded-lg py-3 items-center justify-center"
          >
            <Text className="text-background font-semibold text-base">
              حفظ التغييرات
            </Text>
          </TouchableOpacity>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert('تسجيل الخروج', 'هل أنت متأكد من رغبتك في تسجيل الخروج؟', [
              { text: 'إلغاء', style: 'cancel' },
              {
                text: 'تسجيل الخروج',
                style: 'destructive',
                onPress: () => {
                  // TODO: حذف التوكن وإعادة التوجيه للدخول
                  router.replace('/login');
                },
              },
            ]);
          }}
          className="mt-4 bg-error/10 border border-error rounded-lg py-3 items-center justify-center"
        >
          <Text className="text-error font-semibold text-base">
            تسجيل الخروج
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
