import { ScrollView, View, Text, Pressable, ActivityIndicator, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface Payment {
  id: number;
  amount: string;
  paymentMethod: string;
  paymentStatus: string;
  description?: string | null;
  createdAt: Date;
}

export default function PaymentHistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const getPaymentHistoryQuery = trpc.payments.getPaymentHistory.useQuery({
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    if (getPaymentHistoryQuery.data) {
      setPayments(getPaymentHistoryQuery.data.payments);
      setLoading(false);
    }
  }, [getPaymentHistoryQuery.data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "failed":
        return colors.error;
      case "pending":
        return colors.warning;
      case "refunded":
        return colors.muted;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتمل";
      case "failed":
        return "فشل";
      case "pending":
        return "قيد الانتظار";
      case "refunded":
        return "مسترجع";
      default:
        return status;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "credit_card":
        return "بطاقة ائتمان";
      case "debit_card":
        return "بطاقة خصم";
      case "bank_transfer":
        return "تحويل بنكي";
      case "wallet":
        return "محفظة رقمية";
      case "other":
        return "أخرى";
      default:
        return method;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      className="rounded-lg p-4 mb-3 border border-border"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {getMethodLabel(item.paymentMethod)}
          </Text>
          <Text className="text-sm text-muted mt-1">
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View
          style={{ backgroundColor: getStatusColor(item.paymentStatus) }}
          className="rounded-full px-3 py-1"
        >
          <Text className="text-xs font-semibold text-white">
            {getStatusLabel(item.paymentStatus)}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-base font-semibold text-foreground">
          {parseFloat(item.amount).toFixed(2)} ر.س
        </Text>
        {item.description && (
          <Text className="text-sm text-muted">{item.description}</Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScreenHeader
        title="سجل الدفعات"
        subtitle="عرض جميع عمليات الدفع السابقة"
        showBackButton={true}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4">

          {/* Loading State */}
          {loading && (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {/* Payments List */}
          {!loading && payments.length > 0 && (
            <FlatList
              data={payments}
              renderItem={renderPaymentItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}

          {/* Empty State */}
          {!loading && payments.length === 0 && (
            <View className="flex-1 justify-center items-center gap-4">
              <Text className="text-xl font-semibold text-foreground">
                لا توجد دفعات
              </Text>
              <Text className="text-base text-muted text-center">
                لم تقم بأي عملية دفع بعد
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
