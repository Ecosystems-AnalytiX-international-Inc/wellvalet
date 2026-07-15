import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserEmail } from "./authService";

const LEGACY_USER_PROFILE_KEY = "USER_PROFILE";
const LAST_EMAIL_KEY = "LAST_USER_EMAIL";

async function getProfileKey() {
  // Try current logged in email first
  let email = await getUserEmail();

  // If not logged in, try last known email
  if (!email) {
    email = await AsyncStorage.getItem(LAST_EMAIL_KEY);
  }

  if (!email) {
    return LEGACY_USER_PROFILE_KEY;
  }

  return `USER_PROFILE_${email.toLowerCase()}`;
}

export async function saveUserProfile(profile: any) {
  try {
    // Save current email as last known email
    const email = await getUserEmail();
    if (email) {
      await AsyncStorage.setItem(LAST_EMAIL_KEY, email.toLowerCase());
    }

    const key = await getProfileKey();
    await AsyncStorage.setItem(key, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.log("Error saving user profile:", error);
    return false;
  }
}

export async function getUserProfile() {
  try {
    const key = await getProfileKey();
    const existing = await AsyncStorage.getItem(key);
    return existing ? JSON.parse(existing) : null;
  } catch (error) {
    console.log("Error loading user profile:", error);
    return null;
  }
}

export async function clearUserProfile() {
  try {
    const key = await getProfileKey();
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.log("Error clearing user profile:", error);
    return false;
  }
}
