import { ScrollView, View, Text, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";

interface SettingOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();

  const settingOptions: SettingOption[] = [
    {
      id: "1",
      title: "إعدادات التطبيق",
      description: "تخصيص إعدادات التطبيق والتطبيق",
      icon: "⚙️",
      route: "/app-settings",
    },
    {
      id: "2",
      title: "إدارة الاتصال",
      description: "إدارة اتصال الخادم والاتصالات",
      icon: "🔗",
      route: "/connection-manager",
    },
    {
      id: "3",
      title: "السجل",
      description: "عرض سجل الأحداث والعمليات",
      icon: "📋",
      route: "/logs",
    },
  ];

  const renderOption = ({ item }: { item: SettingOption }) => (
    <TouchableOpacity
      onPress={() => router.push(item.route as any)}
      className="bg-surface rounded-lg p-4 mb-3 border border-border"
    >
      <View className="flex-row items-center gap-3">
        <Text className="text-3xl">{item.icon}</Text>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{item.title}</Text>
          <Text className="text-sm text-muted mt-1">{item.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <Text className="text-3xl font-bold text-foreground mb-2">الإعدادات</Text>
            <Text className="text-base text-muted">
              تخصيص وإدارة إعدادات التطبيق
            </Text>
          </View>

          {/* Setting Options */}
          <FlatList
            data={settingOptions}
            renderItem={renderOption}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            className="mt-4"
          />

          {/* Info Card */}
          <View className="bg-primary/10 rounded-lg p-4 mt-4">
            <Text className="text-sm text-foreground">
              <Text className="font-semibold">ملاحظة:</Text> يمكنك تخصيص جميع إعدادات التطبيق من هنا.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
