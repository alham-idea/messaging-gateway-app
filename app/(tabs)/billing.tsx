import { ScrollView, View, Text, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";

interface BillingOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

export default function BillingScreen() {
  const router = useRouter();
  const colors = useColors();

  const billingOptions: BillingOption[] = [
    {
      id: "1",
      title: "اختيار الباقة",
      description: "اختر الباقة المناسبة لاحتياجاتك",
      icon: "📦",
      route: "/plans",
    },
    {
      id: "2",
      title: "إدارة الاشتراك",
      description: "عرض وإدارة اشتراكك الحالي",
      icon: "📋",
      route: "/manage-subscription",
    },
    {
      id: "3",
      title: "طرق الدفع",
      description: "إدارة طرق الدفع الخاصة بك",
      icon: "💳",
      route: "/payment-methods",
    },
    {
      id: "4",
      title: "الفواتير",
      description: "عرض جميع فواتيرك",
      icon: "📄",
      route: "/invoices",
    },
    {
      id: "5",
      title: "سجل الدفعات",
      description: "عرض جميع عمليات الدفع السابقة",
      icon: "💰",
      route: "/payment-history",
    },
    {
      id: "6",
      title: "تطبيق كوبون",
      description: "تطبيق رموز الخصم والعروض",
      icon: "🎟️",
      route: "/apply-coupon",
    },
  ];

  const renderOption = ({ item }: { item: BillingOption }) => (
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
            <Text className="text-3xl font-bold text-foreground mb-2">الفواتير والدفع</Text>
            <Text className="text-base text-muted">
              إدارة الاشتراكات والدفع والفواتير
            </Text>
          </View>

          {/* Billing Options */}
          <FlatList
            data={billingOptions}
            renderItem={renderOption}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            className="mt-4"
          />

          {/* Info Card */}
          <View className="bg-primary/10 rounded-lg p-4 mt-4">
            <Text className="text-sm text-foreground">
              <Text className="font-semibold">ملاحظة:</Text> يمكنك إدارة جميع جوانب الدفع والاشتراكات من هنا.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
