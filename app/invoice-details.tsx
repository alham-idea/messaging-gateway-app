import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function InvoiceDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getInvoiceQuery = trpc.payments.getInvoice.useQuery(
    { invoiceId: parseInt(id as string) },
    { enabled: !!id }
  );

  useEffect(() => {
    if (getInvoiceQuery.data) {
      setInvoice(getInvoiceQuery.data);
      setLoading(false);
    }
  }, [getInvoiceQuery.data]);

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
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!invoice) {
    return (
      <ScreenContainer className="flex-1 bg-background justify-center items-center">
        <Text className="text-xl font-semibold text-foreground">
          لم يتم العثور على الفاتورة
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4">
          {/* Header */}
          <View className="mb-6">
            <Pressable onPress={() => router.back()} className="mb-4">
              <Text className="text-lg font-semibold text-primary">← رجوع</Text>
            </Pressable>
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-foreground mb-2">
                  {invoice.invoiceNumber}
                </Text>
                <Text className="text-base text-muted">
                  {formatDate(invoice.createdAt)}
                </Text>
              </View>
              <View
                style={{ backgroundColor: getStatusColor(invoice.invoiceStatus) }}
                className="rounded-full px-4 py-2"
              >
                <Text className="text-sm font-semibold text-white">
                  {getStatusLabel(invoice.invoiceStatus)}
                </Text>
              </View>
            </View>
          </View>

          {/* Invoice Details Card */}
          <View
            style={{ backgroundColor: colors.surface }}
            className="rounded-lg p-4 mb-6 border border-border"
          >
            {/* Billing Period */}
            <View className="mb-4 pb-4 border-b border-border">
              <Text className="text-sm font-semibold text-muted mb-2">
                فترة الفواتير
              </Text>
              <Text className="text-base text-foreground">
                {formatDate(invoice.billingPeriodStart)} -{" "}
                {formatDate(invoice.billingPeriodEnd)}
              </Text>
            </View>

            {/* Amount Breakdown */}
            <View className="mb-4 pb-4 border-b border-border">
              <View className="flex-row justify-between mb-2">
                <Text className="text-base text-foreground">المبلغ الأساسي:</Text>
                <Text className="text-base font-semibold text-foreground">
                  {parseFloat(invoice.amount).toFixed(2)} ر.س
                </Text>
              </View>
              {parseFloat(invoice.taxAmount) > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-base text-foreground">الضريبة:</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {parseFloat(invoice.taxAmount).toFixed(2)} ر.س
                  </Text>
                </View>
              )}
            </View>

            {/* Total */}
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold text-foreground">الإجمالي:</Text>
              <Text
                style={{ color: colors.primary }}
                className="text-lg font-bold"
              >
                {parseFloat(invoice.totalAmount).toFixed(2)} ر.س
              </Text>
            </View>
          </View>

          {/* Due Date */}
          {invoice.dueDate && (
            <View
              style={{ backgroundColor: colors.surface }}
              className="rounded-lg p-4 mb-6 border border-border"
            >
              <Text className="text-sm font-semibold text-muted mb-2">
                تاريخ الاستحقاق
              </Text>
              <Text className="text-base text-foreground">
                {formatDate(invoice.dueDate)}
              </Text>
            </View>
          )}

          {/* Notes */}
          {invoice.notes && (
            <View
              style={{ backgroundColor: colors.surface }}
              className="rounded-lg p-4 mb-6 border border-border"
            >
              <Text className="text-sm font-semibold text-muted mb-2">
                ملاحظات
              </Text>
              <Text className="text-base text-foreground">{invoice.notes}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3 mt-auto">
            {invoice.invoiceStatus !== "paid" && (
              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="rounded-full py-4 px-6 items-center justify-center"
              >
                <Text className="text-background font-semibold text-lg">
                  دفع الفاتورة
                </Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="rounded-full py-4 px-6 items-center justify-center"
            >
              <Text className="text-foreground font-semibold text-lg">
                تحميل PDF
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
