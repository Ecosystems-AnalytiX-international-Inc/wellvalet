import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import { DeliveryPlatform, PLATFORM_INFO, generateAffiliateUrl, formatListForPlatform } from "./affiliateUrls";

interface Props {
  visible: boolean;
  items: string[];
  onClose: () => void;
  onOpenBrowser: (url: string, platform: DeliveryPlatform, listText: string) => void;
}

export default function OrderDeliveryModal({ visible, items, onClose, onOpenBrowser }: Props) {
  const [preparing, setPreparing] = useState<DeliveryPlatform | null>(null);
  const platforms: DeliveryPlatform[] = ["walmart", "instacart", "hellofresh"];
  const itemCount = items.filter(i => i.trim().length > 0).length;

  const handleSelect = async (platform: DeliveryPlatform) => {
    setPreparing(platform);
    const listText = formatListForPlatform(items, platform);
    await Clipboard.setStringAsync(listText);
    const url = generateAffiliateUrl(platform);
    setTimeout(() => {
      setPreparing(null);
      onClose();
      onOpenBrowser(url, platform, listText);
    }, 600);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Order for Delivery</Text>
          <Text style={styles.subtitle}>
            {itemCount} item{itemCount !== 1 ? "s" : ""} on your list · Your list will be copied to clipboard automatically
          </Text>
          {platforms.map(platform => {
            const info = PLATFORM_INFO[platform];
            const isLoading = preparing === platform;
            return (
              <TouchableOpacity
                key={platform}
                style={[styles.platformCard, { borderLeftColor: info.color }]}
                onPress={() => handleSelect(platform)}
                disabled={preparing !== null}
              >
                <View style={styles.platformLeft}>
                  <Text style={styles.platformEmoji}>{info.emoji}</Text>
                  <View>
                    <Text style={styles.platformLabel}>{info.label}</Text>
                    <Text style={styles.platformDesc}>{info.description}</Text>
                    <Text style={styles.platformComm}>{info.cookie} cookie · {info.commission}</Text>
                  </View>
                </View>
                {isLoading
                  ? <ActivityIndicator size="small" color={info.color} />
                  : <Text style={[styles.platformArrow, { color: info.color }]}>→</Text>}
              </TouchableOpacity>
            );
          })}
          <View style={styles.howItWorks}>
            <Text style={styles.howTitle}>How it works</Text>
            <Text style={styles.howStep}>1.  Tap a platform — your list copies to clipboard</Text>
            <Text style={styles.howStep}>2.  Platform opens inside WellValet</Text>
            <Text style={styles.howStep}>3.  Paste your list into the platform's search box</Text>
            <Text style={styles.howStep}>4.  Add to cart and check out as normal</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet:         { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  handle:        { width: 40, height: 4, backgroundColor: "#E0E0E0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  title:         { fontSize: 20, fontWeight: "900", color: "#2D6A2D", marginBottom: 6 },
  subtitle:      { fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 20 },
  platformCard:  { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FBF9", borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 4 },
  platformLeft:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  platformEmoji: { fontSize: 28 },
  platformLabel: { fontSize: 15, fontWeight: "800", color: "#1A1A1A", marginBottom: 2 },
  platformDesc:  { fontSize: 13, color: "#555", marginBottom: 2 },
  platformComm:  { fontSize: 11, color: "#999", fontStyle: "italic" },
  platformArrow: { fontSize: 22, fontWeight: "700", paddingLeft: 8 },
  howItWorks:    { backgroundColor: "#E8F5E9", borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 16 },
  howTitle:      { fontSize: 13, fontWeight: "800", color: "#2D6A2D", marginBottom: 8 },
  howStep:       { fontSize: 12, color: "#444", lineHeight: 22 },
  closeBtn:      { alignItems: "center", paddingVertical: 14 },
  closeBtnText:  { fontSize: 15, color: "#C0392B", fontWeight: "700" },
});
