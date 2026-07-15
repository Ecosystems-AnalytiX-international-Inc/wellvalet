import { Tabs } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#E3F0A3",
          borderTopWidth: 1,
          borderTopColor: "#c5d97a",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: "#2D6A2D",
        tabBarInactiveTintColor: "#555",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="menu-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="barcode-reader" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mealplanner"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="archive-outline" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
