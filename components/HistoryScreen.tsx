import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserEmail } from './authService';
import { isFamilyPlan } from './premiumService';
import { fetchWithAuth } from './authService';
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Button,
  StyleSheet,
  TextInput,
} from "react-native";
import {
  getPurchaseHistory,
  clearPurchaseHistory,
  deletePurchasedItem,
  updatePurchasedItem,
} from "./historyService";


async function addToShoppingList(productName: string): Promise<boolean> {
  try {
    const famPlan = await isFamilyPlan();
    if (famPlan) {
      // Family plan — add to backend family shopping list
      const res = await fetchWithAuth(
        "https://api.wellvalet.com/family/shopping",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: productName }) }
      );
      const data = await res.json();
      return !data.error;
    } else {
      // Solo plan — add to AsyncStorage personal list
      const email = await getUserEmail();
      const key = email ? `SHOPPING_ITEMS_${email.toLowerCase()}` : "SHOPPING_ITEMS";
      const saved = await AsyncStorage.getItem(key);
      const items: string[] = saved ? JSON.parse(saved) : [];
      if (items.includes(productName)) return false;
      items.push(productName);
      await AsyncStorage.setItem(key, JSON.stringify(items));
      return true;
    }
  } catch { return false; }
}

export default function HistoryScreen({ onBack }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const loadHistory = async () => {
    const data = await getPurchaseHistory();
    setItems(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const startEdit = (item: any) => {
    setEditingId(item.history_id);
    setEditName(item.name || "");
    setEditBrand(item.brand || "");
    setEditNotes(item.notes || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditBrand("");
    setEditNotes("");
  };

  const saveEdit = async () => {
    if (!editingId) return;

    await updatePurchasedItem(editingId, {
      name: editName,
      brand: editBrand,
      notes: editNotes,
      edited_at: new Date().toISOString(),
    });

    cancelEdit();
    loadHistory();
  };

  const deleteItem = async (history_id: string) => {
    await deletePurchasedItem(history_id);
    loadHistory();
  };

  const clearHistory = async () => {
    await clearPurchaseHistory();
    setItems([]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Purchase History</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>No bagged items yet.</Text>
      ) : (
        items.map((item, index) => (
          <View key={item.history_id || index} style={styles.card}>
            {editingId === item.history_id ? (
              <>
                <Text style={styles.label}>Product name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                />

                <Text style={styles.label}>Brand</Text>
                <TextInput
                  style={styles.input}
                  value={editBrand}
                  onChangeText={setEditBrand}
                />

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={styles.input}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="e.g. bought 2 jars, for breakfast, mistake corrected"
                />

                <View style={styles.buttonBox}>
                  <Button title="Save Changes" onPress={saveEdit} />
                </View>

                <View style={styles.buttonBox}>
                  <Button title="Cancel" onPress={cancelEdit} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.name}>{item.name || "Unknown product"}</Text>
                <Text style={styles.brand}>{item.brand || "Unknown brand"}</Text>

                <Text style={styles.text}>
                  Score: {item.score} / Label: {item.label}
                </Text>

                <Text style={styles.text}>
                  Purchased: {new Date(item.purchased_at).toLocaleString()}
                </Text>

                {item.edited_at ? (
                  <Text style={styles.edited}>
                    Edited: {new Date(item.edited_at).toLocaleString()}
                  </Text>
                ) : null}

                {item.notes ? (
                  <Text style={styles.notes}>Notes: {item.notes}</Text>
                ) : null}

                <View style={styles.buttonBox}>
                  <Button title="Edit Item" onPress={() => startEdit(item)} />
                </View>
                <View style={styles.buttonBox}>
                  <Button
                    title="+ Shopping List"
                    color="#2D6A2D"
                    onPress={async () => {
                      const added = await addToShoppingList(item.product_name || item.name || "");
                      Alert.alert(
                        added ? "Added ✅" : "Already in list",
                        added
                          ? `${item.product_name || item.name} added to your shopping list.`
                          : `${item.product_name || item.name} is already in your shopping list.`
                      );
                    }}
                  />
                </View>

                <View style={styles.buttonBox}>
                  <Button
                    title="Delete Item"
                    color="red"
                    onPress={() => deleteItem(item.history_id)}
                  />
                </View>
              </>
            )}
          </View>
        ))
      )}

      <View style={styles.buttonBox}>
        <Button title="Back to Scanner" onPress={onBack} />
      </View>

      {items.length > 0 && (
        <View style={styles.buttonBox}>
          <Button title="Clear All History" onPress={clearHistory} color="red" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "white",
    padding: 20,
    paddingTop: 70,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "black",
    marginBottom: 20,
  },
  empty: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  brand: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: "black",
  },
  edited: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },
  notes: {
    fontSize: 14,
    color: "black",
    marginTop: 8,
    fontStyle: "italic",
  },
  label: {
    fontWeight: "bold",
    color: "black",
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    color: "black",
  },
  buttonBox: {
    marginTop: 12,
  },
});