import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Animated
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { fetchWithAuth } from "./authService";

const API_BASE_URL = "https://api.wellvalet.com";

const STEPS = [
  { key: "capture",   label: "📷  Capturing image...",        pct: 25 },
  { key: "reading",   label: "🔍  Reading ingredients...",    pct: 50 },
  { key: "analysing", label: "🧪  Analysing ingredients...",  pct: 75 },
  { key: "scoring",   label: "⭐  Calculating safety score...",pct: 90 },
];

export default function OCRScanScreen({ onResult, onCancel }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [focusPoint, setFocusPoint] = useState<{x:number,y:number}|null>(null);
  const [showFocus, setShowFocus] = useState(false);
  const cameraRef = useRef<any>(null);
  const focusAnim = useRef(new Animated.Value(1)).current;

  // Tap to focus handler
  const handleTapFocus = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    setFocusPoint({ x: locationX, y: locationY });
    setShowFocus(true);
    focusAnim.setValue(1.4);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => setShowFocus(false), 800);
    });
  };

  const stepForward = (index: number) => {
    setStepIndex(index);
  };

  const captureAndAnalyse = async () => {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      stepForward(0); // Capturing

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      stepForward(1); // Reading

      await new Promise(r => setTimeout(r, 300)); // brief pause for UX

      stepForward(2); // Analysing

      const response = await fetchWithAuth(`${API_BASE_URL}/scan/ingredients-ocr`, {
        method: "POST",
        body: JSON.stringify({ image_base64: photo.base64 }),
      });

      stepForward(3); // Scoring

      const data = await response.json();

      await new Promise(r => setTimeout(r, 400)); // show scoring step briefly

      if (data.error) {
        Alert.alert(
          "Could not read label",
          data.error + "\n\nTips:\n• Hold camera closer\n• Ensure label is well lit\n• Keep phone steady\n• Fill the frame with the ingredients list"
        );
        setLoading(false);
        setStepIndex(0);
        return;
      }

      onResult(data);

    } catch (err) {
      Alert.alert("Error", "Could not process image. Please try again.");
      setLoading(false);
      setStepIndex(0);
    }
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access needed to scan ingredients</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">

        {/* Tap to focus overlay */}
        <TouchableOpacity
          style={styles.focusOverlay}
          onPress={handleTapFocus}
          activeOpacity={1}
        >
          {showFocus && focusPoint && (
            <Animated.View
              style={[
                styles.focusRing,
                {
                  left: focusPoint.x - 32,
                  top: focusPoint.y - 32,
                  transform: [{ scale: focusAnim }],
                }
              ]}
            />
          )}
        </TouchableOpacity>

        {/* Top overlay */}
        <View style={styles.topOverlay}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scan Ingredients Label</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinderContainer} pointerEvents="none">
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.tapHint}>👆 Tap anywhere to focus</Text>
        </View>

        {/* Bottom overlay */}
        <View style={styles.bottomOverlay}>
          {loading ? (
            <View style={styles.progressContainer}>
              {/* Step label */}
              <Text style={styles.stepLabel}>{STEPS[stepIndex]?.label}</Text>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${STEPS[stepIndex]?.pct}%` }]} />
              </View>

              {/* Step dots */}
              <View style={styles.stepDots}>
                {STEPS.map((s, i) => (
                  <View
                    key={s.key}
                    style={[
                      styles.stepDot,
                      i <= stepIndex && styles.stepDotActive
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.stepSubLabel}>
                Please keep your camera steady...
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.hint}>
                Point camera at the ingredients list and tap the button below
              </Text>
              <TouchableOpacity style={styles.captureButton} onPress={captureAndAnalyse}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              <Text style={styles.tipText}>
                💡 Tap the screen to focus · Ensure label fills the frame · Good lighting helps
              </Text>
            </>
          )}
        </View>

      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  focusOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1
  },
  focusRing: {
    position: "absolute",
    width: 64, height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#7B1FA2",
    backgroundColor: "transparent",
  },
  permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F3E5F5", padding: 30 },
  permissionText: { fontSize: 16, color: "#333", textAlign: "center", marginBottom: 20 },
  permissionButton: { backgroundColor: "#7B1FA2", borderRadius: 25, paddingVertical: 12, paddingHorizontal: 30, marginBottom: 12 },
  permissionButtonText: { fontSize: 16, color: "#fff", fontWeight: "700" },
  cancelText: { fontSize: 15, color: "#7B1FA2", fontWeight: "600" },
  topOverlay: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 60, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2 },
  cancelButton: { padding: 8 },
  cancelButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  viewfinderContainer: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 2 },
  viewfinder: { width: 300, height: 200, position: "relative" },
  corner: { position: "absolute", width: 24, height: 24, borderColor: "#7B1FA2", borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  tapHint: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 16, textAlign: "center" },
  bottomOverlay: { padding: 30, paddingBottom: 50, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", zIndex: 2 },
  hint: { color: "#fff", fontSize: 15, textAlign: "center", marginBottom: 24, fontWeight: "500" },

  // Progress
  progressContainer: { alignItems: "center", width: "100%", paddingHorizontal: 10 },
  stepLabel: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  progressBarBg: { width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, marginBottom: 16 },
  progressBarFill: { height: 6, backgroundColor: "#7B1FA2", borderRadius: 3 },
  stepDots: { flexDirection: "row", gap: 8, marginBottom: 12 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.3)" },
  stepDotActive: { backgroundColor: "#7B1FA2" },
  stepSubLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center" },

  // Capture button
  captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.3)", justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 3, borderColor: "#fff" },
  captureButtonInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#7B1FA2" },
  tipText: { color: "rgba(255,255,255,0.8)", fontSize: 12, textAlign: "center", lineHeight: 18 },
});
