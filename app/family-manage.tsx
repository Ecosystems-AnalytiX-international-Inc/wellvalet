import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchWithAuth } from "../components/authService";

const API_BASE_URL = "https://api.wellvalet.com";

export default function FamilyManageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState<"success" | "error" | "">("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => { loadFamily(); }, []);

  const loadFamily = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/family`);
      const data = await res.json();
      if (data.error) {
        router.replace("/family-setup");
        return;
      }
      setFamily(data);
    } catch {
      setMessage("Could not load family data.");
    }
    setLoading(false);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSending(true);
    setMessage("");
    setMessageStatus("");
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/family/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        setMessageStatus("error");
      } else {
        setMessage(`Invite sent to ${inviteEmail.trim()}`);
        setMessageStatus("success");
        setInviteEmail("");
      }
    } catch {
      setMessage("Could not send invite.");
      setMessageStatus("error");
    }
    setSending(false);
  };

  const startEdit = (member: any) => {
    setEditingId(member.id);
    setEditName(member.display_name);
  };

  const saveRename = async () => {
    if (!editName.trim() || editingId === null) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/family/rename-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: editingId, display_name: editName.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        setEditingId(null);
        await loadFamily();
      }
    } catch {
      Alert.alert("Error", "Could not rename member.");
    }
  };

  const confirmRemove = (member: any) => {
    Alert.alert(
      "Remove Member",
      `Remove ${member.display_name} from your family group?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: async () => {
          try {
            const res = await fetchWithAuth(`${API_BASE_URL}/family/remove-member`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ member_id: member.id }),
            });
            const data = await res.json();
            if (data.error) {
              Alert.alert("Error", data.error);
            } else {
              await loadFamily();
            }
          } catch {
            Alert.alert("Error", "Could not remove member.");
          }
        }},
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A2D" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
    >
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Manage Family</Text>

      {/* Family Info Card */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="people-outline" size={18} color="#2D6A2D" />
          <Text style={styles.cardTitle}>{family?.family_name}</Text>
        </View>
        <Text style={styles.cardSub}>{family?.member_count}/4 members</Text>

        {/* Members list */}
        {family?.members.map((member: any, i: number) => (
          <View key={i} style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{member.display_name.charAt(0).toUpperCase()}</Text>
            </View>
            {editingId === member.id ? (
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Member name"
                placeholderTextColor="#999"
                autoFocus
                onSubmitEditing={saveRename}
                returnKeyType="done"
              />
            ) : (
              <Text style={styles.memberName}>{member.display_name}</Text>
            )}
            {member.is_admin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
            {family?.is_admin && (
              editingId === member.id ? (
                <TouchableOpacity onPress={saveRename} style={styles.memberActionBtn}>
                  <Text style={styles.memberActionSave}>Save</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => startEdit(member)} style={styles.memberActionBtn}>
                  <Text style={styles.memberActionEdit}>Edit</Text>
                </TouchableOpacity>
              )
            )}
            {family?.is_admin && !member.is_admin && editingId !== member.id && (
              <TouchableOpacity onPress={() => confirmRemove(member)} style={styles.memberActionBtn}>
                <Ionicons name="close" size={16} color="#dc2626" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Invite Code Card — admin only */}
      {family?.is_admin && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="key-outline" size={18} color="#2D6A2D" />
            <Text style={styles.cardTitle}>Invite Code</Text>
          </View>
          <Text style={styles.cardSub}>Share this code or send invites by email below.</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{family?.invite_code}</Text>
          </View>
        </View>
      )}

      {/* Send Invite — admin only */}
      {family?.is_admin && (family?.member_count || 0) < 4 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="mail-outline" size={18} color="#2D6A2D" />
            <Text style={styles.cardTitle}>Invite by Email</Text>
          </View>
          <Text style={styles.cardSub}>
            {Math.max(0, 4 - (family?.member_count || 1))} invite slot{Math.max(0, 4 - (family?.member_count || 1)) !== 1 ? "s" : ""} remaining (max 4 members total).
          </Text>
          <View style={styles.inviteRow}>
            <TextInput
              style={styles.inviteInput}
              placeholder="Email address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              style={[styles.inviteButton, sending && styles.buttonDisabled]}
              onPress={sendInvite}
              disabled={sending}
            >
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.inviteButtonText}>Send</Text>}
            </TouchableOpacity>
          </View>
          {message ? (
            <View style={styles.messageRow}>
              {messageStatus === "success" ? (
                <Ionicons name="checkmark-circle" size={14} color="#2D6A2D" />
              ) : messageStatus === "error" ? (
                <Ionicons name="close-circle" size={14} color="#dc2626" />
              ) : null}
              <Text style={[styles.messageText, messageStatus === "success" ? styles.successText : styles.errorText]}>
                {message}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Shopping List Button */}
      <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace("/family-shopping")}>
        <View style={styles.buttonRow}>
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>View Family Shopping List</Text>
        </View>
      </TouchableOpacity>

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 60, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#E3F0A3" },
  backButton: { marginBottom: 20 },
  backText: { fontSize: 15, color: "#2D6A2D", fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: "#2D6A2D", marginBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#2D6A2D" },
  cardSub: { fontSize: 13, color: "#888", marginBottom: 14 },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  messageRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: "#E3F0A3", gap: 10 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2D6A2D", justifyContent: "center", alignItems: "center" },
  memberAvatarText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  memberName: { flex: 1, fontSize: 15, color: "#1a1a1a", fontWeight: "500" },
  editInput: { flex: 1, backgroundColor: "#f5f5f5", borderRadius: 10, paddingHorizontal: 10,
                paddingVertical: 6, fontSize: 14, color: "#1a1a1a", marginRight: 8 },
  memberActionBtn: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 4 },
  memberActionEdit: { fontSize: 12, color: "#1565C0", fontWeight: "700" },
  memberActionSave: { fontSize: 12, color: "#2D6A2D", fontWeight: "700" },
  memberActionRemove: { fontSize: 14, color: "#dc2626", fontWeight: "900" },
  adminBadge: { backgroundColor: "#E3F0A3", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  adminBadgeText: { fontSize: 11, color: "#2D6A2D", fontWeight: "700" },
  codeBox: { backgroundColor: "#E3F0A3", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 4 },
  codeText: { fontSize: 36, fontWeight: "900", color: "#2D6A2D", letterSpacing: 10 },
  inviteRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  inviteInput: { flex: 1, backgroundColor: "#f5f5f5", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#1a1a1a" },
  inviteButton: { backgroundColor: "#2D6A2D", borderRadius: 20, paddingHorizontal: 20, justifyContent: "center" },
  inviteButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  buttonDisabled: { opacity: 0.5 },
  messageText: { fontSize: 13 },
  successText: { color: "#2D6A2D" },
  errorText: { color: "#dc2626" },
  primaryButton: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  primaryButtonText: { fontSize: 16, color: "#fff", fontWeight: "700" },
});
