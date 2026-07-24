import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
          <Ionicons name="lock-closed" size={48} color="#fff" style={styles.lockIcon} />
          <Text style={styles.lockTitle}>Premium Feature</Text>
          <Text style={styles.lockDesc}>
            The Weekly Meal Planner is available to Premium members. Unlock dietitian-inspired meal plans based on your purchase history.
          </Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>What you get:</Text>
            {[
              { icon: "sunny-outline", text: "Breakfast suggestions every day" },
              { icon: "partly-sunny-outline", text: "Personalised lunch ideas" },
              { icon: "moon-outline", text: "Balanced dinner plans" },
              { icon: "nutrition-outline", text: "Smart snack recommendations" },
              { icon: "bulb-outline", text: "Daily wellness tips" },
            ].map((item, i) => (
              <View key={i} style={styles.previewRow}>
                <Ionicons name={item.icon as React.ComponentProps<typeof Ionicons>["name"]} size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.previewItem}>{item.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/upgrade")}
          >
            <Text style={styles.upgradeButtonText}>Go Premium as from C$4.17/month</Text>
          </TouchableOpacity>
          <View style={styles.freeNoteRow}>
            <Ionicons name="checkmark-circle" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={styles.freeNote}>Scanning & shopping list always free</Text>
          </View>
        </View>
      </View>
    );
  }

  return <MealPlannerScreen onBack={() => {}} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F0A3", justifyContent: "center", padding: 24 },
  lockBox: { backgroundColor: "#2D6A2D", borderRadius: 24, padding: 28, alignItems: "center" },
  lockIcon: { marginBottom: 12 },
  lockTitle: { fontSize: 24, fontWeight: "700", color: "white", marginBottom: 10 },
  lockDesc: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  previewCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 16, width: "100%", marginBottom: 20 },
  previewTitle: { fontSize: 14, fontWeight: "700", color: "white", marginBottom: 10 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  previewItem: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  upgradeButton: { backgroundColor: "#42D674", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 },
  upgradeButtonText: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  freeNoteRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  freeNote: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
});
