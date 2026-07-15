import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserEmail } from "./authService";

const LEGACY_HISTORY_KEY = "PURCHASE_HISTORY";

async function getHistoryKey() {
  const email = await getUserEmail();

  if (!email) {
    return LEGACY_HISTORY_KEY;
  }

  return `PURCHASE_HISTORY_${email.toLowerCase()}`;
}

export async function getPurchaseHistory() {
  try {
    const key = await getHistoryKey();
    const existing = await AsyncStorage.getItem(key);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.log("Error loading purchase history:", error);
    return [];
  }
}

export async function savePurchasedItem(item: any) {
  try {
    const key = await getHistoryKey();
    const existing = await getPurchaseHistory();

    const newItem = {
      ...item,
      history_id: `${Date.now()}-${Math.random()}`,
      purchased_at: new Date().toISOString(),
      notes: item.notes || "",
    };

    const updated = [newItem, ...existing];

    await AsyncStorage.setItem(key, JSON.stringify(updated));

    return true;
  } catch (error) {
    console.log("Error saving purchased item:", error);
    return false;
  }
}

export async function updatePurchasedItem(history_id: string, updates: any) {
  try {
    const key = await getHistoryKey();
    const existing = await getPurchaseHistory();

    const updated = existing.map((item: any) =>
      item.history_id === history_id ? { ...item, ...updates } : item
    );

    await AsyncStorage.setItem(key, JSON.stringify(updated));

    return true;
  } catch (error) {
    console.log("Error updating purchased item:", error);
    return false;
  }
}

export async function deletePurchasedItem(history_id: string) {
  try {
    const key = await getHistoryKey();
    const existing = await getPurchaseHistory();

    const updated = existing.filter((item: any) => item.history_id !== history_id);

    await AsyncStorage.setItem(key, JSON.stringify(updated));

    return true;
  } catch (error) {
    console.log("Error deleting purchased item:", error);
    return false;
  }
}

export async function clearPurchaseHistory() {
  try {
    const key = await getHistoryKey();
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.log("Error clearing purchase history:", error);
    return false;
  }
}