import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { isPremium } from "../../components/premiumService";
import {
  getPurchaseHistory,
  clearPurchaseHistory,
  deletePurchasedItem,
} from "../../components/historyService";

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

export default function HistoryTab() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [premium, setPremiumState] = useState(false);
  const router = useRouter();

  useEffect(() => {
    isPremium().then(setPremiumState);
  }, []);

  const loadHistory = async () => {
    const data = await getPurchaseHistory();

    // Auto-delete items older than 3 months
    const now = Date.now();
    const validItems = [];
    for (const item of data) {
      const purchasedAt = item.purchased_at ? new Date(item.purchased_at).getTime() : now;
      if (now - purchasedAt > THREE_MONTHS_MS) {
        await deletePurchasedItem(item.history_id);
      } else {
        validItems.push(item);
      }
    }

    setItems(validItems);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const deleteItem = async (history_id: string) => {
    await deletePurchasedItem(history_id);
    loadHistory();
  };

  const clearHistory = async () => {
    await clearPurchaseHistory();
    setItems([]);
  };

  const avoidCount = items.filter((item) => item.label === "Care").length;
  const moderateCount = items.filter((item) => item.label === "Moderate").length;
  const goodCount = items.filter((item) => item.label === "Good").length;

  const filteredItems = filter === "All" ? items : items.filter((item) => item.label === filter);

  const getLabelColor = (label: string) => {
    if (label === "Good") return "#4CAF50";
    if (label === "Moderate") return "#FFC107";
    if (label === "Care") return "#F44336";
    return "#888";
  };

  // Free users: show last 5 scans + locked banner for the rest
  const FREE_LIMIT = 5;
  const visibleItems = premium
    ? filteredItems
    : filteredItems.slice(0, FREE_LIMIT);
  const lockedCount = premium ? 0 : Math.max(0, filteredItems.length - FREE_LIMIT);

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Purchase History</Text>
        <Link href="/profile" style={styles.profileLink}>
          <Ionicons name="person-circle-outline" size={30} color="#2D6A2D" />
        </Link>
      </View>

      {/* Summary Card with filter links */}
      <View style={styles.summaryCard}>
        <TouchableOpacity onPress={() => setFilter("All")}>
          <Text style={[styles.summaryText, filter === "All" && styles.activeFilter]}>
            Bagged items: {items.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("Good")}>
          <Text style={[styles.summaryText, styles.goodText, filter === "Good" && styles.activeFilter]}>
            Good (A-B): {goodCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("Moderate")}>
          <Text style={[styles.summaryText, styles.moderateText, filter === "Moderate" && styles.activeFilter]}>
            Moderate (C): {moderateCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("Care")}>
          <Text style={[styles.summaryText, styles.avoidText, filter === "Care" && styles.activeFilter]}>
            Care (D): {avoidCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3 month note */}
      <View style={styles.noteCard}>
        <Text style={styles.noteText}>
          Hey, we guess an item purchased three months ago would be deemed consumed! It will be automatically removed from your history. You may also delete any item once consumed.
        </Text>
      </View>

      {/* Filter indicator */}
      {filter !== "All" && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterIndicatorText}>Showing: {filter} items</Text>
          <TouchableOpacity onPress={() => setFilter("All")} style={styles.clearFilterBtn}>
            <Ionicons name="close" size={13} color="#dc2626" />
            <Text style={styles.clearFilter}>Clear filter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Items */}
      {filteredItems.length === 0 ? (
        <Text style={styles.empty}>
          {filter === "All"
            ? "No bagged items yet. Scan a product and tap Yes to save to history."
            : `No ${filter} items in your history.`}
        </Text>
      ) : (
        <>
        {visibleItems.map((item, index) => (
          <View key={item.history_id || index} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleSection}>
                <Text style={styles.name}>{item.name || "Unknown product"}</Text>
                <Text style={styles.brand}>{item.brand || "Unknown brand"}</Text>
              </View>
              <View style={[styles.labelBadge, { backgroundColor: getLabelColor(item.label) }]}>
                <Text style={styles.labelBadgeText}>{item.label}</Text>
              </View>
            </View>

            <View style={styles.scoreRow}>
              <Text style={styles.text}>Score: {item.score}</Text>
              {item.letter ? (
                <View style={[styles.letterBadge, { backgroundColor: getLabelColor(item.label) }]}>
                  <Text style={styles.letterBadgeText}>{item.letter}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.text}>
              Calories: {item?.nutrition?.calories_100g != null ? Number(item.nutrition.calories_100g).toFixed(1) + " kcal" : "N/A"} per 100g
            </Text>
            <Text style={styles.text}>
              Sugar: {item?.nutrition?.sugar_100g != null ? Number(item.nutrition.sugar_100g).toFixed(1) + " g" : "N/A"} per 100g
            </Text>
            <Text style={styles.text}>
              Fat: {item?.nutrition?.fat_100g != null ? Number(item.nutrition.fat_100g).toFixed(1) + " g" : "N/A"} per 100g
            </Text>
            <Text style={styles.text}>
              Salt: {item?.nutrition?.salt_100g != null ? Number(item.nutrition.salt_100g).toFixed(1) + " g" : "N/A"} per 100g
            </Text>
            <Text style={styles.text}>
              Purchased: {item.purchased_at ? new Date(item.purchased_at).toLocaleString() : "Unknown"}
            </Text>
            {item.notes ? <Text style={styles.notes}>Notes: {item.notes}</Text> : null}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.addShoppingBtn}
                onPress={async () => {
                  try {
                    const productName = item.name || item.product_name || "Unknown product";
                    const { fetchWithAuth, getUserEmail } = require("../../components/authService");

                    // Try family list first
                    try {
                      const famRes = await fetchWithAuth("https://api.wellvalet.com/family");
                      const famData = await famRes.json();
                      if (famData && !famData.error && famData.family_name) {
                        await fetchWithAuth("https://api.wellvalet.com/family/shopping", {
                          method: "POST",
                          body: JSON.stringify({ item: productName }),
                        });
                        Alert.alert("Added to Family List", productName + " added to your family shopping list.");
                        return;
                      }
                    } catch {}

                    // Fallback to personal shopping list
                    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
                    const email = await getUserEmail();
                    const key = email ? "SHOPPING_LIST_NOTES_" + email.toLowerCase() : "SHOPPING_LIST_NOTES";
                    const existing = (await AsyncStorage.getItem(key)) || "• ";
                    const updated = existing.trimEnd() + "\n• " + productName;
                    await AsyncStorage.setItem(key, updated);
                    Alert.alert("Added", productName + " added to your shopping list.");
                  } catch(e) { Alert.alert("Error", "Could not add to shopping list."); }
                }}
              >
                <View style={styles.addShoppingRow}>
                  <Ionicons name="cart-outline" size={14} color="#fff" />
                  <Text style={styles.addShoppingTxt}>Add to List</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtnSmall}
                onPress={() => deleteItem(item.history_id)}
              >
                <Text style={styles.deleteBtnSmallTxt}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {lockedCount > 0 && (
          <TouchableOpacity
            style={styles.historyLockBanner}
            onPress={() => router.push("/upgrade")}
            activeOpacity={0.85}
          >
            <Ionicons name="lock-closed" size={24} color="#fff" />
            <View style={styles.historyLockContent}>
              <Text style={styles.historyLockTitle}>
                {lockedCount} older scan{lockedCount !== 1 ? "s" : ""} locked
              </Text>
              <Text style={styles.historyLockSub}>
                See your full scan history with Premium →
              </Text>
            </View>
          </TouchableOpacity>
        )}
        </>
      )}

      {/* Clear All */}
      {items.length > 0 && (
        <TouchableOpacity style={styles.clearAllButton} onPress={clearHistory}>
          <Text style={styles.clearAllText}>Clear All History</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 70, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "black" },
  profileLink: { textDecorationLine: "none" },
  summaryCard: { backgroundColor: "#D6EAA0", padding: 16, borderRadius: 14, marginBottom: 12 },
  summaryText: { fontSize: 15, color: "#1a1a1a", marginBottom: 6, textDecorationLine: "underline" },
  goodText: { color: "#2D6A2D" },
  moderateText: { color: "#f59e0b" },
  avoidText: { color: "#dc2626" },
  activeFilter: { fontWeight: "bold", fontSize: 16 },
  noteCard: { backgroundColor: "#D6EAA0", padding: 14, borderRadius: 12, marginBottom: 16 },
  noteText: { fontSize: 13, color: "#444", lineHeight: 20, fontStyle: "italic" },
  filterIndicator: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  filterIndicatorText: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  clearFilterBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  clearFilter: { fontSize: 13, color: "#dc2626", fontWeight: "600" },
  empty: { fontSize: 15, color: "#555", marginBottom: 20, textAlign: "center", marginTop: 20 },
  card: { backgroundColor: "#D6EAA0", padding: 16, borderRadius: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardTitleSection: { flex: 1, marginRight: 10 },
  name: { fontSize: 17, fontWeight: "bold", color: "#1a1a1a" },
  brand: { fontSize: 13, color: "#555", marginTop: 2 },
  labelBadge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  letterBadge: { width: 26, height: 26, borderRadius: 6, justifyContent: "center", alignItems: "center" },
  letterBadgeText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  labelBadgeText: { fontSize: 12, fontWeight: "bold", color: "white" },
  text: { fontSize: 13, color: "#333", marginBottom: 3 },
  notes: { fontSize: 13, color: "#444", marginTop: 6, fontStyle: "italic" },
  deleteButton: { backgroundColor: "#F44336", borderRadius: 20, paddingVertical: 10, alignItems: "center", marginTop: 12 },
  deleteButtonText: { fontSize: 14, color: "white", fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  addShoppingBtn: { flex: 1, backgroundColor: "#2D6A2D", borderRadius: 16, paddingVertical: 9, alignItems: "center" },
  addShoppingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  addShoppingTxt: { fontSize: 13, color: "white", fontWeight: "600" },
  deleteBtnSmall: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5, borderColor: "#F44336" },
  deleteBtnSmallTxt: { fontSize: 13, color: "#F44336", fontWeight: "600" },
  clearAllButton: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 20 },
  clearAllText: { fontSize: 15, color: "white", fontWeight: "600" },
  lockContainer: { flex: 1, backgroundColor: "#E3F0A3", justifyContent: "center", padding: 24 },
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

  historyLockBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a3a1a",
                        borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 12, gap: 12 },
  historyLockContent:{ flex: 1 },
  historyLockText:   { flex: 1 },
  historyLockTitle:  { fontSize: 14, fontWeight: "700", color: "#fff" },
  historyLockSub:    { fontSize: 12, color: "#42D674", marginTop: 3 },
});
