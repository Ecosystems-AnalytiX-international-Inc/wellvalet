import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const API_BASE_URL = "https://api.wellvalet.com";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const resendEmail = async () => {
    if (!email) {
      setResendError("Email address not found. Please sign up again.");
      return;
    }

    setResending(true);
    setResendMessage("");
    setResendError("");

    try {
      const res = await fetch(`${API_BASE_URL}/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.error) {
        setResendError(data.error);
      } else {
        setResendMessage("Verification email resent! Please check your inbox.");
      }
    } catch {
      setResendError("Could not reach server. Please check your connection.");
    }

    setResending(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        <Ionicons name="mail-outline" size={56} color="#2D6A2D" style={styles.heroIcon} />

        <Text style={styles.mainText}>
          An activation link has been sent to your email address.
        </Text>

        {email ? (
          <Text style={styles.emailText}>{email}</Text>
        ) : null}

        <Text style={styles.subText}>
          Please check your inbox and click the activation link to verify your account.
        </Text>

        <View style={styles.resendRow}>
          <Text style={styles.didNotReceive}>Did not receive it? </Text>
          <TouchableOpacity onPress={resendEmail} disabled={resending}>
            {resending ? (
              <ActivityIndicator size="small" color="#2D6A2D" />
            ) : (
              <Text style={styles.resendLink}>Resend email</Text>
            )}
          </TouchableOpacity>
        </View>

        {resendMessage ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={14} color="#155724" />
            <Text style={styles.successText}>{resendMessage}</Text>
          </View>
        ) : null}

        {resendError ? (
          <View style={styles.errorBox}>
            <Ionicons name="close-circle" size={14} color="#721c24" />
            <Text style={styles.errorText}>{resendError}</Text>
          </View>
        ) : null}

        <Text style={styles.welcomeText}>
          We cannot wait to welcome you in!
        </Text>

      </View>

      <TouchableOpacity style={styles.loginButton} onPress={() => router.replace("/login")}>
        <Text style={styles.loginButtonText}>Go to Login</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F0A3", justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  content: { alignItems: "center", marginBottom: 60 },
  heroIcon: { marginBottom: 20 },
  mainText: { fontSize: 16, color: "#1a1a1a", textAlign: "center", lineHeight: 24, marginBottom: 10 },
  emailText: { fontSize: 15, fontWeight: "700", color: "#2D6A2D", marginBottom: 16, textAlign: "center" },
  subText: { fontSize: 14, color: "#444", textAlign: "center", lineHeight: 22, marginBottom: 20 },
  resendRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  didNotReceive: { fontSize: 13, color: "#444" },
  resendLink: { fontSize: 13, color: "#2D6A2D", fontWeight: "bold", textDecorationLine: "underline" },
  successBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#d4edda", borderRadius: 10, padding: 12, marginBottom: 16, width: "100%" },
  successText: { fontSize: 13, color: "#155724", flex: 1 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f8d7da", borderRadius: 10, padding: 12, marginBottom: 16, width: "100%" },
  errorText: { fontSize: 13, color: "#721c24", flex: 1 },
  welcomeText: { fontSize: 15, color: "#1a1a1a", textAlign: "center", marginTop: 8 },
  loginButton: { backgroundColor: "#42D674", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 50 },
  loginButtonText: { fontSize: 16, color: "#1a1a1a", fontWeight: "500" },
});
