import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const API_BASE_URL = "https://api.wellvalet.com";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [resetToken, setResetToken] = useState(String(token || ""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!resetToken.trim()) {
      setError("Please enter your reset code from the email.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken.trim(),
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setDone(true);
      }
    } catch {
      setError("Could not reach server. Please check your connection.");
    }
    setLoading(false);
  };

  if (done) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={56} color="#2D6A2D" style={styles.heroIcon} />
          <Text style={styles.title}>Password Updated</Text>
          <Text style={styles.subtitle}>
            Your password has been reset successfully. You can now log in with your new password.
          </Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.replace("/login")}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Ionicons name="key-outline" size={56} color="#2D6A2D" style={styles.heroIcon} />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the reset code from your email and choose a new password.
        </Text>
        <View style={styles.inputCard}>
          <Text style={styles.label}>Reset Code (from email)</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste reset code here"
            placeholderTextColor="#aaa"
            value={resetToken}
            onChangeText={setResetToken}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 8 characters"
            placeholderTextColor="#aaa"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={true}
          />
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat new password"
            placeholderTextColor="#aaa"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={true}
          />
        </View>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F0A3", paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 24 },
  backText: { fontSize: 15, color: "#2D6A2D", fontWeight: "600" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroIcon: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "900", color: "#2D6A2D", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#444", textAlign: "center", lineHeight: 24, marginBottom: 28 },
  inputCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, width: "100%", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: "#2D6A2D", marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: "#f5f5f5", borderRadius: 10, padding: 14, fontSize: 16, color: "#1a1a1a", borderWidth: 1, borderColor: "#e0e0e0" },
  errorBox: { backgroundColor: "#f8d7da", borderRadius: 10, padding: 12, marginBottom: 16, width: "100%" },
  errorText: { fontSize: 13, color: "#721c24", textAlign: "center" },
  button: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 15, alignItems: "center", width: "100%" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, color: "#fff", fontWeight: "700" },
});
