import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useIsFocused } from '@react-navigation/native';
import { databaseService, DBMessage } from '@/lib/services/database-service';

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
  const isFocused = useIsFocused();
  const [messages, setMessages] = useState<DBMessage[]>([]);

  useEffect(() => {
    if (isFocused) {
      loadMessages();
    }
  }, [isFocused]);

  const loadMessages = async () => {
    try {
      const msgs = await databaseService.getRecentMessages();
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

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

  const renderMessage = ({ item }: { item: DBMessage }) => (
    <View className="bg-surface rounded-lg p-3 mb-2 border border-border flex-row items-center">
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
        item.type === 'whatsapp' ? 'bg-green-500/10' : 'bg-blue-500/10'
      }`}>
        <Text>{item.type === 'whatsapp' ? '📱' : '💬'}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-semibold text-foreground">{item.phoneNumber}</Text>
          <Text className="text-xs text-muted">
            {new Date(item.createdAt || item.timestamp).toLocaleTimeString('ar-SA')}
          </Text>
        </View>
        <Text numberOfLines={1} className="text-sm text-muted text-left">{item.message}</Text>
      </View>
      <View className="ml-2 items-end">
        <View className="flex-row items-center gap-1 mb-1">
          <Text className="text-xs text-muted">
             {item.direction === 'inbound' ? 'وارد' : 'صادر'}
          </Text>
          <Text>{item.direction === 'inbound' ? '⬇️' : '⬆️'}</Text>
        </View>
        <Text className={`text-xs font-bold ${
          item.status === 'sent' ? 'text-success' : 
          item.status === 'failed' ? 'text-error' : 
          item.status === 'pending' ? 'text-warning' : 'text-muted'
        }`}>
          {item.status}
        </Text>
      </View>
    </View>
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

          {/* Recent Messages */}
          <View className="mt-6">
            <View className="flex-row justify-between items-center mb-3">
               <Text className="text-xl font-bold text-foreground">آخر الرسائل</Text>
               <TouchableOpacity onPress={loadMessages}>
                 <Text className="text-primary text-sm">تحديث</Text>
               </TouchableOpacity>
            </View>
            
            {messages.length === 0 ? (
               <Text className="text-muted text-center py-4 bg-surface rounded-lg border border-border">لا توجد رسائل حديثة</Text>
            ) : (
              <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
