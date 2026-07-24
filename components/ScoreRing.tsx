import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

interface ScoreRingProps {
  score: number;
  label: string;
  letter?: string;
}

export default function ScoreRing({ score, label, letter }: ScoreRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [score, animatedValue]);

  const getColor = (label: string) => {
    if (label === "Good") return "#42D674";
    if (label === "Moderate") return "#FFC107";
    return "#FF6B6B";
  };

  const getLabel = (label: string) => {
    if (label === "Avoid") return "Care";
    return label;
  };

  const getBgColor = (label: string) => {
    if (label === "Good") return "#E8F5E9";
    if (label === "Moderate") return "#FFF8E1";
    return "#FFF0F0";
  };

  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = 20;
  const segmentAngle = 360 / segments;
  const filledSegments = Math.round((score / 100) * segments);
  const color = getColor(label);
  const bgColor = getBgColor(label);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.ringContainer}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${size/2}, ${size/2}`}>
            {Array.from({ length: segments }).map((_, i) => {
              const angle = i * segmentAngle;
              const rad = (angle * Math.PI) / 180;
              const nextRad = ((angle + segmentAngle - 2) * Math.PI) / 180;
              const cx = size / 2;
              const cy = size / 2;
              const x1 = cx + radius * Math.cos(rad);
              const y1 = cy + radius * Math.sin(rad);
              const x2 = cx + radius * Math.cos(nextRad);
              const y2 = cy + radius * Math.sin(nextRad);
              const filled = i < filledSegments;
              return (
                <Circle
                  key={i}
                  cx={cx + radius * Math.cos(rad + (nextRad - rad) / 2)}
                  cy={cy + radius * Math.sin(rad + (nextRad - rad) / 2)}
                  r={strokeWidth / 2 - 1}
                  fill={filled ? color : "#e0e0e0"}
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.centerContent}>
          <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
      </View>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color }]}>{getLabel(label)}</Text>
        {letter ? (
          <View style={[styles.letterBadge, { backgroundColor: color }]}>
            <Text style={styles.letterText}>{letter}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.personalisedRow}>
        <Ionicons name="star" size={11} color="#2D6A2D" />
        <Text style={styles.personalisedLabel}>Your personalised wellness score</Text>
      </View>
      <Text style={styles.subLabel}>
        {label === "Good" ? "Great choice for your wellness!" :
         label === "Moderate" ? "Acceptable — consume mindfully." :
         "Handle with care — check ingredients."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 14, alignItems: "center", marginVertical: 12 },
  ringContainer: { width: 120, height: 120, justifyContent: "center", alignItems: "center" },
  centerContent: { position: "absolute", alignItems: "center" },
  scoreNumber: { fontSize: 32, fontWeight: "900" },
  scoreMax: { fontSize: 11, color: "#888", marginTop: -6 },
  label: { fontSize: 18, fontWeight: "800", marginTop: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  letterBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  letterText: { fontSize: 18, fontWeight: "900", color: "#fff" },
  personalisedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  personalisedLabel: { fontSize: 11, color: "#2D6A2D", fontWeight: "600" },
  subLabel: { fontSize: 12, color: "#555", textAlign: "center", marginTop: 4, lineHeight: 20 },
});
