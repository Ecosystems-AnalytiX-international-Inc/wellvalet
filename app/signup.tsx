import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

const API_BASE_URL = "https://api.wellvalet.com";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const signup = async () => {
    setMessage("");
    if (!email || !password || !confirmPassword) {
      setMessage("Please complete all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setMessage("Please agree to the Privacy Policy and Terms and Conditions.");
      return;
    }
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      const json = await res.json();
      if (json.error) {
        if (json.error.toLowerCase().includes("already")) {
          // Account exists - send to verify email screen anyway
          router.push({ pathname: "/verify-email", params: { email } });
        } else {
          setMessage(json.error);
        }
        return;
      }
      router.push({ pathname: "/verify-email", params: { email } });
    } catch (err: any) {
      // Even on timeout/network error, the signup may have succeeded
      // Navigate to verify-email screen so user can check their inbox
      router.push({ pathname: "/verify-email", params: { email } });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>Welcome to your Wellness space</Text>
      <Text style={styles.subtitle}>
        This is your gateway to your everyday eating pattern, from the shelves to your wellbeing
      </Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Enter your email"
        placeholderTextColor="#999"
        onChangeText={setEmail}
      />

      <Text style={styles.labelBold}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={password}
          secureTextEntry={!showPassword}
          placeholder="Minimum 8 characters"
          placeholderTextColor="#999"
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        >
          <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.labelBold}>Confirm Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={confirmPassword}
          secureTextEntry={!showConfirmPassword}
          placeholder="Repeat your password"
          placeholderTextColor="#999"
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
        >
          <Text style={styles.eyeIcon}>{showConfirmPassword ? "🙈" : "👁"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setAgreed(!agreed)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        accessibilityLabel="I agree to the Privacy Policy and Terms and Conditions"
      >
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the{" "}
          <Text style={styles.link} onPress={() => router.push("/privacy")}>
            Privacy Policy
          </Text>
          {" "}and to the{" "}
          <Text style={styles.link} onPress={() => router.push("/terms")}>
            Terms and Conditions
          </Text>
        </Text>
      </TouchableOpacity>

      {message ? (
        <Text style={[styles.message, message.includes("created") && styles.successMessage]}>
          {message}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={signup}
        style={styles.createButton}
        accessibilityRole="button"
        accessibilityLabel="Create Account"
      >
        <Text style={styles.createButtonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace("/login")}
        style={styles.loginLink}
        accessibilityRole="link"
        accessibilityLabel="Already have an account? Login"
      >
        <Text style={styles.loginLinkText}>Already have an account? Login</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", paddingHorizontal: 30, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "500", color: "#1a1a1a", textAlign: "center", marginBottom: 16 },
  subtitle: { fontSize: 14, color: "#444", textAlign: "center", lineHeight: 22, marginBottom: 40 },
  label: { fontSize: 13, color: "#1a1a1a", marginBottom: 6, marginTop: 16 },
  labelBold: { fontSize: 18, fontWeight: "600", color: "#1a1a1a", marginBottom: 6, marginTop: 20 },
  input: { backgroundColor: "#E8E8E8", borderRadius: 8, padding: 12, fontSize: 16, color: "#1a1a1a" },
  passwordContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8E8E8", borderRadius: 8, paddingHorizontal: 12 },
  passwordInput: { flex: 1, padding: 12, fontSize: 16, color: "#1a1a1a" },
  eyeButton: { padding: 8 },
  eyeIcon: { fontSize: 16 },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 24, marginBottom: 8 },
  checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: "#999", borderRadius: 3, marginRight: 10, marginTop: 2, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  checkboxChecked: { backgroundColor: "#42D674", borderColor: "#42D674" },
  checkmark: { color: "white", fontSize: 12, fontWeight: "bold" },
  checkboxLabel: { flex: 1, fontSize: 13, color: "#444", lineHeight: 20 },
  link: { color: "#2D6A2D", fontWeight: "bold", textDecorationLine: "underline" },
  message: { marginTop: 16, color: "#2563eb", fontWeight: "bold", textAlign: "center" },
  successMessage: { color: "#2D6A2D" },
  createButton: { backgroundColor: "#42D674", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 50, alignSelf: "center", marginTop: 30 },
  createButtonText: { fontSize: 16, color: "#1a1a1a", fontWeight: "500" },
  loginLink: { marginTop: 20, alignSelf: "center" },
  loginLinkText: { fontSize: 14, color: "#444" },
});
