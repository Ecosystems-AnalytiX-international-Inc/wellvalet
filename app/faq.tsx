import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

const faqs = [
  {
    question: "What is WellValet?",
    answer: "WellValet is a complete wellness companion that helps you make healthier choices by scanning food and beauty products, analysing their content, and providing personalised recommendations. It also includes a family shopping list feature so your whole household can shop smarter together."
  },
  {
    question: "How does the barcode scanner work?",
    answer: "Simply point your camera at any food product barcode. WellValet will instantly retrieve the product information from our database and provide you with a health score, nutritional breakdown, and personalised recommendation."
  },
  {
    question: "What does the wellness score mean?",
    answer: "The wellness score rates a product as Good, Moderate, or Care based on its nutritional or ingredient content and your personal health profile. Good means a great choice, Moderate means consume mindfully, and Care means handle with care and check the ingredients carefully."
  },
  {
    question: "How is my wellness profile used?",
    answer: "Your wellness profile (age, weight, goals, health concerns, and allergies) is used to personalise the wellness scores and recommendations for each product you scan. The more accurate your profile, the better the recommendations."
  },
  {
    question: "Is my personal data secure?",
    answer: "Yes. Your data is stored securely on encrypted AWS servers. We comply with PIPEDA (Canada) and CCPA (California) privacy regulations. We never sell your personal information to third parties."
  },
  {
    question: "Can WellValet detect my food allergies?",
    answer: "WellValet attempts to detect allergens in product ingredients based on your allergy profile. However, allergen detection may not be complete. Always read physical product labels if you have a known food allergy."
  },
  {
    question: "What is the Purchase History feature?",
    answer: "When you scan a product and add it to your bag, it gets saved to your Purchase History. This helps you track your buying patterns, review past products, and make better choices over time."
  },
  {
    question: "How does the Meal Planner work?",
    answer: "The Meal Planner is populated from your Purchase History. It helps you organise and plan your meals based on products you have previously scanned and purchased."
  },
  {
    question: "Can WellValet scan beauty products?",
    answer: "Yes! WellValet can scan beauty and personal care products including skincare, shampoo, lotions, and cosmetics. It analyses the ingredients for harmful chemicals like parabens, sulfates, and formaldehyde releasers, and flags any concerns."
  },
  {
    question: "What is the OCR Ingredient Scanner?",
    answer: "If a beauty product is not found in our database, you can use the OCR scanner — simply point your camera at the ingredients label and WellValet will read the text using AI and analyse every ingredient for safety concerns."
  },
  {
    question: "What is the Family Shopping List?",
    answer: "The Family Shopping List lets up to 4 family members share a single shopping list. Each member can add items and the list shows who added what — for example Mike: Cheese, Bread and Sophie: Milk, Cornflakes. Members join via a 6-digit invite code sent by email."
  },
  {
    question: "How do I invite family members?",
    answer: "Go to Profile → Family → Create Family Group. Enter your family name and the email addresses of up to 3 members. They will each receive an email with a 6-digit invite code. They open WellValet, go to Profile → Family → Join Family, and enter the code."
  },
  {
    question: "Why does my scan show backend not reachable?",
    answer: "This usually means your session has expired. Please log out and log back in to refresh your session. If the problem persists, check your internet connection and try again."
  },
  {
    question: "What if a product is not found in the database?",
    answer: "If a food product is not found, WellValet will suggest scanning the ingredients label using the built-in OCR camera feature. Simply point your camera at the ingredients list on the packaging and WellValet will read and analyse it automatically."
  },
  {
    question: "How do I update my wellness profile?",
    answer: "Go to Profile & Account by tapping the profile icon, then tap Edit Wellness Profile. Update your details and tap Save Profile. Your recommendations will be updated immediately."
  },
];

export default function FAQScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>FAQ</Text>
      </View>

      <Text style={styles.subtitle}>Frequently Asked Questions</Text>

      {faqs.map((faq, index) => (
        <TouchableOpacity
          key={index}
          style={styles.faqCard}
          onPress={() => toggle(index)}
          activeOpacity={0.8}
        >
          <View style={styles.questionRow}>
            <Text style={styles.question}>{faq.question}</Text>
            <Text style={styles.arrow}>{openIndex === index ? "▲" : "▼"}</Text>
          </View>
          {openIndex === index && (
            <Text style={styles.answer}>{faq.answer}</Text>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Still have questions? </Text>
        <TouchableOpacity onPress={() => router.push("/contact")}>
          <Text style={styles.contactLink}>Contact Us</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backText: { fontSize: 16, color: "#2D6A2D", fontWeight: "600", marginRight: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#444", marginBottom: 20 },
  faqCard: { backgroundColor: "#D6EAA0", borderRadius: 12, padding: 16, marginBottom: 10 },
  questionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  question: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", flex: 1, paddingRight: 8 },
  arrow: { fontSize: 12, color: "#2D6A2D" },
  answer: { fontSize: 13, color: "#444", lineHeight: 22, marginTop: 12 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  footerText: { fontSize: 14, color: "#444" },
  contactLink: { fontSize: 14, color: "#2D6A2D", fontWeight: "bold", textDecorationLine: "underline" },
});
