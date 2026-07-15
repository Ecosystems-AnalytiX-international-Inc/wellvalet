import { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isPremium, setPremium } from "../components/premiumService";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE = "https://api.wellvalet.com";

const SUGGESTIONS = [
  "Recipe with my shopping list 🛒",
  "Is olive oil healthy? 🫒",
  "Explain E numbers 🔬",
  "Low sugar breakfast ideas 🌅",
  "High protein snacks 💪",
  "Foods to avoid with high blood pressure 🩺",
  "Quick 15-minute dinner ideas ⏱",
];

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function AIValetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    text: "Hi! I am your WellValet AI Valet. I can help you find recipes, explain ingredients, suggest healthier alternatives, and answer wellness questions.\n\nWhat would you like to know today? 🌿",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLimitReached, setAiLimitReached] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Re-sync premium status to backend in case it was set before backend sync existed
  useEffect(() => {
    isPremium().then(p => { if (p) setPremium(true); });
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: message }]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const token = await AsyncStorage.getItem("AUTH_TOKEN");
      // Read shopping list — family list from API, personal from AsyncStorage
      let shoppingItems: string[] = [];
      try {
        const { isFamilyPlan } = require("../components/premiumService");
        const { getUserEmail, fetchWithAuth } = require("../components/authService");
        const famPlan = await isFamilyPlan();
        if (famPlan) {
          // Family plan — fetch from backend
          const famRes = await fetchWithAuth("https://api.wellvalet.com/family/shopping");
          const famData = await famRes.json();
          if (famData && Array.isArray(famData.shopping_list)) {
            shoppingItems = famData.shopping_list.flatMap((m: any) =>
              (m.items || []).map((it: any) => it.text || it.item || "")
            ).filter(Boolean);
          }
        } else {
          // Solo plan — read from AsyncStorage
          const email = await getUserEmail();
          const key = email ? `SHOPPING_ITEMS_${email.toLowerCase()}` : "SHOPPING_ITEMS";
          const saved = await AsyncStorage.getItem(key);
          if (saved) shoppingItems = JSON.parse(saved);
        }
      } catch {}

      const res = await fetch(`${API_BASE}/ai-valet`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, shopping_items: shoppingItems }),
      });
      const data = await res.json();
      if (data.error === "ai_limit_reached") {
        setAiLimitReached(true);
        setLoading(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
        return;
      }
      const reply = data.reply || data.error || "Sorry, I could not process that. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "I am having trouble connecting. Please check your connection and try again." }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }, [loading]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              <Text style={styles.wv}>Well</Text><Text style={styles.vv}>Valet</Text>
              <Text style={styles.headerTitleRest}> AI Valet</Text>
            </Text>
            <Text style={styles.headerSub}>Your personal wellness assistant</Text>
          </View>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
        </View>

        {/* Suggestion chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll} contentContainerStyle={styles.suggestionsContent}>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity key={i} style={styles.chip} onPress={() => sendMessage(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((msg, i) => (
            <View key={i} style={[styles.bubble, msg.role === "user" ? styles.userBubble : styles.aiBubble]}>
              {msg.role === "assistant" && <Text style={styles.bubbleLabel}>🌿 AI Valet</Text>}
              <Text style={msg.role === "user" ? styles.userText : styles.aiText}>{msg.text}</Text>
            </View>
          ))}
          {loading && (
            <View style={styles.aiBubble}>
              <Text style={styles.bubbleLabel}>🌿 AI Valet</Text>
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color="#2D6A2D" />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <Text style={styles.disclaimer}>AI Valet provides wellness information only — not medical advice.</Text>

        {/* AI limit notice */}
        {aiLimitReached && (
          <View style={styles.aiLimitBox}>
            <Text style={styles.aiLimitTitle}>🤖 Daily question used</Text>
            <Text style={styles.aiLimitSub}>
              You have 1 free AI Valet question per day. Upgrade for unlimited questions.

            </Text>
            <TouchableOpacity
              style={styles.aiLimitCta}
              onPress={() => router.push("/upgrade")}
            >
              <Text style={styles.aiLimitCtaText}>Unlock Unlimited AI Valet</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputRow, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
          <TextInput style={styles.input} placeholder="Ask me anything about wellness..."
            placeholderTextColor="#aaa" value={input} onChangeText={setInput}
            multiline maxLength={500} returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)} />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || loading || aiLimitReached) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)} disabled={!input.trim() || loading || aiLimitReached}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: "#E3F0A3" },
  container:        { flex: 1 },
  header:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#2D6A2D" },
  backBtn:          { paddingRight: 8 },
  backText:         { color: "#42D674", fontWeight: "700", fontSize: 14 },
  headerCenter:     { flex: 1, alignItems: "center" },
  headerTitle:      { fontSize: 16 },
  wv:               { fontWeight: "900", color: "#fff" },
  vv:               { fontWeight: "900", color: "#42D674" },
  headerTitleRest:  { fontWeight: "700", color: "#D6EAA0" },
  headerSub:        { fontSize: 11, color: "#A8D5A2", marginTop: 1 },
  premiumBadge:     { backgroundColor: "#42D674", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  premiumBadgeText: { fontSize: 10, fontWeight: "900", color: "#2D6A2D" },
  suggestionsScroll:   { maxHeight: 44, backgroundColor: "#fff" },
  suggestionsContent:  { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip:             { backgroundColor: "#E8F5E9", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: "#42D674" },
  chipText:         { fontSize: 12, color: "#2D6A2D", fontWeight: "600" },
  messages:         { flex: 1, backgroundColor: "#F9FBF9" },
  messagesContent:  { padding: 16, gap: 12, paddingBottom: 8 },
  bubble:           { borderRadius: 16, padding: 14, maxWidth: "88%" },
  userBubble:       { backgroundColor: "#2D6A2D", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiBubble:         { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  bubbleLabel:      { fontSize: 11, color: "#2D6A2D", fontWeight: "700", marginBottom: 6 },
  userText:         { fontSize: 15, color: "#fff", lineHeight: 22 },
  aiText:           { fontSize: 15, color: "#1a1a1a", lineHeight: 23 },
  typingRow:        { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText:       { fontSize: 13, color: "#888", fontStyle: "italic" },
  disclaimer:       { fontSize: 11, color: "#aaa", textAlign: "center", paddingHorizontal: 20, paddingVertical: 6, backgroundColor: "#F9FBF9" },
  inputRow:         { flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E0E0E0" },
  input:            { flex: 1, backgroundColor: "#F5F5F5", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: "#1a1a1a", maxHeight: 100, borderWidth: 1, borderColor: "#E0E0E0" },
  sendBtn:          { backgroundColor: "#2D6A2D", borderRadius: 22, width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  sendBtnDisabled:  { opacity: 0.4 },
  sendBtnText:      { fontSize: 18, color: "#fff", fontWeight: "700" },

  aiLimitBox:     { backgroundColor: "#1a3a1a", borderRadius: 16, padding: 20,
                     marginBottom: 16, alignItems: "center" },
  aiLimitTitle:   { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 8 },
  aiLimitSub:     { fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center",
                     lineHeight: 20, marginBottom: 16 },
  aiLimitCta:     { backgroundColor: "#42D674", borderRadius: 20, paddingVertical: 12,
                     paddingHorizontal: 28 },
  aiLimitCtaText: { fontSize: 14, fontWeight: "800", color: "#1a3a1a" },
});
