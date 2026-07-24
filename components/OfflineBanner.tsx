import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOnlineStatus } from "./useOnlineStatus";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel="No Internet Connection. You are currently offline."
    >
      <Ionicons name="warning-outline" size={14} color="#ffffff" />
      <Text style={styles.text}>No Internet Connection (Offline Mode)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  text: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
