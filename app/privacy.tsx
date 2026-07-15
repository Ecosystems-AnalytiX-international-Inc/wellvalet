import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.company}>Ecosystem & AnalytiX International Ltd.</Text>
        <Text style={styles.lastUpdated}>Last updated: May 8, 2026</Text>

        <Text style={styles.intro}>
          This Privacy Policy explains how Ecosystem & AnalytiX International Ltd. collects, uses,
          and protects your personal information. We comply with PIPEDA (Canada) and CCPA (California).
        </Text>

        <Section title="1. Information We Collect">
          Account: email and encrypted password. Health Profile: age, height, weight, goals, activity level, health conditions, allergies. Usage Data: scanned barcodes, scan history, meal plans, shopping lists.
        </Section>

        <Section title="2. How We Use Your Information">
          We use your information to provide personalised nutritional analysis, generate health scores, detect allergen risks, improve app features, and send account emails. We do NOT sell your personal information.
        </Section>

        <Section title="3. Health Information">
          Health data is used solely to personalise your experience, never sold or shared with advertisers, stored securely in encrypted databases, and only accessible by you.
        </Section>

        <Section title="4. Data Sharing">
          We share data only with AWS (cloud hosting) and Resend (email delivery) under strict data protection agreements, legal authorities when required by law, or in a business transfer with prior notice.
        </Section>

        <Section title="5. Data Retention">
          Data is retained while your account is active. You may request deletion at privacy@ecosystemanalytix.com. Scan history is retained for up to 24 months.
        </Section>

        <Section title="6. Your Rights (Canada - PIPEDA)">
          You have the right to access your data, request corrections, withdraw consent, and file a complaint with the Office of the Privacy Commissioner of Canada at www.priv.gc.ca.
        </Section>

        <Section title="7. Your Rights (California - CCPA)">
          California residents may know what data is collected, request deletion, opt out of data sales (we do not sell data), and not be discriminated against for exercising privacy rights.
        </Section>

        <Section title="8. Data Security">
          We use encrypted AWS RDS storage, HTTPS communication, PBKDF2/SHA-256 password hashing, and JWT authentication. No method of transmission is 100% secure.
        </Section>

        <Section title="9. Children Privacy">
          Food AI is not intended for children under 13. We do not knowingly collect data from children. Contact us to remove any such data.
        </Section>

        <Section title="10. Contact Us">
          Ecosystem & AnalytiX International Ltd. Privacy Officer. Email: privacy@ecosystemanalytix.com. Website: www.ecosystemanalytix.com
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>2026 Ecosystem & AnalytiX International Ltd. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E3F0A3" },
  header: { paddingTop: 55, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: "#E3F0A3", borderBottomWidth: 1, borderBottomColor: "#f0f0f0", flexDirection: "row", alignItems: "center" },
  backButton: { marginRight: 16 },
  backText: { fontSize: 16, color: "#4CAF50", fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1a1a1a" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  company: { fontSize: 18, fontWeight: "bold", color: "#1a1a1a", marginBottom: 4 },
  lastUpdated: { fontSize: 13, color: "#888", marginBottom: 16 },
  intro: { fontSize: 14, color: "#444", lineHeight: 22, marginBottom: 24, padding: 16, backgroundColor: "#f9f9f9", borderRadius: 10, borderLeftWidth: 4, borderLeftColor: "#4CAF50" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 8 },
  sectionText: { fontSize: 14, color: "#444", lineHeight: 22 },
  footer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  footerText: { fontSize: 12, color: "#aaa", textAlign: "center" },
});
