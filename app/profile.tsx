import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isPremium, clearPremium, setFamilyPlan, isFamilyPlan } from "../components/premiumService";
import { fetchWithAuth, logout } from "../components/authService";
import { useEffect, useState } from "react";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [premium, setPremiumState] = useState(false);
  const [familyPlanActive, setFamilyPlanActive] = useState(false);
  const [hasFamily, setHasFamily] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");

  useEffect(() => {
    isPremium().then(setPremiumState);
    isFamilyPlan().then(val => {
      setFamilyPlanActive(val);
      if (val) {
        fetchWithAuth('https://api.wellvalet.com/family')
          .then(r => r.json())
          .then(d => {
            if (d && !d.error && d.family_name) {
              setHasFamily(true);
            } else {
              setHasFamily(false);
            }
          })
          .catch(() => { setHasFamily(false); });
      }
    }).catch(() => {});
  }, []);

  const handleUnsubscribe = async () => {
    Alert.alert(
      "Unsubscribe from Premium?",
      "You will lose access to all Premium features including nutrition details, purchase history and meal planner.",
      [
        {
          text: "Yes, Unsubscribe",
          style: "destructive",
          onPress: async () => {
            await clearPremium();
            await setFamilyPlan(false);
            setPremiumState(false);
            // Clear trial offer flag so paywall shows again on next profile save
            const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
            await AsyncStorage.removeItem("TRIAL_OFFER_SHOWN");
            Alert.alert("Unsubscribed", "You have been unsubscribed from Premium. You can resubscribe anytime.");
          }
        },
        { text: "Keep Premium", style: "cancel" }
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.wrapper}>
    <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile & Account</Text>
        <Text style={styles.profileIcon}>👤</Text>
      </View>

      {/* Wellness Profile Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Wellness Profile</Text>
        <Text style={styles.cardText}>
          Edit your Age, Height, Weight Goals, Concerns and Allergies
        </Text>
        <TouchableOpacity
          style={styles.darkButton}
          onPress={() => router.push("/wellness-profile")}
        >
          <Text style={styles.darkButtonText}>Edit Wellness Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Family Card — only shown for family plan users */}
      {familyPlanActive && (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👨‍👩‍👧‍👦 Family Plan</Text>
        {hasFamily ? (
          <>
            <Text style={styles.cardText}>
              You are part of a family group. Manage your group or create a new one.
            </Text>
            <TouchableOpacity
              style={styles.darkButton}
              onPress={() => router.push("/family-manage")}
            >
              <Text style={styles.darkButtonText}>⚙️ Manage Family Group</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.darkButton}
              onPress={() => router.push("/family-setup")}
            >
              <Text style={styles.darkButtonText}>➕ Create New Family Group</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.cardText}>
              Create a family group or join one using an invite code from the family admin.
            </Text>
            <TouchableOpacity
              style={styles.darkButton}
              onPress={() => router.push("/family-setup")}
            >
              <Text style={styles.darkButtonText}>➕ Create a Family Group</Text>
            </TouchableOpacity>
            <Text style={[styles.cardText, { marginTop: 16, fontWeight: "700" }]}>
              Join with Invite Code
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <TextInput
                style={[styles.darkButton, { flex: 1, color: "#fff", fontSize: 15,
                  textAlign: "center", letterSpacing: 4 }]}
                placeholder="Enter code"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity
                style={[styles.darkButton, { paddingHorizontal: 20,
                  opacity: joiningFamily ? 0.5 : 1 }]}
                disabled={joiningFamily || inviteCode.length < 4}
                onPress={async () => {
                  setJoiningFamily(true);
                  setJoinMessage("");
                  try {
                    const res = await fetchWithAuth('https://api.wellvalet.com/family/join', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ invite_code: inviteCode.trim(), display_name: '' }),
                    });
                    const data = await res.json();
                    if (data.error) {
                      setJoinMessage('❌ ' + data.error);
                    } else {
                      setHasFamily(true);
                      setJoinMessage('✅ Joined successfully!');
                    }
                  } catch {
                    setJoinMessage('❌ Could not join. Please try again.');
                  }
                  setJoiningFamily(false);
                }}
              >
                <Text style={styles.darkButtonText}>
                  {joiningFamily ? "..." : "Join"}
                </Text>
              </TouchableOpacity>
            </View>
            {joinMessage ? (
              <Text style={{ marginTop: 8, fontSize: 13,
                color: joinMessage.startsWith("✅") ? "#2D6A2D" : "#dc2626" }}>
                {joinMessage}
              </Text>
            ) : null}
          </>
        )}
      </View>
      )}

      {/* About your App Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About your App</Text>
        <TouchableOpacity style={styles.darkButton} onPress={() => router.push("/faq")}>
          <Text style={styles.darkButtonText}>FAQ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.darkButton} onPress={() => router.push("/contact")}>
          <Text style={styles.darkButtonText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Card */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        {premium ? (
          <TouchableOpacity style={[styles.unsubscribeButton, {marginTop: 10}]} onPress={handleUnsubscribe}>
            <Text style={styles.unsubscribeButtonText}>⭐ Premium — Unsubscribe</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.upgradeButton, {marginTop: 10}]} onPress={() => router.push("/upgrade")}>
            <Text style={styles.upgradeButtonText}>⭐ Go Premium as from C$4.17/month</Text>
          </TouchableOpacity>
        )}

        <View style={styles.legalLinksRow}>
          <TouchableOpacity onPress={() => router.push("/privacy")}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => router.push("/terms")}>
            <Text style={styles.legalLink}>Terms and Conditions</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>

    {/* Bottom Navigation Bar */}
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4 }]}>
      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace("/(tabs)")}>
        <Ionicons name="home-outline" size={26} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace("/(tabs)/shopping")}>
        <Ionicons name="menu-outline" size={26} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace("/(tabs)/scan")}>
        <MaterialIcons name="barcode-reader" size={26} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace("/(tabs)/mealplanner")}>
        <Ionicons name="book-outline" size={26} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => router.replace("/(tabs)/history")}>
        <Ionicons name="archive-outline" size={26} color="#555" />
      </TouchableOpacity>
    </View>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#E3F0A3" },
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 60, paddingBottom: 40 },
  tabBar: { flexDirection: "row", backgroundColor: "#E3F0A3", borderTopWidth: 1, borderTopColor: "#c5d97a", paddingTop: 4, minHeight: 60 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1a1a1a" },
  profileIcon: { fontSize: 26 },
  card: { backgroundColor: "#D6EAA0", borderRadius: 14, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  cardText: { fontSize: 13, color: "#444", marginBottom: 14, lineHeight: 20 },
  darkButton: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 13, alignItems: "center", marginBottom: 10 },
  darkButtonText: { fontSize: 14, color: "white", fontWeight: "500" },
  upgradeButton: { backgroundColor: "#42D674", borderRadius: 25, paddingVertical: 13, alignItems: "center", marginBottom: 10 },
  upgradeButtonText: { fontSize: 14, color: "#1a1a1a", fontWeight: "700" },
  unsubscribeButton: { backgroundColor: "#fff3f3", borderWidth: 1.5, borderColor: "#F44336", borderRadius: 25, paddingVertical: 13, alignItems: "center", marginBottom: 10 },
  unsubscribeButtonText: { fontSize: 14, color: "#F44336", fontWeight: "700" },
  logoutButton: { borderWidth: 1.5, borderColor: "red", borderRadius: 25, paddingVertical: 13, alignItems: "center" },
  logoutButtonText: { fontSize: 14, color: "red", fontWeight: "500" },
  legalLinksRow: { flexDirection: "row", justifyContent: "center", alignItems: "center",
                    marginTop: 16, gap: 8 },
  legalLink: { fontSize: 12, color: "#555", textDecorationLine: "underline" },
  legalDot: { fontSize: 12, color: "#888" },
});
