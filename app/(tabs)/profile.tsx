import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // تحميل بيانات المستخدم عند فتح الشاشة
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("userData");
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "تسجيل الخروج",
      "هل أنت متأكد من رغبتك في تسجيل الخروج؟",
      [
        { text: "إلغاء", onPress: () => {}, style: "cancel" },
        {
          text: "تسجيل الخروج",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              // حذف بيانات المستخدم
              await AsyncStorage.removeItem("userData");
              await AsyncStorage.removeItem("authToken");
              await AsyncStorage.removeItem("socketConnected");
              
              // إعادة التوجيه لشاشة تسجيل الدخول
              router.replace("/login");
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("خطأ", "حدث خطأ أثناء تسجيل الخروج");
            } finally {
              setIsLoggingOut(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <Text className="text-3xl font-bold text-foreground mb-2">الملف الشخصي</Text>
            <Text className="text-base text-muted">
              عرض وإدارة بيانات حسابك الشخصية
            </Text>
          </View>

          {/* Profile Card */}
          {loading ? (
            <View className="bg-surface rounded-2xl p-6 border border-border mt-4 items-center justify-center h-48">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : userData ? (
            <View className="bg-surface rounded-2xl p-6 border border-border mt-4">
              <View className="items-center mb-6">
                <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
                  <Text className="text-4xl">🏥</Text>
                </View>
                <Text className="text-2xl font-bold text-foreground">{userData.name || "المستخدم"}</Text>
                <Text className="text-sm text-muted mt-1">{userData.email}</Text>
              </View>

              <View className="border-t border-border pt-6">
                <View className="flex-row justify-between mb-4">
                  <Text className="text-base text-muted">حالة الحساب:</Text>
                  <Text className="text-base font-semibold text-success">نشط</Text>
                </View>
                <View className="flex-row justify-between mb-4">
                  <Text className="text-base text-muted">تاريخ الانضمام:</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {userData.joinDate || new Date().toLocaleDateString("ar-SA")}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-base text-muted">الاشتراك الحالي:</Text>
                  <Text className="text-base font-semibold text-primary">{userData.plan || "Enterprise"}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Quick Actions */}
          <View className="mt-6">
            <Text className="text-lg font-bold text-foreground mb-4">الإجراءات السريعة</Text>

            <TouchableOpacity
              onPress={() => router.push("/manage-subscription")}
              className="bg-primary rounded-lg py-3 px-4 mb-3 flex-row items-center justify-between"
            >
              <Text className="text-base font-semibold text-background">إدارة الاشتراك</Text>
              <Text className="text-lg">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/payment-methods")}
              className="bg-surface border border-border rounded-lg py-3 px-4 mb-3 flex-row items-center justify-between"
            >
              <Text className="text-base font-semibold text-foreground">طرق الدفع</Text>
              <Text className="text-lg">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/invoices")}
              className="bg-surface border border-border rounded-lg py-3 px-4 flex-row items-center justify-between"
            >
              <Text className="text-base font-semibold text-foreground">الفواتير</Text>
              <Text className="text-lg">→</Text>
            </TouchableOpacity>
          </View>

          {/* Account Settings */}
          <View className="mt-6">
            <Text className="text-lg font-bold text-foreground mb-4">إعدادات الحساب</Text>

            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="bg-surface border border-border rounded-lg py-3 px-4 mb-3"
            >
              <Text className="text-base font-semibold text-foreground">الإعدادات العامة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              disabled={isLoggingOut}
              className="bg-surface border border-error rounded-lg py-3 px-4"
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text className="text-base font-semibold text-error">تسجيل الخروج</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Card */}
          <View className="bg-primary/10 rounded-lg p-4 mt-6">
            <Text className="text-sm text-foreground">
              <Text className="font-semibold">ملاحظة:</Text> يمكنك إدارة جميع بيانات حسابك من هنا.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
