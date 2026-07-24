import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function BeautyResultScreen({ result, onScanAgain, onScanIngredients }: any) {

  const getLabelColor = (label: string) => {
    if (label === "Good") return "#2D6A2D";
    if (label === "Moderate") return "#f59e0b";
    return "#dc2626";
  };

  const getScoreRing = (score: number) => {
    if (score >= 70) return "#42D674";
    if (score >= 40) return "#f59e0b";
    return "#dc2626";
  };

  const isOCR = result.source === "ocr";

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.beautyTag}>
          <MaterialCommunityIcons name="lipstick" size={12} color="#6A1B9A" />
          <Text style={styles.beautyTagText}>Beauty & Personal Care</Text>
        </View>
        {isOCR ? (
          <Text style={styles.productName}>Ingredient Analysis</Text>
        ) : (
          <>
            <Text style={styles.productName}>{result.name}</Text>
            <Text style={styles.brandName}>{result.brand}</Text>
          </>
        )}
        {result.categories ? (
          <Text style={styles.category}>{result.categories.split(",")[0]}</Text>
        ) : null}
      </View>

      {/* Score Card */}
      <View style={[styles.scoreCard, { borderColor: getScoreRing(result.score) }]}>
        <View style={styles.scoreLeft}>
          <View style={[styles.scoreCircle, { borderColor: getScoreRing(result.score) }]}>
            <Text style={[styles.scoreNumber, { color: getScoreRing(result.score) }]}>{result.score}</Text>
            {result.letter ? (
              <Text style={[styles.scoreLetter, { color: getScoreRing(result.score) }]}>{result.letter}</Text>
            ) : null}
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <Text style={styles.scoreLabel}>Skin Wellness Score</Text>
          <View style={styles.personalisedRow}>
            <Ionicons name="star" size={10} color="#2D6A2D" />
            <Text style={styles.personalisedLabel}>Personalised</Text>
          </View>
        </View>
        <View style={styles.scoreRight}>
          <View style={[styles.labelBadge, { backgroundColor: getLabelColor(result.label) }]}>
            <Text style={styles.labelText}>{result.label}</Text>
          </View>
          <Text style={styles.scoreHint}>
            {result.score >= 70 ? "Clean profile — safe for most skin types" :
             result.score >= 40 ? "Some ingredients to watch" :
             "Contains concerning ingredients"}
          </Text>
        </View>
      </View>

      {/* Certifications */}
      {result.certifications && result.certifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trophy-outline" size={14} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Certifications</Text>
          </View>
          <View style={styles.tagRow}>
            {result.certifications.map((cert: string, i: number) => (
              <View key={i} style={styles.certBadge}>
                <Ionicons name="checkmark" size={12} color="#6A1B9A" />
                <Text style={styles.certText}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Flagged Ingredients */}
      {result.flagged_ingredients && result.flagged_ingredients.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="warning-outline" size={14} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Ingredients of Concern ({result.flagged_ingredients.length})</Text>
          </View>
          {result.flagged_ingredients.map((item: any, i: number) => (
            <View key={i} style={[styles.flaggedRow, {
              backgroundColor: item.level === "avoid" ? "#FFF0F0" : "#FFFBEB",
              borderLeftColor: item.level === "avoid" ? "#dc2626" : "#f59e0b"
            }]}>
              <View style={styles.flaggedLeft}>
                <Ionicons
                  name="ellipse"
                  size={14}
                  color={item.level === "avoid" ? "#dc2626" : "#f59e0b"}
                />
              </View>
              <View style={styles.flaggedRight}>
                <Text style={styles.flaggedName}>{item.ingredient.charAt(0).toUpperCase() + item.ingredient.slice(1)}</Text>
                <Text style={styles.flaggedReason}>{item.reason}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="checkmark-circle" size={14} color="#2D6A2D" />
            <Text style={styles.sectionTitle}>No Concerning Ingredients Found</Text>
          </View>
          <Text style={styles.cleanMessage}>This product has a clean ingredient profile!</Text>
        </View>
      )}

      {/* Clean Ingredients */}
      {result.clean_ingredients && result.clean_ingredients.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="leaf-outline" size={14} color="#2D6A2D" />
            <Text style={styles.sectionTitle}>Beneficial Ingredients Found</Text>
          </View>
          <View style={styles.tagRow}>
            {result.clean_ingredients.map((ing: string, i: number) => (
              <View key={i} style={styles.cleanBadge}>
                <Text style={styles.cleanText}>{ing}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recommendation */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="bulb-outline" size={14} color="#1a1a1a" />
          <Text style={styles.sectionTitle}>Wellness Insight</Text>
        </View>
        <View style={styles.recommendBox}>
          <Text style={styles.recommendText}>{result.recommendation}</Text>
        </View>
      </View>

      {/* Ingredients List */}
      {result.ingredients && result.ingredients.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="clipboard-outline" size={14} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Full Ingredient List ({result.ingredients.length})</Text>
          </View>
          <Text style={styles.ingredientsList}>
            {result.ingredients.slice(0, 20).join(" · ")}
            {result.ingredients.length > 20 ? ` · +${result.ingredients.length - 20} more` : ""}
          </Text>
        </View>
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>{result.disclaimer}</Text>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.scanAgainButton} onPress={onScanAgain}>
        <View style={styles.actionButtonRow}>
          <Ionicons name="camera-outline" size={16} color="#fff" />
          <Text style={styles.scanAgainText}>Scan Another Product</Text>
        </View>
      </TouchableOpacity>

      {onScanIngredients && (
        <TouchableOpacity style={styles.ocrButton} onPress={onScanIngredients}>
          <View style={styles.actionButtonRow}>
            <Ionicons name="search-outline" size={15} color="#7B1FA2" />
            <Text style={styles.ocrButtonText}>Scan Ingredients Label Instead</Text>
          </View>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#F3E5F5", padding: 16, paddingBottom: 40 },
  header: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, alignItems: "center", borderTopWidth: 4, borderTopColor: "#7B1FA2" },
  beautyTag: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EDE7F6", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 10 },
  beautyTagText: { fontSize: 12, fontWeight: "700", color: "#6A1B9A" },
  productName: { fontSize: 20, fontWeight: "800", color: "#1a1a1a", textAlign: "center", marginBottom: 4 },
  brandName: { fontSize: 15, color: "#555", textAlign: "center", fontWeight: "600" },
  category: { fontSize: 12, color: "#888", textAlign: "center", marginTop: 4 },
  scoreCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: "row", alignItems: "center", borderWidth: 2 },
  scoreLeft: { alignItems: "center", marginRight: 20 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  scoreNumber: { fontSize: 28, fontWeight: "900" },
  scoreLetter: { fontSize: 16, fontWeight: "900", marginTop: -4 },
  personalisedRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  personalisedLabel: { fontSize: 10, color: "#2D6A2D", fontWeight: "600" },
  scoreMax: { fontSize: 11, color: "#888", marginTop: -4 },
  scoreLabel: { fontSize: 11, color: "#555", textAlign: "center" },
  scoreRight: { flex: 1 },
  labelBadge: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16, alignSelf: "flex-start", marginBottom: 8 },
  labelText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  scoreHint: { fontSize: 13, color: "#555", lineHeight: 20 },
  section: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  certBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EDE7F6", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  certText: { fontSize: 12, fontWeight: "600", color: "#6A1B9A" },
  cleanBadge: { backgroundColor: "#E8F5E9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  cleanText: { fontSize: 12, fontWeight: "500", color: "#2D6A2D" },
  flaggedRow: { flexDirection: "row", alignItems: "center", borderLeftWidth: 3, borderRadius: 8, padding: 10, marginBottom: 8 },
  flaggedLeft: { marginRight: 10 },
  flaggedRight: { flex: 1 },
  flaggedName: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", textTransform: "capitalize" },
  flaggedReason: { fontSize: 12, color: "#666", marginTop: 2 },
  cleanMessage: { fontSize: 14, color: "#2D6A2D", fontWeight: "500" },
  recommendBox: { backgroundColor: "#EDE7F6", borderRadius: 10, padding: 12 },
  recommendText: { fontSize: 14, color: "#4A148C", lineHeight: 22 },
  ingredientsList: { fontSize: 12, color: "#555", lineHeight: 20 },
  disclaimer: { fontSize: 11, color: "#888", textAlign: "center", marginVertical: 12, lineHeight: 18 },
  scanAgainButton: { backgroundColor: "#7B1FA2", borderRadius: 25, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  scanAgainText: { fontSize: 16, color: "#fff", fontWeight: "700" },
  ocrButton: { backgroundColor: "#fff", borderRadius: 25, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#7B1FA2" },
  ocrButtonText: { fontSize: 15, color: "#7B1FA2", fontWeight: "600" },
  actionButtonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
