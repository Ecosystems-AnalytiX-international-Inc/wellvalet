import AsyncStorage from "@react-native-async-storage/async-storage";

const PREMIUM_KEY = "IS_PREMIUM";
const PREMIUM_CONFIG_KEY = "PREMIUM_CONFIG";
const API_BASE_URL = "https://api.wellvalet.com";

export async function isPremium(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(PREMIUM_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setPremium(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PREMIUM_KEY, value ? "true" : "false");
    // Sync to backend so server-side gates (scan limit, AI Valet limit) respect it
    try {
      const token = await AsyncStorage.getItem("AUTH_TOKEN");
      if (token) {
        await fetch(`${API_BASE_URL}/me/set-premium`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ is_premium: value }),
        });
      }
    } catch {
      console.log("Could not sync premium status to backend");
    }
  } catch {
    console.log("Error setting premium status");
  }
}

export async function clearPremium(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREMIUM_KEY);
    // Sync to backend so scan/AI Valet limits apply again
    try {
      const token = await AsyncStorage.getItem("AUTH_TOKEN");
      if (token) {
        await fetch(`${API_BASE_URL}/me/set-premium`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ is_premium: false }),
        });
      }
    } catch {
      console.log("Could not sync unsubscribe to backend");
    }
  } catch {
    console.log("Error clearing premium status");
  }
}

export async function fetchPremiumConfig(): Promise<any> {
  try {
    // Try cache first
    const cached = await AsyncStorage.getItem(PREMIUM_CONFIG_KEY);
    if (cached) return JSON.parse(cached);

    // Fetch from backend
    const res = await fetch(`${API_BASE_URL}/config/premium`);
    const config = await res.json();

    // Cache for 1 hour
    await AsyncStorage.setItem(PREMIUM_CONFIG_KEY, JSON.stringify(config));
    return config;
  } catch {
    // Default config if backend unreachable
    return {
      monthly_price: 5.99,
      quarterly_price: 4.19,
      quarterly_discount: 30,
      yearly_price: 2.99,
      locked_features: ["nutrition", "recommendations", "history", "meal_planner", "wellness_profile"]
    };
  }
}

export async function isFeatureLocked(feature: string): Promise<boolean> {
  const premium = await isPremium();
  if (premium) return false; // Premium users have access to everything

  const config = await fetchPremiumConfig();
  return config.locked_features.includes(feature);
}

export async function setFamilyPlan(value: boolean): Promise<void> {
  await AsyncStorage.setItem("WELLVALET_FAMILY_PLAN", value ? "true" : "false");
}

export async function isFamilyPlan(): Promise<boolean> {
  const val = await AsyncStorage.getItem("WELLVALET_FAMILY_PLAN");
  return val === "true";
}
