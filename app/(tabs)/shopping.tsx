import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl, Alert
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchWithAuth, getUserEmail } from "../../components/authService";
import { isFamilyPlan } from "../../components/premiumService";
import OrderDeliveryModal from "../../components/OrderDeliveryModal";
import MarketplaceBrowserScreen from "../../components/MarketplaceBrowserScreen";
import { DeliveryPlatform } from "../../components/affiliateUrls";

const API_BASE = "https://api.wellvalet.com";

type ProfileType = "SOLO" | "FAM_ADMIN" | "FAM_MEMBER" | null;

async function getStorageKey() {
  const email = await getUserEmail();
  return email ? `SHOPPING_ITEMS_${email.toLowerCase()}` : "SHOPPING_ITEMS";
}

export default function ShoppingTab() {
  const router = useRouter();

  const [profileType, setProfileType] = useState<ProfileType>(null);
  const [familyName, setFamilyName]   = useState("");
  const [isFamily, setIsFamily]       = useState(false);

  const [items, setItems]           = useState<any[]>([]);
  const [newItem, setNewItem]       = useState("");
  const [adding, setAdding]         = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [familyList, setFamilyList] = useState<any[]>([]);
  const [famNewItem, setFamNewItem] = useState("");
  const [famAdding, setFamAdding]   = useState(false);
  const [famLoading, setFamLoading] = useState(false);

  const [showOrderModal, setShowOrderModal]   = useState(false);
  const [browserUrl, setBrowserUrl]           = useState("");
  const [browserPlatform, setBrowserPlatform] = useState<DeliveryPlatform>("walmart");
  const [browserListText, setBrowserListText] = useState("");
  const [showBrowser, setShowBrowser]         = useState(false);

  const handleOpenBrowser = (url: string, platform: DeliveryPlatform, listText: string) => {
    setBrowserUrl(url); setBrowserPlatform(platform);
    setBrowserListText(listText); setShowBrowser(true);
  };

  useFocusEffect(useCallback(() => {
    const init = async () => {
      try {
        const [famPlan, famRes] = await Promise.all([
          isFamilyPlan(),
          fetchWithAuth(`${API_BASE}/family`),
        ]);
        const famData = await famRes.json();
        const inFamily = !!(famData && !famData.error && famData.family_name);

        if (!famPlan) {
          setProfileType("SOLO");
          setIsFamily(false);
          await loadPersonalItems();
        } else if (!inFamily) {
          setProfileType("SOLO");
          setIsFamily(false);
          await loadPersonalItems();
        } else if (famData.is_admin) {
          setProfileType("FAM_ADMIN");
          setIsFamily(true);
          setFamilyName(famData.family_name);
          await loadFamilyList();
        } else {
          setProfileType("FAM_MEMBER");
          setIsFamily(true);
          setFamilyName(famData.family_name);
          await loadMemberItems();
        }
      } catch (e) {
        console.log("Shopping init error:", e);
        setProfileType("SOLO");
        try { await loadPersonalItems(); } catch {}
      }
    };
    init();
  }, []));

  const loadPersonalItems = async () => {
    const key = await getStorageKey();
    const saved = await AsyncStorage.getItem(key);
    if (saved) { try { setItems(JSON.parse(saved)); } catch { setItems([]); } }
    else setItems([]);
  };

  const savePersonalItems = async (newItems: any[]) => {
    const key = await getStorageKey();
    await AsyncStorage.setItem(key, JSON.stringify(newItems));
  };

  const addPersonalItem = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    const updated = [...items, newItem.trim()];
    setItems(updated); await savePersonalItems(updated); setNewItem("");
    setAdding(false);
  };

  const deletePersonalItem = async (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated); await savePersonalItems(updated);
  };

  const clearPersonalAll = () => {
    Alert.alert("Clear List", "Remove all items?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: async () => {
        setItems([]); await savePersonalItems([]);
      }},
    ]);
  };

  const loadMemberItems = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/family/shopping`);
      const data = await res.json();
      if (data && Array.isArray(data.shopping_list)) {
        const mine = data.shopping_list.find((m: any) => m.is_me);
        setItems(mine ? mine.items.map((it: any) => ({ id: it.id, text: it.item || it.text })) : []);
      }
    } catch { setItems([]); }
  };

  const addMemberItem = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    try {
      await fetchWithAuth(`${API_BASE}/family/shopping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: newItem.trim() }),
      });
      setNewItem(""); await loadMemberItems();
    } catch {}
    setAdding(false);
  };

  const deleteMemberItem = async (itemId: number) => {
    try {
      await fetchWithAuth(`${API_BASE}/family/shopping/${itemId}`, { method: "DELETE" });
      await loadMemberItems();
    } catch {}
  };

  const loadFamilyList = async () => {
    setFamLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE}/family/shopping`);
      const data = await res.json();
      if (data && Array.isArray(data.shopping_list)) setFamilyList(data.shopping_list);
    } catch {}
    setFamLoading(false);
  };

  const addFamilyItem = async () => {
    if (!famNewItem.trim()) return;
    setFamAdding(true);
    try {
      await fetchWithAuth(`${API_BASE}/family/shopping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: famNewItem.trim() }),
      });
      setFamNewItem(""); await loadFamilyList();
    } catch {}
    setFamAdding(false);
  };

  const deleteFamilyItem = async (itemId: number) => {
    try {
      await fetchWithAuth(`${API_BASE}/family/shopping/${itemId}`, { method: "DELETE" });
      await loadFamilyList();
    } catch {}
  };

  const getAllFamilyItems = (): string[] =>
    familyList.flatMap(m => m.items.map((it: any) => it.text || it.item || ""))
      .filter(t => t.trim().length > 0);

  const onRefresh = async () => {
    setRefreshing(true);
    if (profileType === "FAM_ADMIN") await loadFamilyList();
    else if (profileType === "FAM_MEMBER") await loadMemberItems();
    else await loadPersonalItems();
    setRefreshing(false);
  };

  if (!profileType) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A2D" />
        <Text style={{ marginTop: 12, color: "#2D6A2D", fontSize: 13 }}>
          Loading your list...
        </Text>
      </View>
    );
  }

  // ── SOLO ──────────────────────────────────────────────────────────────────
  if (profileType === "SOLO") {
    return (
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🛒 My Shopping List</Text>
            <Text style={styles.headerSub}>Personal · {items.length} item{items.length !== 1 ? "s" : ""}</Text>
          </View>
          {items.length > 0 && (
            <TouchableOpacity onPress={clearPersonalAll}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.addBar}>
          <TextInput style={styles.addInput} placeholder="Add an item..."
            placeholderTextColor="#aaa" value={newItem}
            onChangeText={setNewItem} onSubmitEditing={addPersonalItem} returnKeyType="done" />
          <TouchableOpacity
            style={[styles.addButton, (!newItem.trim() || adding) && styles.addButtonDisabled]}
            onPress={addPersonalItem} disabled={!newItem.trim() || adding}>
            {adding ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.addButtonText}>Add</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D6A2D" />}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>Your list is empty</Text>
              <Text style={styles.emptyText}>Add items above to get started!</Text>
            </View>
          ) : (
            items.map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemDot} />
                <Text style={styles.itemText}>{typeof item === "string" ? item : item.text}</Text>
                <TouchableOpacity onPress={() => deletePersonalItem(i)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          {items.length > 0 && (
            <View style={styles.actionRow}>
              {(profileType === "FAM_ADMIN" || profileType === "FAM_MEMBER") ? (
                <TouchableOpacity style={[styles.actionBtn, styles.orderBtnHalf]}
                  onPress={() => setShowOrderModal(true)}>
                  <Text style={styles.actionBtnEmoji}>🚀</Text>
                  <Text style={styles.actionBtnText}>Order for Delivery</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.actionBtn, styles.orderBtnHalf]}
                  onPress={() => router.push("/upgrade")}>
                  <Text style={styles.actionBtnEmoji}>⭐</Text>
                  <Text style={styles.actionBtnText}>Shop Online? Unlock Premium!</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, styles.scanBtnHalf]}
                onPress={() => router.push("/(tabs)/scan")}>
                <Text style={styles.actionBtnEmoji}>📷</Text>
                <Text style={styles.actionBtnText}>Scan a Product</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
        <OrderDeliveryModal visible={showOrderModal} items={items.map((it: any) => typeof it === "string" ? it : it.text)}
          onClose={() => setShowOrderModal(false)} onOpenBrowser={handleOpenBrowser} />
        {showBrowser && (
          <MarketplaceBrowserScreen url={browserUrl} platform={browserPlatform}
            listText={browserListText} itemCount={items.length}
            onClose={() => setShowBrowser(false)} />
        )}
      </View>
    );
  }

  // ── FAM_ADMIN ─────────────────────────────────────────────────────────────
  if (profileType === "FAM_ADMIN") {
    const totalItems = familyList.reduce((s, m) => s + m.items.length, 0);
    return (
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🛒 {familyName}</Text>
            <Text style={styles.headerSub}>Family List · {totalItems} item{totalItems !== 1 ? "s" : ""}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/family-manage")}>
            <Text style={styles.clearText}>Manage</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.addBar}>
          <TextInput style={styles.addInput} placeholder="Add an item..."
            placeholderTextColor="#aaa" value={famNewItem}
            onChangeText={setFamNewItem} onSubmitEditing={addFamilyItem} returnKeyType="done" />
          <TouchableOpacity
            style={[styles.addButton, (!famNewItem.trim() || famAdding) && styles.addButtonDisabled]}
            onPress={addFamilyItem} disabled={!famNewItem.trim() || famAdding}>
            {famAdding ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.addButtonText}>Add</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D6A2D" />}>
          {famLoading ? (
            <ActivityIndicator size="large" color="#2D6A2D" style={{ marginTop: 40 }} />
          ) : familyList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>Family list is empty</Text>
              <Text style={styles.emptyText}>Add items above — members will see them instantly!</Text>
            </View>
          ) : (
            familyList.map((member: any, mi: number) => (
              <View key={mi} style={styles.memberSection}>
                <View style={[styles.memberHeader,
                  { backgroundColor: member.is_me ? "#2D6A2D" : "#4a7a4a" }]}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>
                    {member.display_name}{member.is_me ? " (me)" : ""}
                  </Text>
                  <Text style={styles.memberCount}>
                    {member.items.length} item{member.items.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                {member.items.map((item: any, ii: number) => (
                  <View key={ii} style={styles.itemRow}>
                    <View style={styles.itemDot} />
                    <Text style={styles.itemText}>{item.item || item.text}</Text>
                    {member.is_me && (
                      <TouchableOpacity onPress={() => deleteFamilyItem(item.id)}
                        style={styles.deleteBtn}>
                        <Text style={styles.deleteText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ))
          )}
          {totalItems > 0 && (
            <View style={styles.actionRow}>
              {(profileType === "FAM_ADMIN" || profileType === "FAM_MEMBER") ? (
                <TouchableOpacity style={[styles.actionBtn, styles.orderBtnHalf]}
                  onPress={() => setShowOrderModal(true)}>
                  <Text style={styles.actionBtnEmoji}>🚀</Text>
                  <Text style={styles.actionBtnText}>Order for Delivery</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.actionBtn, styles.orderBtnHalf]}
                  onPress={() => router.push("/upgrade")}>
                  <Text style={styles.actionBtnEmoji}>⭐</Text>
                  <Text style={styles.actionBtnText}>Shop Online? Unlock Premium!</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, styles.scanBtnHalf]}
                onPress={() => router.push("/(tabs)/scan")}>
                <Text style={styles.actionBtnEmoji}>📷</Text>
                <Text style={styles.actionBtnText}>Scan a Product</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
        <OrderDeliveryModal visible={showOrderModal} items={getAllFamilyItems()}
          onClose={() => setShowOrderModal(false)} onOpenBrowser={handleOpenBrowser} />
        {showBrowser && (
          <MarketplaceBrowserScreen url={browserUrl} platform={browserPlatform}
            listText={browserListText} itemCount={getAllFamilyItems().length}
            onClose={() => setShowBrowser(false)} />
        )}
      </View>
    );
  }

  // ── FAM_MEMBER ────────────────────────────────────────────────────────────
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🛒 My List</Text>
          <Text style={styles.headerSub}>
            My list to {familyName} · {items.length} item{items.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <View style={styles.memberNotice}>
        <Text style={styles.memberNoticeText}>
          ℹ️ Items you add are shared with your family admin
        </Text>
      </View>
      <View style={styles.addBar}>
        <TextInput style={styles.addInput} placeholder="Add an item..."
          placeholderTextColor="#aaa" value={newItem}
          onChangeText={setNewItem} onSubmitEditing={addMemberItem} returnKeyType="done" />
        <TouchableOpacity
          style={[styles.addButton, (!newItem.trim() || adding) && styles.addButtonDisabled]}
          onPress={addMemberItem} disabled={!newItem.trim() || adding}>
          {adding ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.addButtonText}>Add</Text>}
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D6A2D" />}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your list is empty</Text>
            <Text style={styles.emptyText}>Add items above — the family admin will see them!</Text>
          </View>
        ) : (
          items.map((item: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <Text style={styles.itemText}>{item.text || item}</Text>
              <TouchableOpacity
                onPress={() => item.id ? deleteMemberItem(item.id) : null}
                style={styles.deleteBtn}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ margin: 16 }}>
          <TouchableOpacity style={[styles.actionBtn, styles.scanBtnHalf]}
            onPress={() => router.push("/(tabs)/scan")}>
            <Text style={styles.actionBtnEmoji}>📷</Text>
            <Text style={styles.actionBtnText}>Scan a Product</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:           { flex: 1, backgroundColor: "#E3F0A3" },
  loadingContainer:  { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#E3F0A3" },
  header:            { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: "#2D6A2D" },
  headerCenter:      { flex: 1 },
  headerTitle:       { fontSize: 20, fontWeight: "900", color: "#fff" },
  headerSub:         { fontSize: 13, color: "#A8D5A2", marginTop: 2 },
  clearText:         { fontSize: 14, color: "#42D674", fontWeight: "700" },
  memberNotice:      { backgroundColor: "#FFF9C4", padding: 10, alignItems: "center" },
  memberNoticeText:  { fontSize: 13, color: "#555", fontStyle: "italic" },
  addBar:            { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E3F0A3", gap: 8 },
  addInput:          { flex: 1, backgroundColor: "#f5f5f5", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: "#1a1a1a" },
  addButton:         { backgroundColor: "#2D6A2D", borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, justifyContent: "center" },
  addButtonDisabled: { opacity: 0.4 },
  addButtonText:     { color: "#fff", fontWeight: "700", fontSize: 15 },
  list:              { flex: 1 },
  emptyState:        { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon:         { fontSize: 48, marginBottom: 16 },
  emptyTitle:        { fontSize: 18, fontWeight: "800", color: "#2D6A2D", marginBottom: 8 },
  emptyText:         { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
  itemRow:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: "#E3F0A3", backgroundColor: "#fff" },
  itemDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2D6A2D", marginRight: 12 },
  itemText:          { flex: 1, fontSize: 15, color: "#1a1a1a" },
  deleteBtn:         { padding: 6 },
  deleteText:        { fontSize: 16, color: "#dc2626", fontWeight: "700" },
  memberSection:     { marginBottom: 4 },
  memberHeader:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  memberAvatar:      { width: 32, height: 32, borderRadius: 16, backgroundColor: "#42D674", justifyContent: "center", alignItems: "center" },
  memberAvatarText:  { color: "#1a1a1a", fontWeight: "800", fontSize: 14 },
  memberName:        { flex: 1, fontSize: 15, fontWeight: "700", color: "#fff" },
  memberCount:       { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  actionRow:         { flexDirection: "row", gap: 10, margin: 16 },
  actionBtn:         { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", justifyContent: "center" },
  orderBtnHalf:      { backgroundColor: "#2D6A2D" },
  scanBtnHalf:       { backgroundColor: "#1565C0" },
  actionBtnEmoji:    { fontSize: 22, marginBottom: 4 },
  actionBtnText:     { fontSize: 13, fontWeight: "800", color: "#fff", textAlign: "center" },
});
