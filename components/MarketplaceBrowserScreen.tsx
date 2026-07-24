import { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform } from "react-native";
import { WebView } from "react-native-webview";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

type DeliveryPlatform = "walmart" | "instacart" | "hellofresh";

interface Props {
  url: string; platform: DeliveryPlatform;
  listText: string; itemCount: number; onClose: () => void;
}

const PLATFORM_LABELS: Record<DeliveryPlatform, string> = { walmart: "Walmart", instacart: "Instacart", hellofresh: "HelloFresh" };
const PLATFORM_COLORS: Record<DeliveryPlatform, string> = { walmart: "#0071CE", instacart: "#43B02A", hellofresh: "#99CC00" };
const PASTE_HINTS: Record<DeliveryPlatform, string> = {
  walmart:    "1. Tap the search bar at the top\n2. Long-press and tap Paste\n3. Walmart matches your items",
  instacart:  "1. Tap \"Shopping List\" at the bottom\n2. Tap the Paste icon\n3. Instacart matches all items",
  hellofresh: "1. Browse meal kits that match your list\n2. Select a plan and order",
};

export default function MarketplaceBrowserScreen({ url, platform, listText, itemCount, onClose }: Props) {
  const [loading, setLoading]     = useState(true);
  const [showHint, setShowHint]   = useState(true);
  const [copied, setCopied]       = useState(false);
  const webRef                    = useRef<any>(null);
  const color                     = PLATFORM_COLORS[platform];
  const label                     = PLATFORM_LABELS[platform];

  const handleCopyAgain = async () => {
    await Clipboard.setStringAsync(listText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: color }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <View style={styles.closeBtnRow}>
            <Ionicons name="close" size={14} color="#C0392B" />
            <Text style={styles.closeBtnText}>Close</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            <Text style={styles.wv}>Well</Text><Text style={[styles.vv, { color }]}>Valet</Text>
          </Text>
          <Text style={styles.headerSub}>Shopping via {label}</Text>
        </View>
        <TouchableOpacity onPress={handleCopyAgain} style={styles.copyBtn}>
          <View style={styles.copyBtnRow}>
            <Ionicons
              name={copied ? "checkmark-circle" : "clipboard-outline"}
              size={13}
              color="#2D6A2D"
            />
            <Text style={styles.copyBtnText}>{copied ? "Copied" : "Copy list"}</Text>
          </View>
        </TouchableOpacity>
      </View>
      {showHint && (
        <View style={[styles.hintBanner, { backgroundColor: color }]}>
          <View style={styles.hintContent}>
            <View style={styles.hintTitleRow}>
              <Ionicons name="clipboard-outline" size={13} color="#fff" />
              <Text style={styles.hintTitle}>{itemCount} items copied to clipboard</Text>
            </View>
            <Text style={styles.hintBody}>{PASTE_HINTS[platform]}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowHint(false)} style={styles.hintClose}>
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={color} />
          <Text style={styles.loadingText}>Opening {label}...</Text>
        </View>
      )}
      <WebView
        ref={webRef} source={{ uri: url }} style={styles.webview}
        onLoadStart={() => setLoading(true)} onLoadEnd={() => setLoading(false)}
        sharedCookiesEnabled thirdPartyCookiesEnabled domStorageEnabled javaScriptEnabled
        allowsBackForwardNavigationGestures startInLoadingState={false}
        userAgent={Platform.OS === "ios"
          ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
          : "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },
  header:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, backgroundColor: "#fff" },
  closeBtn:       { paddingHorizontal: 8, paddingVertical: 4 },
  closeBtnRow:    { flexDirection: "row", alignItems: "center", gap: 4 },
  closeBtnText:   { fontSize: 14, color: "#C0392B", fontWeight: "700" },
  headerCenter:   { flex: 1, alignItems: "center" },
  headerTitle:    { fontSize: 16, fontWeight: "900" },
  wv:             { color: "#2D6A2D" },
  vv:             { fontWeight: "900" },
  headerSub:      { fontSize: 11, color: "#888", marginTop: 1 },
  copyBtn:        { paddingHorizontal: 8, paddingVertical: 4 },
  copyBtnRow:     { flexDirection: "row", alignItems: "center", gap: 4 },
  copyBtnText:    { fontSize: 12, color: "#2D6A2D", fontWeight: "700" },
  hintBanner:     { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 12 },
  hintContent:    { flex: 1 },
  hintTitleRow:   { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  hintTitle:      { fontSize: 13, fontWeight: "800", color: "#fff" },
  hintBody:       { fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 18 },
  hintClose:      { paddingLeft: 12, paddingTop: 2 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", zIndex: 10 },
  loadingText:    { marginTop: 12, fontSize: 14, color: "#666" },
  webview:        { flex: 1 },
});
