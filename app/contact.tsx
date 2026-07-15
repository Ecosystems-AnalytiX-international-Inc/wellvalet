import { ScrollView, Text, View, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { getUserEmail } from "../components/authService";

const API_BASE_URL = "https://api.wellvalet.com";

export default function ContactScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > 250;

  const sendMessage = async () => {
    if (!message.trim()) {
      setStatus("Please enter a message before sending.");
      return;
    }
    if (isOverLimit) {
      setStatus("Please keep your message under 250 words.");
      return;
    }

    setSending(true);
    setStatus("");

    try {
      const email = await getUserEmail();

      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_email: email || "unknown@wellvalet.com",
          message: message.trim(),
        }),
      });

      const json = await res.json();

      if (json.error) {
        setStatus("Failed to send. Please try again.");
      } else {
        setStatus("Message sent successfully! We will get back to you soon.");
        setMessage("");
      }
    } catch {
      setStatus("Could not send message. Please check your connection.");
    }

    setSending(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Contact Us</Text>
      </View>

      <Text style={styles.subtitle}>
        Have a question or feedback? We would love to hear from you. Send us a message and we will get back to you as soon as possible.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your Message</Text>
        <TextInput
          style={styles.textArea}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={8}
          placeholder="Type your message here..."
          placeholderTextColor="#999"
          textAlignVertical="top"
        />
        <Text style={[styles.wordCount, isOverLimit && styles.wordCountOver]}>
          {wordCount} / 250 words
        </Text>
      </View>

      {status ? (
        <Text style={[styles.status, status.includes("successfully") && styles.statusSuccess]}>
          {status}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.sendButton, (sending || isOverLimit) && styles.sendButtonDisabled]}
        onPress={sendMessage}
        disabled={sending || isOverLimit}
      >
        <Text style={styles.sendButtonText}>
          {sending ? "Sending..." : "Send Message"}
        </Text>
      </TouchableOpacity>

      <View style={styles.contactInfo}>
        <Text style={styles.contactInfoTitle}>Other ways to reach us:</Text>
        <Text style={styles.contactInfoText}>📧 cruise.analytix@gmail.com</Text>
        <Text style={styles.contactInfoText}>🌐 www.cruise-mu.com</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backText: { fontSize: 16, color: "#2D6A2D", fontWeight: "600", marginRight: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#444", lineHeight: 22, marginBottom: 24 },
  card: { backgroundColor: "#D6EAA0", borderRadius: 14, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 10 },
  textArea: { backgroundColor: "#E8E8E8", borderRadius: 10, padding: 12, fontSize: 14, color: "#1a1a1a", minHeight: 160 },
  wordCount: { fontSize: 12, color: "#666", textAlign: "right", marginTop: 8 },
  wordCountOver: { color: "red", fontWeight: "bold" },
  status: { fontSize: 14, color: "red", textAlign: "center", marginBottom: 16 },
  statusSuccess: { color: "#2D6A2D", fontWeight: "bold" },
  sendButton: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 16, alignItems: "center", marginBottom: 24 },
  sendButtonDisabled: { backgroundColor: "#aaa" },
  sendButtonText: { fontSize: 16, color: "white", fontWeight: "600" },
  contactInfo: { backgroundColor: "#D6EAA0", borderRadius: 14, padding: 16 },
  contactInfoTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", marginBottom: 10 },
  contactInfoText: { fontSize: 14, color: "#444", marginBottom: 6 },
});
