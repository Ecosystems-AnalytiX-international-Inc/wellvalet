import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  SafeAreaView, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { setPremium, setFamilyPlan } from "../components/premiumService";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];
type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type PerkIcon =
  | { family: "Ionicons"; name: IoniconName }
  | { family: "MaterialCommunityIcons"; name: MCIName };

const PERKS: { icon: PerkIcon; text: string }[] = [
  { icon: { family: "Ionicons",                name: "lock-open-outline" },   text: "Unlimited barcode scanning" },
  { icon: { family: "Ionicons",                name: "warning-outline" },     text: "Allergen alerts from your profile" },
  { icon: { family: "MaterialCommunityIcons",  name: "flask-outline" },       text: "Full ingredient & nutrition breakdown" },
  { icon: { family: "Ionicons",                name: "bulb-outline" },        text: "Better alternative suggestions" },
  { icon: { family: "MaterialCommunityIcons",  name: "robot-outline" },       text: "AI Valet — unlimited questions" },
  { icon: { family: "Ionicons",                name: "clipboard-outline" },   text: "Full purchase history" },
  { icon: { family: "Ionicons",                name: "restaurant-outline" },  text: "Weekly meal planner" },
  { icon: { family: "Ionicons",                name: "people-outline" },      text: "Family shopping list (Family plan)" },
];

function PerkIconRender({ icon }: { icon: PerkIcon }) {
  if (icon.family === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={icon.name} size={14} color="rgba(255,255,255,0.85)" />;
  }
  return <Ionicons name={icon.name} size={14} color="rgba(255,255,255,0.85)" />;
}

const API_BASE_URL = "https://api.wellvalet.com";
const OFFER_SHOWN_KEY = "TRIAL_OFFER_SHOWN";

// Default annual plan — shown while backend loads
const DEFAULT_ANNUAL = {
  id: "yearly",
  label: "Annual",
  badge: "BEST VALUE · AS LOW AS C$4.17/mo",
  price: "C$49.99",
  priceNum: 49.99,
  period: "/year",
  perMonth: "C$4.17/month",
  total: "C$49.99 billed annually",
  trialDays: 7,
  color: "#2D6A2D",
};

const DEFAULT_MONTHLY = {
  id: "monthly",
  label: "Monthly",
  badge: null,
  price: "C$5.99",
  priceNum: 5.99,
  period: "/month",
  total: "C$5.99 billed monthly",
  trialDays: 0,
  color: "#666",
};

export default function TrialOfferScreen() {
  const router = useRouter();
  const [annualPlan, setAnnualPlan] = useState<any>(DEFAULT_ANNUAL);
  const [monthlyPlan, setMonthlyPlan] = useState<any>(DEFAULT_MONTHLY);
  const [selected, setSelected] = useState("yearly");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Load user allergies from wellness profile
      try {
        const profile = await AsyncStorage.getItem("WELLNESS_PROFILE");
        if (profile) {
          const parsed = JSON.parse(profile);
          if (parsed.allergies && Array.isArray(parsed.allergies)) {
            setAllergies(parsed.allergies.slice(0, 3));
          }
        }
      } catch {}

      // Load live plans from backend
      try {
        const res = await fetch(`${API_BASE_URL}/config/plans`);
        const data = await res.json();
        if (data.plans) {
          const annual = data.plans.find((p: any) =>
            p.plan_key === "yearly" || p.billing_cycle === "yearly"
          );
          const monthly = data.plans.find((p: any) =>
            p.plan_key === "monthly" || p.billing_cycle === "monthly"
          );
          if (annual) {
            setAnnualPlan({
              id: annual.plan_key,
              label: "Annual",
              badge: "BEST VALUE · SAVE 33%",
              price: `C$${Number(annual.price / 12).toFixed(2)}`,
              priceNum: annual.price,
              period: "/month",
              total: `C$${Number(annual.price).toFixed(2)} billed annually`,
              trialDays: annual.trial_days || 7,
              color: "#2D6A2D",
            });
          }
          if (monthly) {
            setMonthlyPlan({
              id: monthly.plan_key,
              label: "Monthly",
              badge: null,
              price: `C$${Number(monthly.price).toFixed(2)}`,
              priceNum: monthly.price,
              period: "/month",
              total: `C$${Number(monthly.price).toFixed(2)} billed monthly`,
              trialDays: monthly.trial_days || 0,
              color: "#666",
            });
          }
        }
      } catch {}
      setLoading(false);
    };
    init();
  }, []);

  const activePlan = selected === "yearly" ? annualPlan : monthlyPlan;

  const handleSubscribe = async () => {
    setSubscribing(true);
    // Mark offer as shown so it never appears again on login
    await AsyncStorage.setItem(OFFER_SHOWN_KEY, "true");
    // TODO: Replace with RevenueCat purchase call at launch
    await setPremium(true);
    await setFamilyPlan(false);
    setSubscribing(false);
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    // Mark shown — free user skipped, never show again on launch
    await AsyncStorage.setItem(OFFER_SHOWN_KEY, "true");
    router.replace("/(tabs)");
  };

  const allergyLine = allergies.length > 0
    ? `We will flag ${allergies.join(", ")} on every scan.`
    : "We will alert you to allergens on every product you scan.";

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2D6A2D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Ionicons name="cart-outline" size={52} color="#fff" style={styles.heroIcon} />
          <Text style={styles.heroTitle}>Your Valet is ready.</Text>
          <Text style={styles.heroSub}>{allergyLine}</Text>
          {annualPlan.trialDays > 0 && (
            <View style={styles.trialBadge}>
              <View style={styles.trialBadgeRow}>
                <Ionicons name="gift-outline" size={14} color="#1a3a1a" />
                <Text style={styles.trialBadgeText}>
                  {annualPlan.trialDays}-Day Free Trial — No charge today
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Plan selector ── */}
        <Text style={styles.sectionTitle}>Choose your plan</Text>

        {/* Annual — default selected */}
        <TouchableOpacity
          style={[styles.planCard, styles.planCardFeatured,
            selected === "yearly" && styles.planCardSelected]}
          onPress={() => setSelected("yearly")}
          activeOpacity={0.85}
        >
          <View style={styles.planBadgeRow}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>BEST VALUE · SAVE 33%</Text>
            </View>
            {selected === "yearly" && (
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.planLabel}>Annual Plan</Text>
          <View style={styles.priceRow}>
            <Text style={styles.planPrice}>{annualPlan.price}</Text>
            <Text style={styles.planPeriod}>/month</Text>
          </View>
          <Text style={styles.planTotal}>{annualPlan.total}</Text>
          {annualPlan.trialDays > 0 && (
            <View style={styles.trialLineRow}>
              <Ionicons name="checkmark-circle" size={13} color="#42D674" />
              <Text style={styles.trialLine}>
                First {annualPlan.trialDays} days free, then {annualPlan.total}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Monthly — secondary */}
        <TouchableOpacity
          style={[styles.planCard,
            selected === "monthly" && styles.planCardSelected]}
          onPress={() => setSelected("monthly")}
          activeOpacity={0.85}
        >
          <View style={styles.planBadgeRow}>
            <Text style={styles.planLabel}>Monthly Plan</Text>
            {selected === "monthly" && (
              <View style={[styles.checkCircle, { backgroundColor: "#666" }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, { color: "#444" }]}>{monthlyPlan.price}</Text>
            <Text style={styles.planPeriod}>/month</Text>
          </View>
          <Text style={styles.planTotal}>{monthlyPlan.total}</Text>
        </TouchableOpacity>

        {/* ── CTA ── */}
        <TouchableOpacity
          style={[styles.ctaButton, subscribing && styles.ctaDisabled]}
          onPress={handleSubscribe}
          disabled={subscribing}
        >
          {subscribing
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ctaText}>
                {activePlan.trialDays > 0
                  ? `Start ${activePlan.trialDays}-Day Free Trial`
                  : `Subscribe — ${activePlan.price}/month`}
              </Text>
          }
        </TouchableOpacity>
        <Text style={styles.ctaSub}>
          {activePlan.trialDays > 0
            ? `No charge today. Then ${activePlan.total}. Cancel anytime.`
            : `${activePlan.total}. Cancel anytime.`}
        </Text>

        {/* ── What is included ── */}
        <View style={styles.perksBox}>
          <Text style={styles.perksTitle}>Everything in Premium:</Text>
          {PERKS.map((perk, i) => (
            <View key={i} style={styles.perkRow}>
              <PerkIconRender icon={perk.icon} />
              <Text style={styles.perkLine}>{perk.text}</Text>
            </View>
          ))}
        </View>

        {/* ── Skip link ── */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Continue with the free version</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Subscription renews automatically. Cancel any time through your App Store
          or Google Play account settings. Prices in Canadian dollars. HST may apply.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper:          { flex: 1, backgroundColor: "#1a3a1a" },
  loading:          { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a3a1a" },
  container:        { padding: 24, paddingBottom: 48 },

  // Hero
  hero:             { alignItems: "center", paddingVertical: 32, paddingHorizontal: 16 },
  heroIcon:         { marginBottom: 12 },
  heroTitle:        { fontSize: 28, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 10 },
  heroSub:          { fontSize: 15, color: "rgba(255,255,255,0.80)", textAlign: "center", lineHeight: 22, marginBottom: 16 },
  trialBadge:       { backgroundColor: "#42D674", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  trialBadgeRow:    { flexDirection: "row", alignItems: "center", gap: 6 },
  trialBadgeText:   { fontSize: 13, fontWeight: "700", color: "#1a3a1a" },

  // Plans
  sectionTitle:     { fontSize: 16, fontWeight: "700", color: "#E3F0A3", marginBottom: 12 },
  planCard:         { backgroundColor: "rgba(255,255,255,0.10)", borderRadius: 16, padding: 18,
                      borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", marginBottom: 12 },
  planCardFeatured: { borderColor: "#42D674", backgroundColor: "rgba(66,214,116,0.10)" },
  planCardSelected: { borderColor: "#42D674", backgroundColor: "rgba(66,214,116,0.15)" },
  planBadgeRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  bestValueBadge:   { backgroundColor: "#42D674", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  bestValueText:    { fontSize: 10, fontWeight: "800", color: "#1a3a1a", letterSpacing: 0.5 },
  checkCircle:      { width: 24, height: 24, borderRadius: 12, backgroundColor: "#2D6A2D",
                      alignItems: "center", justifyContent: "center" },
  planLabel:        { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 6 },
  priceRow:         { flexDirection: "row", alignItems: "flex-end", gap: 3, marginBottom: 4 },
  planPrice:        { fontSize: 34, fontWeight: "900", color: "#42D674" },
  planPeriod:       { fontSize: 14, color: "rgba(255,255,255,0.60)", marginBottom: 6 },
  planTotal:        { fontSize: 13, color: "rgba(255,255,255,0.60)" },
  trialLineRow:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  trialLine:        { fontSize: 12, color: "#42D674", fontWeight: "600" },

  // CTA
  ctaButton:        { backgroundColor: "#42D674", borderRadius: 30, paddingVertical: 18,
                      alignItems: "center", marginTop: 8, marginBottom: 10 },
  ctaDisabled:      { opacity: 0.6 },
  ctaText:          { fontSize: 17, fontWeight: "800", color: "#1a3a1a" },
  ctaSub:           { fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "center", marginBottom: 24 },

  // Perks
  perksBox:         { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16,
                      padding: 18, marginBottom: 24 },
  perksTitle:       { fontSize: 14, fontWeight: "700", color: "#E3F0A3", marginBottom: 12 },
  perkRow:          { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  perkLine:         { fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 20, flex: 1 },

  // Skip + disclaimer
  skipBtn:          { alignItems: "center", marginBottom: 20 },
  skipText:         { fontSize: 13, color: "rgba(255,255,255,0.45)", textDecorationLine: "underline" },
  disclaimer:       { fontSize: 10, color: "rgba(255,255,255,0.30)", textAlign: "center", lineHeight: 16 },
});
