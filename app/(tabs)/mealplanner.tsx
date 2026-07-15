import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { isPremium } from "../../components/premiumService";
import MealPlannerScreen from "../../components/MealPlannerScreen";

export default function MealPlannerTab() {
  const [premium, setPremiumState] = useState(false);
  const router = useRouter();

  const [premiumChecked, setPremiumChecked] = useState(false);

  useEffect(() => {
    isPremium().then(val => {
      setPremiumState(val);
      setPremiumChecked(true);
    });
  }, []);

  // Wait until premium status is confirmed before rendering
  if (!premiumChecked) {
    return (
      <View style={styles.container}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#2D6A2D", fontSize: 16 }}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!premium) {
    return (
      <View style={styles.container}>
        <View style={styles.lockBox}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>Premium Feature</Text>
          <Text style={styles.lockDesc}>
            The Weekly Meal Planner is available to Premium members. Unlock dietitian-inspired meal plans based on your purchase history.
          </Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>What you get:</Text>
            <Text style={styles.previewItem}>🌅 Breakfast suggestions every day</Text>
            <Text style={styles.previewItem}>☀️ Personalised lunch ideas</Text>
            <Text style={styles.previewItem}>🌙 Balanced dinner plans</Text>
            <Text style={styles.previewItem}>🍎 Smart snack recommendations</Text>
            <Text style={styles.previewItem}>💡 Daily wellness tips</Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/upgrade")}
          >
            <Text style={styles.upgradeButtonText}>Go Premium as from C$4.17/month</Text>
          </TouchableOpacity>
          <Text style={styles.freeNote}>✅ Scanning & shopping list always free</Text>
        </View>
      </View>
    );
  }

  return <MealPlannerScreen onBack={() => {}} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F0A3", justifyContent: "center", padding: 24 },
  lockBox: { backgroundColor: "#2D6A2D", borderRadius: 24, padding: 28, alignItems: "center" },
  lockIcon: { fontSize: 48, marginBottom: 12 },
  lockTitle: { fontSize: 24, fontWeight: "700", color: "white", marginBottom: 10 },
  lockDesc: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  previewCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 16, width: "100%", marginBottom: 20 },
  previewTitle: { fontSize: 14, fontWeight: "700", color: "white", marginBottom: 10 },
  previewItem: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 8 },
  upgradeButton: { backgroundColor: "#42D674", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 },
  upgradeButtonText: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  freeNote: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
});
