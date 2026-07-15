import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, RefreshControl
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { isFamilyPlan } from "../components/premiumService";
import OrderDeliveryModal from "../components/OrderDeliveryModal";
import MarketplaceBrowserScreen from "../components/MarketplaceBrowserScreen";
import { DeliveryPlatform } from "../components/affiliateUrls";
import { fetchWithAuth } from "../components/authService";

const API_BASE_URL = "https://api.wellvalet.com";

export default function FamilyShoppingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [premium, setPremiumState] = useState(false);

  useEffect(() => {
    isFamilyPlan().then(setPremiumState);
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [familyData, setFamilyData] = useState<any>(null);
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [showOrderModal, setShowOrderModal]   = useState(false);
  const [browserUrl, setBrowserUrl]           = useState("");
  const [browserPlatform, setBrowserPlatform] = useState<DeliveryPlatform>("walmart");
  const [browserListText, setBrowserListText] = useState("");
  const [showBrowser, setShowBrowser]         = useState(false);

  const handleOpenBrowser = (url: string, platform: DeliveryPlatform, listText: string) => {
    setBrowserUrl(url);
    setBrowserPlatform(platform);
    setBrowserListText(listText);
    setShowBrowser(true);
  };

  const getAllItems = (): string[] =>
    shoppingList.flatMap(m => m.items.map((it: any) => it.text || it.item || ""))
      .filter(t => t.trim().length > 0);

  const loadData = async () => {
    try {
      // Load family info
      const famRes = await fetchWithAuth(`${API_BASE_URL}/family`);
      const famData = await famRes.json();
      if (famData.error) {
        router.replace("/family-setup");
        return;
      }
      setFamilyData(famData);

      // Load shopping list
      const listRes = await fetchWithAuth(`${API_BASE_URL}/family/shopping`);
      const listData = await listRes.json();
      if (!listData.error) {
        setShoppingList(listData.shopping_list || []);
      }
    } catch {
      setError("Could not load family data.");
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const addItem = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/family/shopping`, {
        method: "POST",
        body: JSON.stringify({ item: newItem.trim() }),
      });
      const data = await res.json();
      if (!data.error) {
        setNewItem("");
        loadData();
      }
    } catch {
      setError("Could not add item.");
    }
    setAdding(false);
  };

  const deleteItem = async (itemId: number) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/family/shopping/${itemId}`, { method: "DELETE" });
      loadData();
    } catch {
      setError("Could not delete item.");
    }
  };

  const clearMyItems = async () => {
    Alert.alert("Clear My Items", "Remove all items you added?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear", style: "destructive", onPress: async () => {
          await fetchWithAuth(`${API_BASE_URL}/family/shopping/clear`, { method: "POST" });
          loadData();
        }
      }
    ]);
  };

  const leaveFamily = async () => {
    Alert.alert(
      familyData?.is_admin ? "Delete Family Group" : "Leave Family Group",
      familyData?.is_admin
        ? "As admin, this will delete the entire family group and remove all members."
        : "You will leave this family group and lose access to the shared shopping list.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: familyData?.is_admin ? "Delete" : "Leave",
          style: "destructive",
          onPress: async () => {
            await fetchWithAuth(`${API_BASE_URL}/family/leave`, { method: "POST" });
            router.replace("/family-setup");
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A2D" />
        <Text style={styles.loadingText}>Loading family list...</Text>
      </View>
    );
  }

  const totalItems = shoppingList.reduce((sum, m) => sum + m.items.length, 0);

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🛒 {familyData?.family_name}</Text>
          <Text style={styles.headerSub}>{familyData?.member_count} members · {totalItems} items</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/family-manage")}>
          <Text style={styles.manageText}>Manage</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Bar */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.addInput}
          placeholder="Add an item..."
          placeholderTextColor="#aaa"
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, (!newItem.trim() || adding) && styles.addButtonDisabled]}
          onPress={addItem}
          disabled={!newItem.trim() || adding}
        >
          {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addButtonText}>Add</Text>}
        </TouchableOpacity>
      </View>

      {/* Shopping List */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D6A2D" />}
      >
        {shoppingList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>List is empty</Text>
            <Text style={styles.emptyText}>Add items above — your family will see them instantly!</Text>
          </View>
        ) : (
          shoppingList.map((member, i) => (
            <View key={i} style={styles.memberSection}>
              {/* Member header */}
              <View style={[styles.memberHeader, { backgroundColor: getMemberColor(i) }]}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{member.display_name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.memberName}>
                  {member.display_name} {member.is_me ? "(me)" : ""}
                </Text>
                <Text style={styles.memberCount}>{member.items.length} item{member.items.length !== 1 ? "s" : ""}</Text>
              </View>

              {/* Member items */}
              {member.items.map((item: any, j: number) => (
                <View key={j} style={[styles.itemRow, { backgroundColor: j % 2 === 0 ? "#fff" : "#fafff5" }]}>
                  <Text style={styles.itemBullet}>•</Text>
                  <Text style={styles.itemText}>{item.item}</Text>
                  {member.is_me && (
                    <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteButton}>
                      <Text style={styles.deleteText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ))
        )}

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.clearButton} onPress={clearMyItems}>
            <Text style={styles.clearButtonText}>🗑️ Clear My Items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveButton} onPress={leaveFamily}>
            <Text style={styles.leaveButtonText}>
              {familyData?.is_admin ? "🗑️ Delete Group" : "👋 Leave Group"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      {/* Order for Delivery */}
      {/* Action buttons — scan always visible, order only for admin */}
      <View style={styles.actionRow}>
        {shoppingList.length > 0 && familyData?.is_admin && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.orderBtnHalf]}
            onPress={() => setShowOrderModal(true)}
          >
            <Text style={styles.actionBtnEmoji}>🚀</Text>
            <Text style={styles.actionBtnText}>Order for Delivery</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.scanBtnHalf]}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <Text style={styles.actionBtnEmoji}>📷</Text>
          <Text style={styles.actionBtnText}>Scan a Product</Text>
        </TouchableOpacity>
      </View>
      <OrderDeliveryModal
        visible={showOrderModal}
        items={getAllItems()}
        onClose={() => setShowOrderModal(false)}
        onOpenBrowser={handleOpenBrowser}
      />
      {showBrowser && (
        <MarketplaceBrowserScreen
          url={browserUrl}
          platform={browserPlatform}
          listText={browserListText}
          itemCount={getAllItems().length}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </View>
  );
}

const MEMBER_COLORS = ["#E3F0A3", "#D6EAA0", "#C8E49D", "#BAE09A", "#ACE097"];
const getMemberColor = (i: number) => MEMBER_COLORS[i % MEMBER_COLORS.length];

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#E3F0A3" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#E3F0A3" },
  loadingText: { marginTop: 12, color: "#2D6A2D", fontSize: 15 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 60, backgroundColor: "#2D6A2D" },
  backText: { color: "#42D674", fontSize: 14, fontWeight: "600" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11, color: "#42D674", marginTop: 2 },
  manageText: { color: "#42D674", fontSize: 14, fontWeight: "600" },
  addBar: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E3F0A3", gap: 8 },
  addInput: { flex: 1, backgroundColor: "#f5f5f5", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: "#1a1a1a" },
  addButton: { backgroundColor: "#2D6A2D", borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, justifyContent: "center" },
  addButtonDisabled: { opacity: 0.4 },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  list: { flex: 1 },
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#2D6A2D", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#4a7a4a", textAlign: "center", lineHeight: 22 },
  memberSection: { marginBottom: 8 },
  memberHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#2D6A2D", justifyContent: "center", alignItems: "center" },
  memberAvatarText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  memberName: { flex: 1, fontSize: 15, fontWeight: "700", color: "#2D6A2D" },
  memberCount: { fontSize: 12, color: "#4a7a4a", fontWeight: "600" },
  itemRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#E3F0A3" },
  itemBullet: { fontSize: 18, color: "#42D674", marginRight: 10 },
  itemText: { flex: 1, fontSize: 15, color: "#1a1a1a" },
  deleteButton: { padding: 6 },
  deleteText: { fontSize: 14, color: "#dc2626", fontWeight: "700" },
  bottomActions: { flexDirection: "row", gap: 12, padding: 16, paddingTop: 24 },
  clearButton: { flex: 1, backgroundColor: "#fff", borderRadius: 20, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#2D6A2D" },
  clearButtonText: { fontSize: 14, color: "#2D6A2D", fontWeight: "600" },
  orderDeliveryBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#2D6A2D", borderRadius: 16, padding: 16, margin: 12, gap: 12 },
  orderDeliveryBtnEmoji: { fontSize: 24 },
  orderDeliveryBtnText:  { fontSize: 15, fontWeight: "800", color: "#fff" },
  orderDeliveryBtnSub:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  orderDeliveryBtnArrow: { marginLeft: "auto", fontSize: 18, color: "#42D674", fontWeight: "700" },
  actionRow:      { flexDirection: "row", gap: 10, margin: 12 },
  actionBtn:      { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", justifyContent: "center" },
  orderBtnHalf:   { backgroundColor: "#2D6A2D" },
  scanBtnHalf:    { backgroundColor: "#1565C0" },
  actionBtnEmoji: { fontSize: 22, marginBottom: 4 },
  actionBtnText:  { fontSize: 13, fontWeight: "800", color: "#fff", textAlign: "center" },
  leaveButton: { flex: 1, backgroundColor: "#fff", borderRadius: 20, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#dc2626" },
  leaveButtonText: { fontSize: 14, color: "#dc2626", fontWeight: "600" },
});
