import { ScrollView, View, Text, Pressable, ActivityIndicator, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: string;
  totalAmount: string;
  invoiceStatus: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  createdAt: Date;
}

export default function InvoicesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const getInvoicesQuery = trpc.payments.getInvoices.useQuery({
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    if (getInvoicesQuery.data) {
      setInvoices(getInvoicesQuery.data.invoices);
      setLoading(false);
    }
  }, [getInvoicesQuery.data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return colors.success;
      case "overdue":
        return colors.error;
      case "issued":
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "مدفوع";
      case "overdue":
        return "متأخر";
      case "issued":
        return "صادر";
      case "draft":
        return "مسودة";
      case "cancelled":
        return "ملغى";
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredInvoices = selectedStatus
    ? invoices.filter((inv) => inv.invoiceStatus === selectedStatus)
    : invoices;

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <Pressable
      onPress={() => router.push({ pathname: "/invoice-details", params: { id: item.id } })}
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
          <Text className="text-lg font-semibold text-foreground">
            {item.invoiceNumber}
          </Text>
          <Text className="text-sm text-muted mt-1">
            {formatDate(item.billingPeriodStart)} - {formatDate(item.billingPeriodEnd)}
          </Text>
        </View>
        <View
          style={{ backgroundColor: getStatusColor(item.invoiceStatus) }}
          className="rounded-full px-3 py-1"
        >
          <Text className="text-xs font-semibold text-white">
            {getStatusLabel(item.invoiceStatus)}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-base font-semibold text-foreground">
          {parseFloat(item.totalAmount).toFixed(2)} ر.س
        </Text>
        <Text className="text-sm text-muted">
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">
              الفواتير
            </Text>
            <Text className="text-base text-muted">
              عرض جميع فواتيرك
            </Text>
          </View>

          {/* Status Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 8 }}
          >
            {[
              { label: "الكل", value: null },
              { label: "مدفوع", value: "paid" },
              { label: "صادر", value: "issued" },
              { label: "متأخر", value: "overdue" },
            ].map((status) => (
              <Pressable
                key={status.value}
                onPress={() => setSelectedStatus(status.value)}
                style={({ pressed }) => [
                  {
                    backgroundColor:
                      selectedStatus === status.value ? colors.primary : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="rounded-full px-4 py-2 border border-border"
              >
                <Text
                  className={`font-medium ${
                    selectedStatus === status.value
                      ? "text-background"
                      : "text-foreground"
                  }`}
                >
                  {status.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Loading State */}
          {loading && (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {/* Invoices List */}
          {!loading && filteredInvoices.length > 0 && (
            <FlatList
              data={filteredInvoices}
              renderItem={renderInvoiceItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}

          {/* Empty State */}
          {!loading && filteredInvoices.length === 0 && (
            <View className="flex-1 justify-center items-center gap-4">
              <Text className="text-xl font-semibold text-foreground">
                لا توجد فواتير
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
