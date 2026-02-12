import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  rightAction,
}: ScreenHeaderProps) {
  const colors = useColors();
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}
      className="border-b px-4 py-4"
    >
      <View className="flex-row items-center justify-between mb-2">
        {showBackButton ? (
          <Pressable
            onPress={handleBack}
            className="flex-row items-center gap-2 py-2 px-2 -ml-2"
          >
            <Text style={{ color: colors.primary }} className="text-lg font-semibold">
              ← رجوع
            </Text>
          </Pressable>
        ) : (
          <View />
        )}

        {rightAction && <View>{rightAction}</View>}
      </View>

      <Text style={{ color: colors.foreground }} className="text-2xl font-bold">
        {title}
      </Text>

      {subtitle && (
        <Text style={{ color: colors.muted }} className="text-sm mt-1">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
