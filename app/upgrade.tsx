import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { setPremium, setFamilyPlan } from "../components/premiumService";

const API_BASE_URL = "https://api.wellvalet.com";

const DEFAULT_PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    badge: null,
    price: "C$5.99",
    priceNum: 5.99,
    period: "/month",
    total: "C$5.99 billed monthly",
    saving: null,
    color: "#2D6A2D",
    family: false,
  },

  {
    id: "yearly",
    label: "Annual",
    badge: "BEST VALUE",
    price: "C$49.99",
    priceNum: 49.99,
    period: "/year",
    total: "C$49.99 billed annually",
    saving: "As low as C$4.17/month · Save 31% vs monthly",
    color: "#1a4a1a",
    family: false,
  },
  {
    id: "family",
    label: "Family Plan",
    badge: "UP TO 4 MEMBERS",
    price: "C$60",
    priceNum: 60,
    period: "/year",
    total: "C$60.00 billed annually",
    saving: "Up to 4 family members · Shared shopping list",
    color: "#1565C0",
    family: true,
  },
];

const PREMIUM_FEATURES = [
  { icon: "🔬", title: "Full Nutrition Analysis", desc: "Calories, Sugar, Fat and Salt per 100g for every scanned product." },
  { icon: "🎯", title: "Personalised Recommendations", desc: "AI-powered advice tailored to your age, weight, goals and health conditions." },
  { icon: "💡", title: "Better Alternative Suggestions", desc: "Smarter choices suggested every time you scan a product rated Care." },
  { icon: "📋", title: "Full Ingredient List", desc: "Complete ingredient breakdown with allergen highlights." },
  { icon: "📊", title: "Purchase History", desc: "Track every product you have bagged and filter by Good, Moderate or Care." },
  { icon: "🍽️", title: "Weekly Meal Planner", desc: "Dietitian-inspired meal plans generated from your purchase history." },
  { icon: "👤", title: "Wellness Profile", desc: "Personalise your experience with your health goals, conditions and allergies." },
  { icon: "💄", title: "Beauty Product Scanning", desc: "Scan any beauty or personal care product and get a full ingredient safety analysis." },
  { icon: "📷", title: "OCR Ingredient Scanner", desc: "Point your camera at any ingredients label and get an instant safety analysis." },
  { icon: "👨‍👩‍👧‍👦", title: "Family Shopping List", desc: "Share a live shopping list with up to 4 family members. See who added what!" },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);

  // Load live pricing from backend
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/config/plans`);
        const data = await res.json();
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans.map((p: any) => ({
            id:       p.plan_key,
            label:    p.label,
            badge:    p.badge,
            price:    `C$${Number(p.price).toFixed(p.period === "/year" ? 0 : 2)}`,
            priceNum: p.price,
            period:   p.period,
            total:    p.billing_cycle === "yearly"
                        ? `C$${Number(p.price).toFixed(2)} billed annually`
                        : `C$${Number(p.price).toFixed(2)} billed monthly`,
            saving:   p.trial_days > 0
                        ? `🎁 First ${p.trial_days} days FREE, then C$${Number(p.price).toFixed(2)}${p.period}`
                        : null,
            color:    p.color,
            family:   p.is_family,
            trialDays: p.trial_days,
          })));
        }
      } catch {
        // Use defaults on error
      }
      setLoading(false);
    };
    loadPricing();
  }, []);

  const plan = plans.find(p => p.id === selectedPlan) || plans[1];

  const handleSubscribe = async () => {
    Alert.alert(
      "Coming Soon! 🎉",
      "In-app payments will be available when WellValet launches on the App Store and Google Play.\n\nFor now, we are activating Premium for you to test all features!",
      [
        {
          text: "Activate Premium (Test)",
          onPress: async () => {
            await setPremium(true);
            if (selectedPlan === "family") {
              await setFamilyPlan(true);
            } else {
              await setFamilyPlan(false);
            }
            Alert.alert(
              "Premium Activated! ⭐",
              selectedPlan === "family"
                ? "Family Plan activated! You can now set up your family shopping list."
                : "You now have full access to all Premium features. Enjoy WellValet!",
              [{ text: "Let\'s Go!", onPress: () => router.replace("/(tabs)") }]
            );
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A2D" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>⭐</Text>
        <Text style={styles.heroTitle}>Go Premium</Text>
        <Text style={styles.heroSubtitle}>Unlock the full WellValet experience</Text>
        <Text style={styles.heroFrom}>from C$4.17/month</Text>
      </View>

      <Text style={styles.sectionTitle}>Choose your plan</Text>
      <View style={styles.plansContainer}>
        {plans.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.planCard,
              selectedPlan === p.id && styles.planCardSelected,
              p.family && styles.familyCard,
            ]}
            onPress={() => setSelectedPlan(p.id)}
          >
            {p.badge && (
              <View style={[styles.planBadge, { backgroundColor: p.color }]}>
                <Text style={styles.planBadgeText}>{p.badge}</Text>
              </View>
            )}
            <Text style={[styles.planLabel, p.family && { color: "#1565C0" }]}>{p.label}</Text>
            <View style={styles.planPriceRow}>
              <Text style={[styles.planPrice, selectedPlan === p.id && { color: p.color }]}>{p.price}</Text>
              <Text style={styles.planPeriod}>{p.period}</Text>
            </View>
            <Text style={styles.planTotal}>{p.total}</Text>
            {p.saving && (
              <Text style={[styles.planSaving, { color: p.color }]}>🎉 {p.saving}</Text>
            )}
            {selectedPlan === p.id && (
              <View style={[styles.planSelectedDot, { backgroundColor: p.color }]}>
                <Text style={styles.planSelectedCheck}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.subscribeButton, { backgroundColor: plan.color }]}
        onPress={handleSubscribe}
      >
        <Text style={styles.subscribeButtonText}>
          {(plan as any).trialDays > 0 ? `Start Free Trial — ${plan.price}${plan.period}` : `Subscribe — ${plan.price}${plan.period}`}
        </Text>
        <Text style={styles.subscribeButtonSub}>{plan.total}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Free vs Premium</Text>
      <View style={styles.comparisonCard}>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonHeader}>Feature</Text>
          <Text style={styles.comparisonHeaderFree}>Free</Text>
          <Text style={styles.comparisonHeaderPremium}>Premium</Text>
        </View>
        <View style={styles.divider} />
        <ComparisonRow feature="Food barcode scanning" free={true} premium={true} />
        <ComparisonRow feature="Health score" free={true} premium={true} />
        <ComparisonRow feature="Allergen alerts" free={true} premium={true} />
        <ComparisonRow feature="Personal shopping list" free={true} premium={true} />
        <ComparisonRow feature="Beauty product scanning" free={false} premium={true} />
        <ComparisonRow feature="OCR ingredient scanner" free={false} premium={true} />
        <ComparisonRow feature="Full nutrition details" free={false} premium={true} />
        <ComparisonRow feature="Personalised recommendations" free={false} premium={true} />
        <ComparisonRow feature="Better alternatives" free={false} premium={true} />
        <ComparisonRow feature="Ingredient list" free={false} premium={true} />
        <ComparisonRow feature="Purchase history" free={false} premium={true} />
        <ComparisonRow feature="Meal planner" free={false} premium={true} />
        <ComparisonRow feature="Wellness profile" free={false} premium={true} />
        <ComparisonRow feature="Family shopping list" free={false} premium={true} />
        <ComparisonRow feature="Up to 4 family members" free={false} premium={true} />
      </View>

      <Text style={styles.sectionTitle}>What you get with Premium</Text>
      {PREMIUM_FEATURES.map((feature, index) => (
        <View key={index} style={styles.featureCard}>
          <Text style={styles.featureIcon}>{feature.icon}</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.subscribeButton, { backgroundColor: plan.color }]}
        onPress={handleSubscribe}
      >
        <Text style={styles.subscribeButtonText}>
          {(plan as any).trialDays > 0 ? `Start Free Trial — ${plan.price}${plan.period}` : `Subscribe — ${plan.price}${plan.period}`}
        </Text>
        <Text style={styles.subscribeButtonSub}>{plan.total}</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Subscription automatically renews. Cancel anytime through your App Store or Google Play account settings. Payment will be charged to your account upon confirmation of purchase. Prices in Canadian dollars.
      </Text>
    </ScrollView>
  );
}

function ComparisonRow({ feature, free, premium }: { feature: string; free: boolean; premium: boolean }) {
  return (
    <View style={styles.comparisonRow}>
      <Text style={styles.comparisonFeature}>{feature}</Text>
      <Text style={styles.comparisonValue}>{free ? "✅" : "❌"}</Text>
      <Text style={styles.comparisonValue}>{premium ? "✅" : "❌"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 60, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#E3F0A3" },
  backButton: { marginBottom: 20 },
  backText: { fontSize: 16, color: "#2D6A2D", fontWeight: "600" },
  hero: { backgroundColor: "#2D6A2D", borderRadius: 24, padding: 32, alignItems: "center", marginBottom: 24 },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 32, fontWeight: "900", color: "white", marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 8 },
  heroFrom: { fontSize: 14, color: "#42D674", fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 16, marginTop: 8 },
  plansContainer: { gap: 12, marginBottom: 24 },
  planCard: { backgroundColor: "white", borderRadius: 16, padding: 20, borderWidth: 2, borderColor: "#E8E8E8", position: "relative" },
  planCardSelected: { borderColor: "#42D674", backgroundColor: "#f0fff4" },
  familyCard: { borderColor: "#BBDEFB", backgroundColor: "#E3F2FD" },
  planBadge: { position: "absolute", top: -10, right: 16, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  planBadgeText: { fontSize: 11, fontWeight: "700", color: "white", letterSpacing: 1 },
  planLabel: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  planPriceRow: { flexDirection: "row", alignItems: "flex-end", gap: 2, marginBottom: 4 },
  planPrice: { fontSize: 32, fontWeight: "900", color: "#1a1a1a" },
  planPeriod: { fontSize: 14, color: "#888", marginBottom: 6 },
  planTotal: { fontSize: 13, color: "#666", marginBottom: 4 },
  planSaving: { fontSize: 13, fontWeight: "600" },
  planSelectedDot: { position: "absolute", top: 16, right: 16, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  planSelectedCheck: { color: "white", fontSize: 14, fontWeight: "700" },
  subscribeButton: { borderRadius: 25, paddingVertical: 18, alignItems: "center", marginBottom: 24 },
  subscribeButtonText: { fontSize: 17, fontWeight: "700", color: "white" },
  subscribeButtonSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  comparisonCard: { backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 24 },
  comparisonRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  comparisonHeader: { flex: 2, fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  comparisonHeaderFree: { flex: 1, fontSize: 14, fontWeight: "700", color: "#666", textAlign: "center" },
  comparisonHeaderPremium: { flex: 1, fontSize: 14, fontWeight: "700", color: "#2D6A2D", textAlign: "center" },
  comparisonFeature: { flex: 2, fontSize: 13, color: "#444" },
  comparisonValue: { flex: 1, fontSize: 16, textAlign: "center" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 4 },
  featureCard: { backgroundColor: "white", borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "flex-start", gap: 14 },
  featureIcon: { fontSize: 28, marginTop: 2 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  featureDesc: { fontSize: 13, color: "#666", lineHeight: 20 },
  disclaimer: { fontSize: 11, color: "#888", textAlign: "center", lineHeight: 18 },
});
