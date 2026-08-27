import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 7,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Ассистент", tabBarIcon: ({ color }) => <MaterialIcons name="chat-bubble-outline" size={23} color={color} /> }} />
      <Tabs.Screen name="tools" options={{ title: "Инструменты", tabBarIcon: ({ color }) => <MaterialIcons name="grid-view" size={23} color={color} /> }} />
      <Tabs.Screen name="materials" options={{ title: "Материалы", tabBarIcon: ({ color }) => <MaterialIcons name="folder-open" size={23} color={color} /> }} />
      <Tabs.Screen name="github" options={{ title: "GitHub", tabBarIcon: ({ color }) => <MaterialIcons name="code" size={23} color={color} /> }} />
    </Tabs>
  );
}
