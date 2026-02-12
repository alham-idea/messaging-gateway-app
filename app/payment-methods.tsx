import { ScrollView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { PaymentCard } from "@/components/payment-card";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function PaymentMethodsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getPaymentMethodsQuery = trpc.payments.getPaymentMethods.useQuery();
  const deletePaymentMethodMutation = trpc.payments.deletePaymentMethod.useMutation();

  useEffect(() => {
    if (getPaymentMethodsQuery.data) {
      setPaymentMethods(getPaymentMethodsQuery.data);
      setLoading(false);
    }
  }, [getPaymentMethodsQuery.data]);

  const handleDeletePaymentMethod = async (paymentMethodId: number) => {
    try {
      await deletePaymentMethodMutation.mutateAsync({ paymentMethodId });
      setPaymentMethods(paymentMethods.filter((m) => m.id !== paymentMethodId));
    } catch (error) {
      console.error("Failed to delete payment method:", error);
    }
  };

  const handleAddPaymentMethod = () => {
    router.push("/add-payment-method");
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScreenHeader
        title="طرق الدفع"
        subtitle="إدارة طرق الدفع الخاصة بك"
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

          {/* Payment Methods List */}
          {!loading && paymentMethods.length > 0 && (
            <View className="mb-6">
              {paymentMethods.map((method) => (
                <PaymentCard
                  key={method.id}
                  id={method.id}
                  methodType={method.methodType}
                  cardBrand={method.cardBrand}
                  last4={method.last4}
                  expiryMonth={method.expiryMonth}
                  expiryYear={method.expiryYear}
                  isDefault={method.isDefault}
                  onDelete={() => handleDeletePaymentMethod(method.id)}
                />
              ))}
            </View>
          )}

          {/* Empty State */}
          {!loading && paymentMethods.length === 0 && (
            <View className="flex-1 justify-center items-center gap-4">
              <Text className="text-xl font-semibold text-foreground">
                لم تضف أي طرق دفع
              </Text>
              <Text className="text-base text-muted text-center">
                أضف طريقة دفع لبدء الاشتراك
              </Text>
            </View>
          )}

          {/* Add Payment Method Button */}
          <Pressable
            onPress={handleAddPaymentMethod}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            className="rounded-full py-4 px-6 items-center justify-center mt-auto"
          >
            <Text className="text-background font-semibold text-lg">
              + أضف طريقة دفع
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
