import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";

const API_BASE_URL = "https://api.wellvalet.com";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSent(true);
      }
    } catch {
      setError("Could not reach server. Please check your connection.");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>📧</Text>
          <Text style={styles.title}>Check Your Inbox</Text>
          <Text style={styles.subtitle}>
            If an account exists for {email}, a password reset link has been sent.
          </Text>
          <Text style={styles.hint}>
            Check your spam folder if you do not see it within a few minutes.
          </Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.replace("/login")}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back to Login</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter the email address you used to create your WellValet account.
          We will send you a link to reset your password.
        </Text>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F0A3", paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 32 },
  backText: { fontSize: 15, color: "#2D6A2D", fontWeight: "600" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "900", color: "#2D6A2D", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#444", textAlign: "center", lineHeight: 24, marginBottom: 28 },
  hint: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 20, marginTop: 8 },
  inputCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, width: "100%", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: "#2D6A2D", marginBottom: 8 },
  input: { backgroundColor: "#f5f5f5", borderRadius: 10, padding: 14, fontSize: 16, color: "#1a1a1a", borderWidth: 1, borderColor: "#e0e0e0" },
  errorBox: { backgroundColor: "#f8d7da", borderRadius: 10, padding: 12, marginBottom: 16, width: "100%" },
  errorText: { fontSize: 13, color: "#721c24", textAlign: "center" },
  button: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 15, alignItems: "center", width: "100%", marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, color: "#fff", fontWeight: "700" },
});
