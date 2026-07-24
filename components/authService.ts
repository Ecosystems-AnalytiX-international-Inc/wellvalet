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

/**
 * Permanently deletes the authenticated user's account and all associated data.
 *
 * Apple Guideline 5.1.1(v) requires apps that support account creation to also
 * offer in-app account deletion. This calls the backend endpoint which is expected
 * to:
 *   - remove the user record, wellness profile, scan history, family membership
 *   - cancel any active subscription state
 *   - invalidate the auth token server-side
 *
 * On success, the local session is cleared and the caller should redirect to the
 * landing page. On failure, an Error is thrown with a user-safe message.
 */
export async function deleteAccount(): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error("You are not signed in.");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/account/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("Could not reach the server. Check your internet connection and try again.");
  }

  if (!response.ok) {
    let message = "Could not delete your account. Please try again in a moment.";
    try {
      const data = await response.json();
      if (data?.error && typeof data.error === "string") message = data.error;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new Error(message);
  }

  // Clear local session so subsequent requests do not use the revoked token.
  await AsyncStorage.multiRemove([
    AUTH_TOKEN_KEY,
    USER_EMAIL_KEY,
    "IS_PREMIUM",
    "WELLVALET_FAMILY_PLAN",
    "WELLNESS_PROFILE",
    "PREMIUM_CONFIG",
    "TRIAL_OFFER_SHOWN",
  ]);
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

  // If 429 Too Many Requests — wait for Retry-After header or default backoff and retry once
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const delayMs = retryAfter ? (parseInt(retryAfter, 10) || 1) * 1000 : 1500;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    response = await fetch(url, { ...options, headers });
  }

  return response;
}
