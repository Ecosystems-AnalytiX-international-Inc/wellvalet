import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "AUTH_TOKEN";
const USER_EMAIL_KEY = "USER_EMAIL";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.wellvalet.com";

export async function saveAuthSession(token: string, email: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_EMAIL_KEY, email);
}

export async function getAuthToken() {
  return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function getUserEmail() {
  return await AsyncStorage.getItem(USER_EMAIL_KEY);
}

export async function logout() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(USER_EMAIL_KEY);
}

// Silent token validation
async function refreshToken(): Promise<string | null> {
  const token = await getAuthToken();
  return token || null;
}

// Fetch wrapper that auto-refreshes token on 401
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  let response = await fetch(url, { ...options, headers });

  // If 401 Unauthorized — try to refresh token and retry once
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      response = await fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return response;
}
