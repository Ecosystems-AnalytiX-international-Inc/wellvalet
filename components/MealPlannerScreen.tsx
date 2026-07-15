import { useState, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { getPurchaseHistory } from "./historyService";
import { fetchWithAuth } from "./authService";
import { getUserProfile } from "./profileService";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const API_BASE_URL = "https://api.wellvalet.com";

export default function MealPlannerScreen({ onBack }: any) {
  const insets = useSafeAreaInsets();
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [recipeModal, setRecipeModal] = useState(false);
  const [bbcUrl, setBbcUrl]           = useState("");
  const [showBbc, setShowBbc]         = useState(false);

  const openBBC = (mealName: string) => {
    const query = encodeURIComponent(mealName.split(".")[0].trim());
    const url = `https://www.bbcgoodfood.com/search?q=${query}`;
    setRecipeModal(false);
    setTimeout(() => {
      setBbcUrl(url);
      setShowBbc(true);
    }, 300);
  };
  const [recipeDay, setRecipeDay] = useState("");
  const [recipeList, setRecipeList] = useState<string[]>([]);

  const generatePlan = async () => {
    setLoading(true);
    setError("");

    try {
      const history = await getPurchaseHistory();
      const profile = await getUserProfile();
      const products = history.map((item: any) => ({
        name: item.name || "Unknown",
        brand: item.brand || "",
        label: item.label || "Moderate",
        score: item.score || 50,
        ingredients: item.ingredients || [],
        nutrition: item.nutrition || {},
      }));

      const res = await fetchWithAuth(`${API_BASE_URL}/meal-plan`, {
        method: "POST",
        body: JSON.stringify({
          products,
          profile: profile || {},
        }),
      });

      const text = await res.text();
      console.log("Meal plan response:", text.substring(0, 200));
      const json = JSON.parse(text);

      if (json.error) {
        setError("Server error: " + json.error);
      } else {
        setMealPlan(json);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      const msg = err?.message || JSON.stringify(err) || "Unknown error";
      console.log("Meal plan error:", msg);
      setError("Error: " + msg);
    }

    setLoading(false);
  };

  useFocusEffect(useCallback(() => {
    let active = true;
    const run = async () => {
      try {
        await generatePlan();
      } catch (e) {
        if (active) setError("Could not load meal planner. Please try again.");
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, []));

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <Text style={styles.title}>Weekly Meal Planner</Text>
      <Text style={styles.subtitle}>
        Personalised meal suggestions based on your purchases and health profile.
      </Text>

      {/* Refresh Button */}
      <TouchableOpacity
        style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
        onPress={generatePlan}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.refreshButtonText}>🔄 Refresh Meal Plan</Text>
        )}
      </TouchableOpacity>

      {lastUpdated ? (
        <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
      ) : null}

      {/* Error */}
      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#2D6A2D" />
          <Text style={styles.loadingText}>Generating your personalised meal plan...</Text>
        </View>
      )}

      {/* Meal Plan */}
      {!loading && mealPlan && (
        <>
          {/* Summary */}
          {mealPlan.total_products > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Based on your purchases</Text>
              <Text style={styles.summaryText}>
                {mealPlan.total_products} bagged product(s) used to personalise your plan.
              </Text>
              {mealPlan.avoid_count > 0 && (
                <Text style={styles.avoidText}>
                  ⚠️ {mealPlan.avoid_count} item(s) rated Avoid — used as occasional treats only.
                </Text>
              )}
              {mealPlan.goal_tip ? (
                <Text style={styles.goalTip}>🎯 {mealPlan.goal_tip}</Text>
              ) : null}
              {mealPlan.allergen_note ? (
                <Text style={styles.allergenNote}>⚠️ {mealPlan.allergen_note}</Text>
              ) : null}
            </View>
          )}

          {mealPlan.total_products === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No bagged items yet! Scan products and tap "Yes, save to history" to personalise your meal plan.
              </Text>
              <Text style={styles.emptySubText}>
                Showing a general balanced meal plan in the meantime.
              </Text>
            </View>
          )}

          {/* Daily Plans */}
          {mealPlan.days?.map((day: any, index: number) => (
            <View key={index} style={styles.card}>
              <Text style={styles.day}>{day.day}</Text>

              {day.avoid_warning ? (
                <View style={styles.avoidWarning}>
                  <Text style={styles.avoidWarningText}>⚠️ {day.avoid_warning}</Text>
                </View>
              ) : null}

              <View style={styles.mealRow}>
                <Text style={styles.mealEmoji}>🌅</Text>
                <View style={styles.mealContent}>
                  <Text style={styles.mealLabel}>Breakfast</Text>
                  <Text style={styles.mealText}>{day.breakfast}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.mealRow}>
                <Text style={styles.mealEmoji}>☀️</Text>
                <View style={styles.mealContent}>
                  <Text style={styles.mealLabel}>Lunch</Text>
                  <Text style={styles.mealText}>{day.lunch}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.mealRow}>
                <Text style={styles.mealEmoji}>🌙</Text>
                <View style={styles.mealContent}>
                  <Text style={styles.mealLabel}>Dinner</Text>
                  <Text style={styles.mealText}>{day.dinner}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.mealRow}>
                <Text style={styles.mealEmoji}>🍎</Text>
                <View style={styles.mealContent}>
                  <Text style={styles.mealLabel}>Snack</Text>
                  <Text style={styles.mealText}>{day.snack}</Text>
                </View>
              </View>

              <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 {day.tip}</Text>
              </View>

              <TouchableOpacity
                style={styles.recipeButton}
                onPress={() => {
                  setRecipeDay(day.day);
                  const meals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(Boolean);
                  const ideas = meals.map((meal: string) => {
                    const parts = meal.split(":");
                    return parts.length > 1 ? parts[1].trim() : meal.trim();
                  });
                  setRecipeList(ideas);
                  setRecipeModal(true);
                }}
              >
                <Text style={styles.recipeButtonText}>💡 Recipe Ideas for {day.day}</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Balanced Plate Guide */}
          <View style={styles.legendBox}>
            <Text style={styles.legendTitle}>Balanced Plate Guide</Text>
            <Text style={styles.legendItem}>🥦 Half your plate: vegetables and fruit</Text>
            <Text style={styles.legendItem}>🌾 Quarter plate: whole grains or starchy foods</Text>
            <Text style={styles.legendItem}>🥩 Quarter plate: lean protein</Text>
            <Text style={styles.legendItem}>💧 Drink 8 glasses of water daily</Text>
            <Text style={styles.legendItem}>🫒 Use healthy fats like olive oil in moderation</Text>
          </View>

          <Text style={styles.disclaimer}>
            These meal plans are general wellness suggestions based on your purchase history and health profile. Always consult a registered dietitian or healthcare provider for personalised dietary advice.
          </Text>
        </>
      )}

    </ScrollView>

      <Modal visible={recipeModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💡 Recipe Ideas</Text>
            <Text style={styles.modalSubtitle}>{recipeDay}</Text>
            {recipeList.map((meal, i) => (
              <View key={i} style={styles.recipeItem}>
                <Text style={styles.recipeItemIcon}>🍽️</Text>
                <View style={styles.recipeItemText}>
                  <Text style={styles.recipeItemName}>{meal}</Text>
                  <Text style={styles.recipeItemTip}>{
                    (() => {
                      const name = (typeof meal === "string" ? meal : (meal?.name || meal?.meal || "")).toLowerCase();
                      if (name.includes("oat") || name.includes("porridge")) return "💧 Add chia seeds for extra fibre · Top with fresh berries";
                      if (name.includes("chicken") || name.includes("poulet")) return "🌿 Marinate with lemon & herbs · Pair with steamed greens";
                      if (name.includes("salmon") || name.includes("fish")) return "🫐 Rich in omega-3 · Serve with quinoa or brown rice";
                      if (name.includes("salad")) return "🥑 Add avocado for healthy fats · Use lemon juice as dressing";
                      if (name.includes("egg") || name.includes("omelette")) return "🥦 Add spinach or broccoli · Use minimal oil";
                      if (name.includes("soup") || name.includes("stew")) return "🧄 Add garlic and ginger for anti-inflammatory benefits";
                      if (name.includes("pasta") || name.includes("rice")) return "🌾 Choose whole grain · Add legumes for protein";
                      if (name.includes("smoothie") || name.includes("shake")) return "🍌 Add flaxseed or protein powder · Use unsweetened milk";
                      if (name.includes("wrap") || name.includes("tortilla")) return "🫘 Add hummus for protein · Choose whole wheat wrap";
                      if (name.includes("yogurt") || name.includes("yoghurt")) return "🍯 Choose plain Greek yogurt · Add honey in moderation";
                      if (name.includes("nut") || name.includes("almond")) return "🌰 Eat in small portions · Great source of healthy fats";
                      if (name.includes("fruit")) return "🍎 Best eaten fresh · Natural sugar — enjoy with protein";
                      return "🥗 Use fresh seasonal ingredients · Cook with minimal oil";
                    })()
                  }</Text>
                  <TouchableOpacity
                    style={styles.bbcBtn}
                    onPress={() => openBBC(meal)}
                  >
                    <Text style={styles.bbcBtnText}>🔍 How to cook this</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setRecipeModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BBC Good Food in-app browser */}
      <Modal visible={showBbc} animationType="slide" onRequestClose={() => setShowBbc(false)}>
        <View style={{ flex: 1, backgroundColor: "#2D6A2D" }}>
          <View style={[styles.bbcHeader, { paddingTop: insets.top + 14 }]}>
            <Text style={styles.bbcHeaderTitle}>🍳 BBC Good Food</Text>
            <TouchableOpacity onPress={() => setShowBbc(false)} style={styles.bbcCloseBtn}>
              <Text style={styles.bbcCloseText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          {bbcUrl ? (
            <WebView
              source={{ uri: bbcUrl }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState={true}
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            />
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#2D6A2D" />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 70, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1a1a1a", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 16, lineHeight: 20 },
  refreshButton: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 14, alignItems: "center", marginBottom: 8 },
  refreshButtonDisabled: { backgroundColor: "#aaa" },
  refreshButtonText: { fontSize: 15, color: "white", fontWeight: "600" },
  lastUpdated: { fontSize: 12, color: "#666", textAlign: "center", marginBottom: 16 },
  errorCard: { backgroundColor: "#fee2e2", borderRadius: 12, padding: 16, marginBottom: 16 },
  errorText: { fontSize: 14, color: "#991b1b" },
  loadingCard: { alignItems: "center", padding: 40 },
  loadingText: { fontSize: 14, color: "#2D6A2D", marginTop: 16, textAlign: "center" },
  summaryCard: { backgroundColor: "#D6EAA0", borderRadius: 14, padding: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 15, fontWeight: "bold", color: "#1a1a1a", marginBottom: 8 },
  summaryText: { fontSize: 13, color: "#333", marginBottom: 6 },
  avoidText: { fontSize: 13, color: "#dc2626", marginBottom: 6 },
  goalTip: { fontSize: 13, color: "#2D6A2D", fontStyle: "italic", marginBottom: 4 },
  allergenNote: { fontSize: 13, color: "#dc2626", fontStyle: "italic" },
  emptyCard: { backgroundColor: "#D6EAA0", borderRadius: 14, padding: 16, marginBottom: 16 },
  emptyText: { fontSize: 14, color: "#333", marginBottom: 8, lineHeight: 22 },
  emptySubText: { fontSize: 13, color: "#666", fontStyle: "italic" },
  card: { backgroundColor: "#D6EAA0", padding: 16, borderRadius: 14, marginBottom: 16 },
  day: { fontSize: 20, fontWeight: "bold", color: "#1a1a1a", marginBottom: 14 },
  avoidWarning: { backgroundColor: "#fee2e2", borderRadius: 8, padding: 10, marginBottom: 12 },
  avoidWarningText: { fontSize: 12, color: "#991b1b", lineHeight: 18 },
  mealRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  mealEmoji: { fontSize: 20, marginRight: 10, marginTop: 2 },
  mealContent: { flex: 1 },
  mealLabel: { fontSize: 13, fontWeight: "700", color: "#2D6A2D", marginBottom: 3 },
  mealText: { fontSize: 13, color: "#333", lineHeight: 20 },
  divider: { height: 1, backgroundColor: "#c5d97a", marginVertical: 10 },
  tipBox: { backgroundColor: "#E3F0A3", borderRadius: 10, padding: 10, marginTop: 10, marginBottom: 12 },
  tipText: { fontSize: 13, color: "#2D6A2D", fontStyle: "italic", lineHeight: 20 },
  recipeButton: { backgroundColor: "#42D674", padding: 12, borderRadius: 20, alignItems: "center" },
  recipeButtonText: { color: "#1a1a1a", fontWeight: "bold", fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#2D6A2D", marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: "#888", marginBottom: 20 },
  recipeItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, gap: 12 },
  recipeItemIcon: { fontSize: 28, marginTop: 2 },
  recipeItemText: { flex: 1 },
  recipeItemName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  recipeItemTip: { fontSize: 13, color: "#888", lineHeight: 18 },
  modalClose: { backgroundColor: "#2D6A2D", borderRadius: 20, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  modalCloseText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  legendBox: { backgroundColor: "#D6EAA0", padding: 16, borderRadius: 14, marginBottom: 16 },
  legendTitle: { fontWeight: "bold", marginBottom: 10, color: "#1a1a1a", fontSize: 15 },
  legendItem: { color: "#333", marginBottom: 6, fontSize: 13, lineHeight: 20 },
  disclaimer: { fontSize: 12, color: "#666", marginBottom: 20, lineHeight: 20 },
});
