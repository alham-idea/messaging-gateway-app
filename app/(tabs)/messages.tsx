import { ScrollView, View, Text, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";

interface MessageOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

export default function MessagesScreen() {
  const router = useRouter();
  const colors = useColors();

  const messageOptions: MessageOption[] = [
    {
      id: "1",
      title: "واتساب",
      description: "إرسال واستقبال رسائل واتساب",
      icon: "📱",
      route: "/whatsapp",
    },
    {
      id: "2",
      title: "السجل",
      description: "عرض سجل جميع الرسائل",
      icon: "📋",
      route: "/logs",
    },
    {
      id: "3",
      title: "الرسائل الفاشلة",
      description: "عرض الرسائل التي فشل إرسالها",
      icon: "⚠️",
      route: "/failed-messages",
    },
    {
      id: "4",
      title: "إدارة الاتصال",
      description: "إدارة اتصال الخادم",
      icon: "🔗",
      route: "/connection-manager",
    },
  ];

  const renderOption = ({ item }: { item: MessageOption }) => (
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
            <Text className="text-3xl font-bold text-foreground mb-2">الرسائل</Text>
            <Text className="text-base text-muted">
              إدارة جميع رسائلك والتحكم في الاتصال
            </Text>
          </View>

          {/* Message Options */}
          <FlatList
            data={messageOptions}
            renderItem={renderOption}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            className="mt-4"
          />

          {/* Info Card */}
          <View className="bg-primary/10 rounded-lg p-4 mt-4">
            <Text className="text-sm text-foreground">
              <Text className="font-semibold">ملاحظة:</Text> يمكنك إدارة جميع الرسائل والاتصالات من هنا.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
