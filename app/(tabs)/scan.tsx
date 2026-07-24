import { useState, useRef } from "react";
import {
  Text, View, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated, Linking
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Link, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { fetchWithAuth, getAuthToken } from "../../components/authService";
import { getUserProfile } from "../../components/profileService";
import { savePurchasedItem } from "../../components/historyService";
import { isPremium } from "../../components/premiumService";
import { useEffect } from "react";
import ScoreRing from "../../components/ScoreRing";
import BeautyResultScreen from "../../components/BeautyResultScreen";
import OCRScanScreen from "../../components/OCRScanScreen";

const API_BASE_URL = "https://api.wellvalet.com";
const { width } = Dimensions.get("window");

export default function ScanTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<"choice" | "food" | "beauty">("choice");
  const [scanned, setScanned] = useState(false);
  const scanningRef = useRef(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bagPromptVisible, setBagPromptVisible] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [premium, setPremiumState] = useState(false);
  const [isBeauty, setIsBeauty] = useState(false);
  const [beautyOCRResult, setBeautyOCRResult] = useState<any>(null);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [scansRemaining, setScansRemaining] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    isPremium().then(setPremiumState);
  }, []);

  const defaultProfile = {
    age: 35,
    weight_kg: 80,
    weight_goal: "lose_weight",
    activity_level: "medium",
    known_illness: [],
    allergies: [],
  };

  const resetAll = () => {
    scanningRef.current = false;
    setScanned(false);
    setResult(null);
    setLoading(false);
    setBagPromptVisible(false);
    setSavedMessage("");
    setIsBeauty(false);
    setBeautyOCRResult(null);
    setScanMode("choice");
    setScanLimitReached(false);
  };

  // ── FOOD SCAN HANDLER ────────────────────────────────
  const handleFoodScan = async ({ data }: any) => {
    if (scanned || scanningRef.current) return;
    scanningRef.current = true;
    setScanned(true);
    setLoading(true);
    setBagPromptVisible(false);
    setSavedMessage("");
    setResult(null);

    try {
      const savedProfile = await getUserProfile();
      const profilePayload = savedProfile ? {
        age: Number(savedProfile.age),
        weight_kg: Number(savedProfile.weight_kg),
        weight_goal: savedProfile.weight_goal,
        activity_level: savedProfile.activity_level,
        known_illness: Array.isArray(savedProfile.known_illness)
          ? savedProfile.known_illness.filter((x: string) => x !== "none")
          : savedProfile.known_illness === "none" ? [] : [savedProfile.known_illness],
        allergies: Array.isArray(savedProfile.allergies)
          ? savedProfile.allergies.includes("none") ? [] : savedProfile.allergies
          : [],
      } : defaultProfile;

      const response = await fetchWithAuth(`${API_BASE_URL}/scan/food`, {
        method: "POST",
        body: JSON.stringify({ barcode: data, user_profile: profilePayload }),
      });

      const json = await response.json();
      setLoading(false);
      // Handle daily scan limit for free users
      if (json.error === "scan_limit_reached") {
        setScanLimitReached(true);
        scanningRef.current = false;
        setScanned(false);
        return;
      }
      setResult(json);
      // Update remaining scan count for free users
      if (json.scans_remaining !== undefined) {
        setScansRemaining(json.scans_remaining);
      }
      if (!json.error) setBagPromptVisible(true);
    } catch {
      setResult({ error: "Backend not reachable", help: "Check your connection." });
      setLoading(false);
    }
  };

  // ── BEAUTY OCR RESULT HANDLER ────────────────────────
  const handleBeautyOCRResult = (data: any) => {
    setBeautyOCRResult(data);
  };

  const saveBaggedItem = async () => {
    if (!result || result.error) return;
    const ok = await savePurchasedItem(result);
    try {
      const token = await getAuthToken();
      await fetchWithAuth(`${API_BASE_URL}/activity`, {
        method: "POST",
        body: JSON.stringify({
          event_type: "bagged",
          barcode: result?.barcode,
          product_name: result?.name,
          score: result?.score,
          label: result?.label,
        }),
      });
    } catch {
      console.log("Could not log bagged activity.");
    }
    setSavedMessage(ok ? "Item saved to purchase history." : "Could not save item.");
    if (ok) setBagPromptVisible(false);
  };

  const getColor = (label: string) => {
    if (label === "Good") return "#4CAF50";
    if (label === "Moderate") return "#FFC107";
    return "#F44336";
  };

  const isAllergenIngredient = (ingredient: string) => {
    const matches = result?.allergen_alert?.matches || [];
    return matches.some((match: any) => {
      const keyword = match.matched_keyword?.toLowerCase();
      return keyword && ingredient.toLowerCase().includes(keyword);
    });
  };

  if (!permission) {
    return <View style={styles.center}><Text>Loading camera...</Text></View>;
  }

  // Apple Guideline 5.1.1(iv): pre-permission screen explains WHY we need the camera.
  // The CTA is neutral ("Continue"), and the native iOS prompt is triggered only when the
  // user taps it. If the user previously denied permission, we surface a Settings deep-link
  // instead of re-requesting (iOS will not show the system prompt a second time).
  if (!permission.granted) {
    const permanentlyDenied = permission.canAskAgain === false;

    const handleContinue = async () => {
      if (permanentlyDenied) {
        await Linking.openSettings();
        return;
      }
      await requestPermission();
    };

    return (
      <View style={styles.permissionScreen}>
        <View style={styles.permissionIconWrap}>
          <Ionicons name="camera-outline" size={56} color="#2D6A2D" />
        </View>
        <Text style={styles.permissionTitle}>Scan products with your camera</Text>
        <Text style={styles.permissionBody}>
          WellValet uses your camera to scan barcodes on food and beauty products so we can
          analyse ingredients and flag allergens from your profile. Photos are processed on
          the device and are never uploaded or stored.
        </Text>

        {permanentlyDenied ? (
          <>
            <Text style={styles.permissionHint}>
              Camera access is currently disabled for WellValet. Open Settings to turn it on.
            </Text>
            <TouchableOpacity style={styles.permissionPrimaryBtn} onPress={handleContinue}>
              <Text style={styles.permissionPrimaryBtnText}>Open Settings</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.permissionPrimaryBtn} onPress={handleContinue}>
            <Text style={styles.permissionPrimaryBtnText}>Continue</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.permissionFootnote}>
          You can change this later in iOS Settings › WellValet › Camera.
        </Text>
      </View>
    );
  }

  // ── SCAN LIMIT MODAL ─────────────────────────────────
  if (scanLimitReached) {
    return (
      <View style={styles.limitContainer}>
        <Ionicons name="lock-closed" size={56} color="#fff" style={styles.limitIcon} />
        <Text style={styles.limitTitle}>Daily scan limit reached</Text>
        <Text style={styles.limitSub}>
          You have used your 3 free scans for today. Scans refresh at midnight.
        </Text>
        <TouchableOpacity
          style={styles.limitCta}
          onPress={() => router.push("/upgrade")}
        >
          <Text style={styles.limitCtaText}>Unlock Unlimited Scans</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.limitSkip}
          onPress={() => { setScanLimitReached(false); setScanMode("choice"); }}
        >
          <Text style={styles.limitSkipText}>Remind me tomorrow</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── CHOICE SCREEN ────────────────────────────────────
  if (scanMode === "choice") {
    return (
      <View style={styles.choiceContainer}>
        <View style={styles.choiceHeader}>
          <Text style={styles.choiceTitle}>WellValet</Text>
          <Link href="/profile" style={styles.profileLink}>
            <Ionicons name="person-circle-outline" size={30} color="#2D6A2D" />
          </Link>
        </View>

        <Text style={styles.choiceSubtitle}>What would you like to scan today?</Text>
        <Text style={styles.choiceTagline}>Personalised wellness scores for every product</Text>

        {/* Food Card */}
        <TouchableOpacity
          style={styles.choiceCard}
          onPress={() => setScanMode("food")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Food Product Scan"
          accessibilityHint="Scan any food barcode to receive instant wellness score and nutritional analysis"
        >
          <View style={styles.choiceCardInner}>
            <MaterialCommunityIcons name="food-apple-outline" size={44} color="#2D6A2D" style={styles.choiceCardIcon} />
            <View style={styles.choiceCardText}>
              <Text style={styles.choiceCardTitle}>Food Product</Text>
              <Text style={styles.choiceCardDesc}>
                Scan the barcode on any food product to get an instant wellness score, allergen alerts and nutritional analysis.
              </Text>
              <View style={styles.choiceCardTags}>
                <View style={styles.tag}><Text style={styles.tagText}>Barcode scan</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>Nutrition</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>Allergens</Text></View>
              </View>
            </View>
          </View>
          <View style={styles.choiceCardArrow}>
            <Text style={styles.choiceCardArrowText}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Beauty Card */}
        <TouchableOpacity
          style={[styles.choiceCard, styles.beautyCard]}
          onPress={() => setScanMode("beauty")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Beauty Product Scan"
          accessibilityHint="Point camera at skincare or cosmetics ingredients label for safety analysis"
        >
          <View style={styles.choiceCardInner}>
            <MaterialCommunityIcons name="lipstick" size={44} color="#7B1FA2" style={styles.choiceCardIcon} />
            <View style={styles.choiceCardText}>
              <Text style={[styles.choiceCardTitle, styles.beautyTitle]}>Beauty Product</Text>
              <Text style={styles.choiceCardDesc}>
                Point your camera at the ingredients label of any skincare, haircare or cosmetic product for a personalised safety score.
              </Text>
              <View style={styles.choiceCardTags}>
                <View style={[styles.tag, styles.beautyTag]}><Text style={[styles.tagText, styles.beautyTagText]}>Ingredients scan</Text></View>
                <View style={[styles.tag, styles.beautyTag]}><Text style={[styles.tagText, styles.beautyTagText]}>Skin profile</Text></View>
                <View style={[styles.tag, styles.beautyTag]}><Text style={[styles.tagText, styles.beautyTagText]}>Safety score</Text></View>
              </View>
            </View>
          </View>
          <View style={[styles.choiceCardArrow, styles.beautyArrow]}>
            <Text style={styles.choiceCardArrowText}>→</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.choiceFooterRow}>
          <Ionicons name="checkmark-circle" size={13} color="#4a7a4a" />
          <Text style={styles.choiceFooter}>Food scanning always free</Text>
          <Text style={styles.choiceFooter}>·</Text>
          <MaterialCommunityIcons name="lipstick" size={13} color="#4a7a4a" />
          <Text style={styles.choiceFooter}>Beauty scanning included in Premium</Text>
        </View>
      </View>
    );
  }

  // ── BEAUTY OCR SCREEN ────────────────────────────────
  if (scanMode === "beauty" && !beautyOCRResult) {
    if (!premium) {
      return (
        <View style={styles.center}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 28, margin: 24, alignItems: "center" }}>
            <MaterialCommunityIcons name="lipstick" size={48} color="#7B1FA2" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#2D6A2D", marginBottom: 10 }}>Premium Feature</Text>
            <Text style={{ fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 20 }}>
              Beauty product scanning is available to Premium members only.
              Upgrade to scan cosmetics, skincare and personal care products.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 28, marginBottom: 12 }}
              onPress={() => { resetAll(); router.push("/upgrade"); }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Go Premium as from C$4.17/month</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetAll} style={{ paddingVertical: 10 }}>
              <Text style={{ fontSize: 14, color: "#2D6A2D", fontWeight: "600" }}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <OCRScanScreen
        onResult={handleBeautyOCRResult}
        onCancel={resetAll}
      />
    );
  }

  // ── BEAUTY RESULT SCREEN ─────────────────────────────
  if (scanMode === "beauty" && beautyOCRResult) {
    return (
      <BeautyResultScreen
        result={beautyOCRResult}
        onScanAgain={resetAll}
        onScanIngredients={resetAll}
      />
    );
  }

  // ── FOOD SCAN SCREEN ─────────────────────────────────
  if (scanMode === "food" && !scanned) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={resetAll} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.scanTitle}>Scan Food Barcode</Text>
          <Link href="/profile" style={styles.profileLink}>
            <Ionicons name="person-circle-outline" size={28} color="#fff" />
          </Link>
        </View>
        <View style={styles.cameraWrapper}>
          <CameraView style={styles.camera} onBarcodeScanned={handleFoodScan} />
          {!premium && scansRemaining !== null && (
            <View style={styles.scanCounter}>
              {scansRemaining === 0 ? (
                <>
                  <Ionicons name="lock-closed" size={13} color="#fff" />
                  <Text style={styles.scanCounterText}>No free scans left today</Text>
                </>
              ) : (
                <Text style={styles.scanCounterText}>
                  {`${scansRemaining} free scan${scansRemaining !== 1 ? "s" : ""} left today`}
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.scanHintBar}>
          <View style={styles.scanHintRow}>
            <Ionicons name="cube-outline" size={14} color="#fff" />
            <Text style={styles.scanHintText}>
              Point camera at the barcode on the product packaging
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── FOOD LOADING ─────────────────────────────────────
  if (scanMode === "food" && loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Checking product...</Text>
      </View>
    );
  }

  // ── FOOD RESULT SCREEN ───────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.resultBox}>
      <View style={styles.header}>
        <TouchableOpacity onPress={resetAll} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Scan Again</Text>
        </TouchableOpacity>
        <Link href="/profile" style={styles.profileLink}>
          <Ionicons name="person-circle-outline" size={30} color="#2D6A2D" />
        </Link>
      </View>

      {result?.error ? (
        <View style={styles.errorCard}>
          <View style={styles.errorTitleRow}>
            <Ionicons name="search-outline" size={20} color="#2D6A2D" />
            <Text style={styles.errorTitle}>Product Not Found</Text>
          </View>
          <Text style={styles.errorHint}>This barcode is not in our food database yet.</Text>
          <Text style={styles.errorHint}>Is this a beauty or personal care product?</Text>
          <TouchableOpacity
            style={styles.ocrButton}
            onPress={() => { setScanMode("beauty"); setResult(null); setScanned(false); scanningRef.current = false; }}
          >
            <View style={styles.ocrButtonRow}>
              <MaterialCommunityIcons name="lipstick" size={15} color="#fff" />
              <Text style={styles.ocrButtonText}>Try Beauty Scan Instead</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanAgainButtonAlt} onPress={resetAll}>
            <Text style={styles.scanAgainTextAlt}>← Scan a Different Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.productCard}>
            <Text style={styles.productLabel}>Product Name</Text>
            <Text style={styles.productNameText}>{result?.name}</Text>
            <Text style={styles.productLabel}>Brand</Text>
            <Text style={styles.brandText}>{result?.brand}</Text>
          </View>

          {result?.allergen_alert?.has_alert && (
            <View style={styles.alertBanner}>
              <View style={styles.alertTitleRow}>
                <Ionicons name="warning-outline" size={16} color="#92400E" />
                <Text style={styles.alertTitle}>ALLERGEN WARNING</Text>
              </View>
              <Text style={styles.alertMessage}>{result?.allergen_alert?.message}</Text>
              {result?.allergen_alert?.matches?.map((match: any, index: number) => (
                <Text key={index} style={styles.alertItem}>
                  • {match.allergy.toUpperCase()} detected ({match.matched_keyword})
                </Text>
              ))}
            </View>
          )}

          <ScoreRing score={result?.score || 0} label={result?.label || "Good"} letter={result?.letter} />

          {premium ? (
            <>
              <View style={styles.nutritionSection}>
                <Text style={styles.sectionTitle}>Nutrition per 100g</Text>
                {result?.nutrition?.calories_100g == null && result?.nutrition?.sugar_100g == null && result?.nutrition?.fat_100g == null && result?.nutrition?.salt_100g == null ? (
                  <View style={styles.warningRow}>
                    <Ionicons name="warning-outline" size={14} color="#F59E0B" />
                    <Text style={styles.warningText}>Nutritional data not available. Please check the product label directly.</Text>
                  </View>
                ) : null}
                <Text style={styles.nutritionText}>Calories: {result?.nutrition?.calories_100g != null ? result.nutrition.calories_100g > 0 ? Number(result.nutrition.calories_100g).toFixed(1) + " kcal" : "N/A" : "N/A"}</Text>
                <Text style={styles.nutritionText}>Sugar: {result?.nutrition?.sugar_100g != null ? result.nutrition.sugar_100g > 0 ? Number(result.nutrition.sugar_100g).toFixed(1) + " g" : "N/A" : "N/A"}</Text>
                <Text style={styles.nutritionText}>Fat: {result?.nutrition?.fat_100g != null ? result.nutrition.fat_100g > 0 ? Number(result.nutrition.fat_100g).toFixed(1) + " g" : "N/A" : "N/A"}</Text>
                <Text style={styles.nutritionText}>Salt: {result?.nutrition?.salt_100g != null ? result.nutrition.salt_100g > 0 ? Number(result.nutrition.salt_100g).toFixed(1) + " g" : "N/A" : "N/A"}</Text>
              </View>
              <View style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>Personalised Recommendation</Text>
                <Text style={styles.recommendationText}>{result?.recommendation}</Text>
                <Text style={styles.recommendationTitle}>Better Alternative</Text>
                <Text style={styles.recommendationText}>{result?.alternative}</Text>
                <Text style={styles.recommendationTitle}>Ingredient List</Text>
                {!premium && (
                  <TouchableOpacity
                    style={styles.lockBanner}
                    onPress={() => router.push("/upgrade")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="lock-closed" size={22} color="#fff" />
                    <View style={styles.lockBannerText}>
                      <Text style={styles.lockBannerTitle}>Full ingredients & allergen detail</Text>
                      <Text style={styles.lockBannerSub}>Unlock with Premium →</Text>
                    </View>
                  </TouchableOpacity>
                )}
                {result?.ingredients?.map((item: string, index: number) => {
                  const highlighted = isAllergenIngredient(item);
                  return (
                    <View key={index} style={styles.ingredientRow}>
                      <Text style={[styles.ingredientText, highlighted && styles.allergenIngredient]}>
                        • {item}
                      </Text>
                      {highlighted && (
                        <View style={styles.allergenTag}>
                          <Ionicons name="warning-outline" size={11} color="#B45309" />
                          <Text style={styles.allergenTagText}>allergen match</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.premiumLock}>
              <View style={styles.premiumLockBlur}>
                <Text style={styles.premiumLockBlurText}>Calories: ••••</Text>
                <Text style={styles.premiumLockBlurText}>Sugar: ••••</Text>
                <Text style={styles.premiumLockBlurText}>Fat: ••••</Text>
              </View>
              <View style={styles.premiumLockOverlay}>
                <Ionicons name="lock-closed" size={36} color="#2D6A2D" style={styles.premiumLockIcon} />
                <Text style={styles.premiumLockTitle}>Premium Feature</Text>
                <Text style={styles.premiumLockDesc}>
                  Unlock full nutrition details, personalised recommendations, better alternatives and ingredient list.
                </Text>
                <TouchableOpacity style={styles.premiumLockButton} onPress={() => router.push("/upgrade")}>
                  <Text style={styles.premiumLockButtonText}>Go Premium as from C$4.17/month</Text>
                </TouchableOpacity>
                <View style={styles.premiumLockFreeRow}>
                  <Ionicons name="checkmark-circle" size={12} color="#4a7a4a" />
                  <Text style={styles.premiumLockFree}>Score & allergen alerts always free</Text>
                </View>
              </View>
            </View>
          )}

          {bagPromptVisible && (
            <View style={styles.promptBox}>
              <Text style={styles.promptTitle}>Did you add this item to your bag?</Text>
              <View style={styles.promptButtons}>
                <TouchableOpacity style={styles.yesButton} onPress={saveBaggedItem}>
                  <Text style={styles.yesButtonText}>Yes, save to history</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.noButton} onPress={() => setBagPromptVisible(false)}>
                  <Text style={styles.noButtonText}>No, do not save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {savedMessage ? <Text style={styles.savedMessage}>{savedMessage}</Text> : null}
          <Text style={styles.disclaimer}>{result?.disclaimer}</Text>
        </>
      )}

      <TouchableOpacity style={styles.scanAgainButton} onPress={resetAll}>
        <Text style={styles.scanAgainText}>← Back to Scan Menu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Choice screen
  choiceContainer: { flex: 1, backgroundColor: "#E3F0A3", paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  choiceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  choiceTitle: { fontSize: 26, fontWeight: "900", color: "#2D6A2D", fontFamily: "Georgia" },
  choiceSubtitle: { fontSize: 18, fontWeight: "700", color: "#2D6A2D", marginBottom: 8, lineHeight: 26 },
  choiceTagline: { fontSize: 13, color: "#4a7a4a", marginBottom: 24, fontStyle: "italic" },
  choiceCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: "#2D6A2D", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10, borderLeftWidth: 5, borderLeftColor: "#2D6A2D" },
  beautyCard: { borderLeftColor: "#7B1FA2" },
  choiceCardInner: { flexDirection: "row", gap: 16 },
  choiceCardIcon: { marginTop: 4 },
  choiceCardText: { flex: 1 },
  choiceCardTitle: { fontSize: 20, fontWeight: "800", color: "#2D6A2D", marginBottom: 6 },
  beautyTitle: { color: "#7B1FA2" },
  choiceCardDesc: { fontSize: 14, color: "#555", lineHeight: 22, marginBottom: 12 },
  choiceCardTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: "#E3F0A3", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  beautyTag: { backgroundColor: "#F3E5F5" },
  tagText: { fontSize: 12, color: "#2D6A2D", fontWeight: "600" },
  beautyTagText: { color: "#7B1FA2" },
  choiceCardArrow: { position: "absolute", right: 20, top: "50%", backgroundColor: "#2D6A2D", width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  beautyArrow: { backgroundColor: "#7B1FA2" },
  choiceCardArrowText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  choiceFooterRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 4, marginTop: 16 },
  choiceFooter: { fontSize: 12, color: "#4a7a4a", lineHeight: 20 },

  // Food scan screen
  container: { flex: 1, backgroundColor: "#000" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "rgba(0,0,0,0.5)" },
  backBtn: { padding: 8 },
  backBtnText: { color: "#42D674", fontSize: 15, fontWeight: "600" },
  scanTitle: { fontSize: 16, color: "#fff", fontWeight: "700" },
  profileLink: { textDecorationLine: "none" },
  cameraWrapper: { flex: 1 },
  camera: { flex: 1 },
  scanHintBar: { backgroundColor: "rgba(0,0,0,0.7)", padding: 16, alignItems: "center" },
  scanHintRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  scanHintText: { color: "#fff", fontSize: 14, textAlign: "center" },

  // Loading
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#E3F0A3" },
  loadingText: { fontSize: 18, color: "#2D6A2D", fontWeight: "600" },

  // Pre-permission (Apple Guideline 5.1.1(iv)) — neutral CTA, contextual explanation.
  permissionScreen: {
    flex: 1, backgroundColor: "#E3F0A3", paddingHorizontal: 28, paddingTop: 80,
    alignItems: "center",
  },
  permissionIconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22, fontWeight: "800", color: "#1a3a1a", textAlign: "center", marginBottom: 14,
  },
  permissionBody: {
    fontSize: 15, color: "#2D6A2D", textAlign: "center", lineHeight: 22, marginBottom: 24,
  },
  permissionHint: {
    fontSize: 13, color: "#4a7a4a", textAlign: "center", marginBottom: 18, fontStyle: "italic",
  },
  permissionPrimaryBtn: {
    backgroundColor: "#2D6A2D", borderRadius: 28, paddingVertical: 14, paddingHorizontal: 44,
    minWidth: 220, alignItems: "center", marginBottom: 20,
  },
  permissionPrimaryBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  permissionFootnote: {
    fontSize: 12, color: "#4a7a4a", textAlign: "center", marginTop: 8, paddingHorizontal: 12,
  },
  titleText: { fontSize: 18, fontWeight: "600", color: "#2D6A2D", marginBottom: 16 },

  // Result screen
  resultBox: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  productCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 },
  productLabel: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 4, marginTop: 8 },
  productNameText: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  brandText: { fontSize: 15, color: "#555" },
  alertBanner: { backgroundColor: "#FFF3CD", borderRadius: 12, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#F59E0B" },
  alertTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  alertTitle: { fontSize: 15, fontWeight: "800", color: "#92400E" },
  alertMessage: { fontSize: 14, color: "#92400E", marginBottom: 4 },
  alertItem: { fontSize: 13, color: "#B45309", marginTop: 2 },
  nutritionSection: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#2D6A2D", marginBottom: 10 },
  nutritionText: { fontSize: 14, color: "#333", marginBottom: 4 },
  warningRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  warningText: { fontSize: 13, color: "#F59E0B", flex: 1 },
  recommendationCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 },
  recommendationTitle: { fontSize: 14, fontWeight: "700", color: "#2D6A2D", marginBottom: 6, marginTop: 10 },
  recommendationText: { fontSize: 14, color: "#333", lineHeight: 22 },
  ingredientRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 3 },
  ingredientText: { fontSize: 13, color: "#444" },
  allergenIngredient: { color: "#B45309", fontWeight: "600" },
  allergenTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  allergenTagText: { fontSize: 11, color: "#B45309", fontWeight: "600" },
  premiumLock: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, alignItems: "center" },
  premiumLockBlur: { width: "100%", marginBottom: 16 },
  premiumLockBlurText: { fontSize: 14, color: "#ddd", marginBottom: 4 },
  premiumLockOverlay: { alignItems: "center" },
  premiumLockIcon: { marginBottom: 8 },
  premiumLockTitle: { fontSize: 18, fontWeight: "800", color: "#2D6A2D", marginBottom: 8 },
  premiumLockDesc: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 16, lineHeight: 22 },
  premiumLockButton: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 12, paddingHorizontal: 24 },
  premiumLockButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  premiumLockFreeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  premiumLockFree: { fontSize: 12, color: "#4a7a4a" },
  promptBox: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 },
  promptTitle: { fontSize: 15, fontWeight: "700", color: "#2D6A2D", marginBottom: 12, textAlign: "center" },
  promptButtons: { flexDirection: "row", gap: 10 },
  yesButton: { flex: 1, backgroundColor: "#2D6A2D", borderRadius: 20, paddingVertical: 12, alignItems: "center" },
  yesButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  noButton: { flex: 1, backgroundColor: "#fff", borderRadius: 20, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#2D6A2D" },
  noButtonText: { color: "#2D6A2D", fontWeight: "700", fontSize: 14 },
  savedMessage: { fontSize: 14, color: "#2D6A2D", textAlign: "center", marginBottom: 12, fontWeight: "600" },
  disclaimer: { fontSize: 12, color: "#888", textAlign: "center", marginBottom: 16, lineHeight: 18 },
  scanAgainButton: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  scanAgainText: { fontSize: 16, color: "#fff", fontWeight: "700" },
  scanAgainButtonAlt: { marginTop: 16, paddingVertical: 10 },
  scanAgainTextAlt: { fontSize: 14, color: "#2D6A2D", fontWeight: "600", textAlign: "center" },
  errorCard: { backgroundColor: "#fff", borderRadius: 16, padding: 24, marginBottom: 16, alignItems: "center" },
  errorTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  errorTitle: { fontSize: 20, fontWeight: "800", color: "#2D6A2D" },
  errorHint: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 8, lineHeight: 22 },
  errorHintSmall: { fontSize: 12, color: "#888", textAlign: "center", marginTop: 8, lineHeight: 18, paddingHorizontal: 10 },
  ocrButton: { backgroundColor: "#7B1FA2", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 24, alignItems: "center", marginTop: 12 },
  ocrButtonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ocrButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Scan limit modal
  limitContainer:   { flex: 1, backgroundColor: "#1a3a1a", justifyContent: "center",
                       alignItems: "center", padding: 32 },
  limitIcon:        { marginBottom: 16 },
  limitTitle:       { fontSize: 24, fontWeight: "900", color: "#fff",
                       textAlign: "center", marginBottom: 12 },
  limitSub:         { fontSize: 15, color: "rgba(255,255,255,0.7)", textAlign: "center",
                       lineHeight: 24, marginBottom: 32 },
  limitCta:         { backgroundColor: "#42D674", borderRadius: 25, paddingVertical: 16,
                       paddingHorizontal: 40, marginBottom: 16 },
  limitCtaText:     { fontSize: 16, fontWeight: "800", color: "#1a3a1a" },
  limitSkip:        { paddingVertical: 12 },
  limitSkipText:    { fontSize: 14, color: "rgba(255,255,255,0.45)",
                       textDecorationLine: "underline" },
  // Scan counter
  scanCounter:      { position: "absolute", bottom: 100, alignSelf: "center",
                       flexDirection: "row", alignItems: "center", gap: 6,
                       backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20,
                       paddingHorizontal: 16, paddingVertical: 8 },
  scanCounterText:  { color: "#fff", fontSize: 13, fontWeight: "600" },
  // Partial lock banner
  lockBanner:       { flexDirection: "row", alignItems: "center", backgroundColor: "#1a3a1a",
                       borderRadius: 12, padding: 14, marginBottom: 12, gap: 12 },
  lockBannerText:   { flex: 1 },
  lockBannerTitle:  { fontSize: 14, fontWeight: "700", color: "#fff" },
  lockBannerSub:    { fontSize: 12, color: "#42D674", marginTop: 2 },
});
