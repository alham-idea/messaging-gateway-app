import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface PaymentCardProps {
  id: number;
  methodType: string;
  cardBrand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

export function PaymentCard({
  id,
  methodType,
  cardBrand,
  last4,
  expiryMonth,
  expiryYear,
  isDefault,
  onPress,
  onDelete,
  onSetDefault,
}: PaymentCardProps) {
  const colors = useColors();

  const getMethodLabel = () => {
    switch (methodType) {
      case "credit_card":
        return "بطاقة ائتمان";
      case "debit_card":
        return "بطاقة خصم";
      case "bank_account":
        return "حساب بنكي";
      case "wallet":
        return "محفظة رقمية";
      default:
        return "طريقة دفع";
    }
  };

  const getCardIcon = () => {
    if (cardBrand) {
      return cardBrand.toUpperCase();
    }
    return "••••";
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isDefault ? colors.primary : colors.border,
          borderWidth: isDefault ? 2 : 1,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.methodLabel, { color: colors.foreground }]}>
              {getMethodLabel()}
            </Text>
            {last4 && (
              <Text style={[styles.cardNumber, { color: colors.muted }]}>
                {getCardIcon()} •••• {last4}
              </Text>
            )}
          </View>
          {isDefault && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.background }]}>
                افتراضي
              </Text>
            </View>
          )}
        </View>

        {/* Expiry Date */}
        {expiryMonth && expiryYear && (
          <Text style={[styles.expiryDate, { color: colors.muted }]}>
            ينتهي: {expiryMonth}/{expiryYear}
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {!isDefault && onSetDefault && (
            <Pressable
              onPress={onSetDefault}
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.actionText, { color: colors.primary }]}>
                اجعلها افتراضية
              </Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.actionText, { color: colors.error }]}>
                حذف
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  expiryDate: {
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
