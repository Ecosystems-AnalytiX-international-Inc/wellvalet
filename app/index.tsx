import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle, Path, Ellipse, Line, G, Rect, Text as SvgText, TextPath } from "react-native-svg";

const { width, height } = Dimensions.get("window");

function WellnessDecor() {
  return (
    <Svg width={width} height={height} style={{ position: "absolute" }}>
      {/* Large bg circle top right */}
      <Circle cx={width + 40} cy={-40} r={180} fill="#42D674" opacity={0.15} />
      {/* Medium circle bottom left */}
      <Circle cx={-60} cy={height + 40} r={160} fill="#2D6A2D" opacity={0.12} />
      {/* Small accent circles */}
      <Circle cx={width * 0.15} cy={height * 0.2} r={8} fill="#42D674" opacity={0.4} />
      <Circle cx={width * 0.85} cy={height * 0.35} r={5} fill="#2D6A2D" opacity={0.3} />
      <Circle cx={width * 0.1} cy={height * 0.65} r={6} fill="#42D674" opacity={0.35} />
      <Circle cx={width * 0.9} cy={height * 0.7} r={4} fill="#2D6A2D" opacity={0.25} />
      {/* Leaf shape top left */}
      <Path
        d={`M${width*0.08} ${height*0.08} Q${width*0.18} ${height*0.04} ${width*0.22} ${height*0.12} Q${width*0.18} ${height*0.2} ${width*0.08} ${height*0.18} Q${width*0.04} ${height*0.14} ${width*0.08} ${height*0.08}`}
        fill="#2D6A2D" opacity={0.2}
      />
      {/* Leaf shape bottom right */}
      <Path
        d={`M${width*0.82} ${height*0.82} Q${width*0.92} ${height*0.78} ${width*0.96} ${height*0.86} Q${width*0.92} ${height*0.94} ${width*0.82} ${height*0.92} Q${width*0.78} ${height*0.88} ${width*0.82} ${height*0.82}`}
        fill="#42D674" opacity={0.2}
      />
      {/* Barcode lines accent */}
      <Line x1={width*0.72} y1={height*0.18} x2={width*0.72} y2={height*0.26} stroke="#2D6A2D" strokeWidth={3} opacity={0.2} strokeLinecap="round"/>
      <Line x1={width*0.76} y1={height*0.16} x2={width*0.76} y2={height*0.28} stroke="#2D6A2D" strokeWidth={5} opacity={0.2} strokeLinecap="round"/>
      <Line x1={width*0.80} y1={height*0.18} x2={width*0.80} y2={height*0.26} stroke="#42D674" strokeWidth={3} opacity={0.2} strokeLinecap="round"/>
      <Line x1={width*0.84} y1={height*0.17} x2={width*0.84} y2={height*0.27} stroke="#2D6A2D" strokeWidth={2} opacity={0.2} strokeLinecap="round"/>
      {/* Scan ring accent */}
      <Circle cx={width*0.2} cy={height*0.5} r={30} fill="none" stroke="#42D674" strokeWidth={1.5} opacity={0.2} strokeDasharray="4 3"/>
      <Circle cx={width*0.2} cy={height*0.5} r={18} fill="none" stroke="#2D6A2D" strokeWidth={1} opacity={0.15}/>
      {/* Dots pattern */}
      {[0,1,2,3,4].map(i => (
        <Circle key={i} cx={width*0.5 - 40 + i*20} cy={height*0.72} r={3} fill="#2D6A2D" opacity={0.15}/>
      ))}
    </Svg>
  );
}

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <WellnessDecor />

      {/* Logo area */}
      <View style={styles.logoArea}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Svg width={72} height={72} viewBox="0 0 72 72">
            <Circle cx={36} cy={36} r={34} fill="#2D6A2D"/>
            <Circle cx={36} cy={36} r={24} fill="none" stroke="#42D674" strokeWidth={1.5} strokeDasharray="4 3"/>
            <Line x1={10} y1={36} x2={24} y2={36} stroke="#42D674" strokeWidth={2}/>
            <Line x1={48} y1={36} x2={62} y2={36} stroke="#42D674" strokeWidth={2}/>
            <Line x1={36} y1={10} x2={36} y2={24} stroke="#42D674" strokeWidth={2}/>
            <Line x1={36} y1={48} x2={36} y2={62} stroke="#42D674" strokeWidth={2}/>
            <Path d="M36 27 Q43 30 44 36 Q43 42 36 45 Q29 42 28 36 Q29 30 36 27 Z" fill="#42D674"/>
            <Line x1={36} y1={45} x2={36} y2={52} stroke="#42D674" strokeWidth={2} strokeLinecap="round"/>
          </Svg>
        </View>

        {/* App name */}
        <Text style={styles.appName}>
          <Text style={styles.appNameWell}>Well</Text>
          <Text style={styles.appNameValet}>Valet</Text>
        </Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Your Valet is here to guide you</Text>

        {/* Feature pills */}
        <View style={styles.pillRow}>
          <View style={styles.pill}><Text style={styles.pillText}>🥗 Food</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>💄 Beauty</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>👨‍👩‍👧 Family</Text></View>
        </View>
      </View>

      {/* Wellness stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>3M+</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statDivider}/>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>Free to scan</Text>
        </View>
        <View style={styles.statDivider}/>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>AI</Text>
          <Text style={styles.statLabel}>Powered</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/signup")}>
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/login")}>
          <Text style={styles.secondaryButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Proudly Canadian Badge */}
        <View style={styles.canadianBadge}>
          <Image
            source={require("../assets/canadian_badge.png")}
            style={styles.canadianImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.disclaimer}>Free to use · No credit card required</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F0A3", justifyContent: "space-between", alignItems: "center", paddingVertical: 60 },
  logoArea: { alignItems: "center", paddingTop: 20 },
  iconContainer: { marginBottom: 16, shadowColor: "#2D6A2D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  appName: { fontSize: 52, fontWeight: "900", letterSpacing: -1, marginBottom: 10 },
  appNameWell: { color: "#2D6A2D", fontFamily: "Georgia" },
  appNameValet: { color: "#42D674", fontFamily: "Georgia" },
  tagline: { fontSize: 16, color: "#2D6A2D", fontWeight: "500", marginBottom: 20, letterSpacing: 0.3 },
  pillRow: { flexDirection: "row", gap: 8 },
  pill: { backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  pillText: { fontSize: 13, color: "#2D6A2D", fontWeight: "600" },
  statsRow: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 20, paddingVertical: 16, paddingHorizontal: 24, gap: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "900", color: "#2D6A2D" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#E3F0A3" },
  buttonContainer: { width: width - 48, alignItems: "center", gap: 12 },
  primaryButton: { backgroundColor: "#2D6A2D", borderRadius: 28, paddingVertical: 16, width: "100%", alignItems: "center", shadowColor: "#2D6A2D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  primaryButtonText: { fontSize: 17, color: "#fff", fontWeight: "800" },
  secondaryButton: { backgroundColor: "#fff", borderRadius: 28, paddingVertical: 16, width: "100%", alignItems: "center", borderWidth: 1.5, borderColor: "#2D6A2D" },
  secondaryButtonText: { fontSize: 17, color: "#2D6A2D", fontWeight: "700" },
  disclaimer: { fontSize: 12, color: "#4a7a4a", marginTop: 4 },

  canadianBadge:  { alignItems: "center", marginVertical: 20 },
  canadianImg:    { width: 100, height: 100 },

});
