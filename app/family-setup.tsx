import { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchWithAuth } from "../components/authService";

const API_BASE_URL = "https://api.wellvalet.com";

export default function FamilySetupScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [loading, setLoading] = useState(false);

  // Create family state
  const [familyName, setFamilyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteEmails, setInviteEmails] = useState(["", "", ""]);

  // Join family state
  const [inviteCode, setInviteCode] = useState("");
  const [joinDisplayName, setJoinDisplayName] = useState("");

  const [message, setMessage] = useState("");

  const createFamily = async () => {
    if (!familyName.trim() || !displayName.trim()) {
      setMessage("Please enter family name and your display name.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const emails = inviteEmails.filter(e => e.trim() !== "");
      const res = await fetchWithAuth(`${API_BASE_URL}/family/create`, {
        method: "POST",
        body: JSON.stringify({
          family_name: familyName.trim(),
          display_name: displayName.trim(),
          invite_emails: emails
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else {
        Alert.alert(
          "Family Created",
          `Your family group "${data.family_name}" has been created.\nInvite code: ${data.invite_code}\n${emails.length > 0 ? `Invites sent to ${emails.length} member(s)!` : ""}`,
          [{ text: "OK", onPress: () => router.replace("/family-shopping") }]
        );
      }
    } catch {
      setMessage("Could not create family. Please try again.");
    }
    setLoading(false);
  };

  const joinFamily = async () => {
    if (!inviteCode.trim() || !joinDisplayName.trim()) {
      setMessage("Please enter invite code and your display name.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/family/join`, {
        method: "POST",
        body: JSON.stringify({
          invite_code: inviteCode.trim(),
          display_name: joinDisplayName.trim()
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else {
        Alert.alert(
          "Joined Family",
          `You have joined "${data.family_name}"!`,
          [{ text: "OK", onPress: () => router.replace("/family-shopping") }]
        );
      }
    } catch {
      setMessage("Could not join family. Please try again.");
    }
    setLoading(false);
  };

  // ── CHOOSE MODE ──
  if (mode === "choose") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Family Feature</Text>
        <Text style={styles.subtitle}>
          Share a shopping list with up to 4 family members.
          See who added what, in real time.
        </Text>

        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <Ionicons name="cart-outline" size={28} color="#2D6A2D" style={styles.featureIcon} />
            <Text style={styles.featureText}>Shared shopping list</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people-outline" size={28} color="#2D6A2D" style={styles.featureIcon} />
            <Text style={styles.featureText}>Up to 4 members</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="mail-outline" size={28} color="#2D6A2D" style={styles.featureIcon} />
            <Text style={styles.featureText}>Invite by email</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setMode("create")}>
          <View style={styles.buttonRow}>
            <Ionicons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>Create a Family Group</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode("join")}>
          <View style={styles.buttonRow}>
            <Ionicons name="key-outline" size={16} color="#2D6A2D" />
            <Text style={styles.secondaryButtonText}>Join with Invite Code</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── CREATE FAMILY ──
  if (mode === "create") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => setMode("choose")} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create Family Group</Text>
        <Text style={styles.subtitle}>Set up your family group and invite members by email.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Family Group Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Shanas"
            value={familyName}
            onChangeText={setFamilyName}
            placeholderTextColor="#aaa"
          />

          <Text style={styles.label}>Your Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Mike"
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Invite Members by Email (optional)</Text>
          <Text style={styles.hint}>They will receive an email with the invite code. You can invite up to 3 members.</Text>
          {inviteEmails.map((email, i) => (
            <TextInput
              key={i}
              style={[styles.input, { marginTop: i === 0 ? 12 : 8 }]}
              placeholder={`Member ${i + 1} email`}
              value={email}
              onChangeText={(v) => {
                const updated = [...inviteEmails];
                updated[i] = v;
                setInviteEmails(updated);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#aaa"
            />
          ))}
        </View>

        {message ? <Text style={styles.errorText}>{message}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={createFamily}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Create Family Group</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── JOIN FAMILY ──
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
    >
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => setMode("choose")} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Join Family Group</Text>
      <Text style={styles.subtitle}>Enter the 6-digit invite code from your family member&apos;s email.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Invite Code</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="e.g. 847291"
          value={inviteCode}
          onChangeText={setInviteCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Your Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sophie"
          value={joinDisplayName}
          onChangeText={setJoinDisplayName}
          placeholderTextColor="#aaa"
        />
      </View>

      {message ? <Text style={styles.errorText}>{message}</Text> : null}

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={joinFamily}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Join Family Group</Text>}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 20 },
  backText: { fontSize: 15, color: "#2D6A2D", fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#2D6A2D", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#4a7a4a", marginBottom: 24, lineHeight: 22 },
  featureRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  featureItem: { alignItems: "center", flex: 1 },
  featureIcon: { marginBottom: 6 },
  featureText: { fontSize: 11, color: "#2D6A2D", textAlign: "center", fontWeight: "600" },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: "#2D6A2D", marginBottom: 6, marginTop: 8 },
  hint: { fontSize: 12, color: "#888", marginBottom: 4 },
  input: { backgroundColor: "#f5f5f5", borderRadius: 10, padding: 12, fontSize: 15, color: "#1a1a1a", borderWidth: 1, borderColor: "#e0e0e0" },
  codeInput: { fontSize: 28, fontWeight: "800", textAlign: "center", letterSpacing: 8, color: "#2D6A2D" },
  errorText: { color: "#dc2626", fontSize: 13, marginBottom: 12, textAlign: "center" },
  primaryButton: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 14, alignItems: "center", marginBottom: 12 },
  primaryButtonText: { fontSize: 16, color: "#fff", fontWeight: "700" },
  secondaryButton: { backgroundColor: "#fff", borderRadius: 25, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#2D6A2D" },
  secondaryButtonText: { fontSize: 16, color: "#2D6A2D", fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
});
