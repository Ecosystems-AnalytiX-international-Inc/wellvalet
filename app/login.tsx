import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle, Path, Rect, Text as SvgText, TextPath } from "react-native-svg";
import { saveAuthSession } from "../components/authService";

const API_BASE_URL = "https://api.wellvalet.com";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.error) {
        setMessage(json.error);
        return;
      }
      await saveAuthSession(json.access_token, json.user.email);
      router.replace("/(tabs)");
    } catch {
      setMessage("Login failed. Please check your connection.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            secureTextEntry={!showPassword}
            placeholder="Password Field"
            placeholderTextColor="#999"
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁"}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <TouchableOpacity style={styles.loginButton} onPress={login}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Proudly Canadian Badge */}
        <View style={styles.canadianBadge}>
          <Image
            source={require("../assets/canadian_badge.png")}
            style={styles.canadianImg}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity style={styles.createLink} onPress={() => router.push("/signup")}>
          <Text style={styles.createLinkText}>
            Don't have an account?{" "}
            <Text style={styles.createLinkBold}>Create one</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F0A3", paddingHorizontal: 30, paddingTop: 100 },
  title: { fontSize: 24, fontWeight: "500", color: "#1a1a1a", textAlign: "center", marginBottom: 60 },
  formContainer: { width: "100%" },
  label: { fontSize: 14, color: "#1a1a1a", marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: "#E8E8E8", borderRadius: 8, padding: 12, fontSize: 16, color: "#1a1a1a" },
  passwordContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8E8E8", borderRadius: 8, paddingHorizontal: 12 },
  passwordInput: { flex: 1, padding: 12, fontSize: 16, color: "#1a1a1a" },
  eyeButton: { padding: 8 },
  eyeIcon: { fontSize: 16 },
  error: { color: "red", marginTop: 10, fontSize: 14 },
  loginButton: { backgroundColor: "#42D674", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 50, alignSelf: "center", marginTop: 40 },
  loginButtonText: { fontSize: 16, color: "#1a1a1a", fontWeight: "500" },
  createLink: { marginTop: 24, alignSelf: "center" },
  createLinkText: { fontSize: 14, color: "#666", textAlign: "center" },
  createLinkBold: { color: "#2D6A2D", fontWeight: "700", textDecorationLine: "underline" },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 16, marginTop: -8 },
  forgotPasswordText: { fontSize: 13, color: "#2D6A2D", fontWeight: "600", textDecorationLine: "underline" },

  canadianBadge:  { alignItems: "center", marginTop: 32, marginBottom: 8 },
  canadianImg:    { width: 100, height: 100 },

});