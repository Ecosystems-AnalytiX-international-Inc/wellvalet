import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "AUTH_TOKEN";
const USER_EMAIL_KEY = "USER_EMAIL";
const USER_PASSWORD_KEY = "USER_PASSWORD";

const API_BASE_URL = "https://api.wellvalet.com";

export async function saveAuthSession(token: string, email: string, password?: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_EMAIL_KEY, email);
  if (password) {
    await AsyncStorage.setItem(USER_PASSWORD_KEY, password);
  }
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
  await AsyncStorage.removeItem(USER_PASSWORD_KEY);
}

// Silent re-login to get fresh token
async function refreshToken(): Promise<string | null> {
  try {
    const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
    const password = await AsyncStorage.getItem(USER_PASSWORD_KEY);
    if (!email || !password) return null;

    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.access_token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, json.access_token);
      return json.access_token;
    }
    return null;
  } catch {
    return null;
  }
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
