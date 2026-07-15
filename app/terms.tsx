import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function TermsAndConditions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.company}>Ecosystem & AnalytiX International Ltd.</Text>
        <Text style={styles.lastUpdated}>Last updated: May 8, 2026</Text>

        <Text style={styles.intro}>
          Please read these Terms and Conditions carefully before using the Food AI mobile application
          operated by Ecosystem & AnalytiX International Ltd. By accessing or using the app, you agree to be bound by these terms.
        </Text>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or using Food AI, you confirm that you are at least 18 years of age, have read and understood these Terms, and agree to be legally bound by them.
        </Section>

        <Section title="2. Description of Service">
          Food AI provides barcode-based food scanning, AI-generated nutritional analysis, personalised dietary recommendations, meal planning tools, shopping list management, and purchase history tracking. All information is for general wellness purposes only and does not constitute medical advice.
        </Section>

        <Section title="3. Medical Disclaimer">
          THE INFORMATION PROVIDED BY FOOD AI IS FOR GENERAL INFORMATIONAL AND WELLNESS PURPOSES ONLY. IT IS NOT INTENDED AS MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT. Always seek the advice of a qualified healthcare provider before making changes to your diet.
        </Section>

        <Section title="4. User Accounts">
          You are responsible for maintaining the confidentiality of your login credentials and all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these Terms.
        </Section>

        <Section title="5. Allergen and Ingredient Information">
          Allergen detection is NOT guaranteed to be complete or accurate. Always read physical product labels before consumption if you have a known food allergy. We are not liable for any allergic reaction arising from reliance on information provided by the app.
        </Section>

        <Section title="6. Intellectual Property">
          All content and features of Food AI are the exclusive property of Ecosystem & AnalytiX International Ltd. and are protected by Canadian and international intellectual property laws.
        </Section>

        <Section title="7. Prohibited Uses">
          You agree not to use the app for any unlawful purpose, attempt unauthorised access, reverse engineer the app, use automated tools to scrape data, or transmit harmful content.
        </Section>

        <Section title="8. Limitation of Liability">
          TO THE FULLEST EXTENT PERMITTED BY LAW, ECOSYSTEM & ANALYTIX INTERNATIONAL LTD. SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE APP.
        </Section>

        <Section title="9. Governing Law">
          These Terms are governed by the laws of the Province of Ontario, Canada. Users in the United States acknowledge that applicable US federal and state laws may also apply.
        </Section>

        <Section title="10. Contact Us">
          Ecosystem & AnalytiX International Ltd. Email: legal@ecosystemanalytix.com Website: www.ecosystemanalytix.com
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
