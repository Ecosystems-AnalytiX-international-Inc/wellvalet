import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { isPremium } from "../../components/premiumService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ANNOUNCEMENT_KEY = "WELLVALET_ANNOUNCEMENT";

const wellness_quotes = [
  "Small choices made consistently create better eating habits over time.",
  "Your body is a reflection of your lifestyle.",
  "Eating well is a form of self-respect.",
  "Let food be thy medicine and medicine be thy food.",
  "A healthy outside starts from the inside.",
  "Take care of your body — it is the only place you have to live.",
  "Nourish to flourish.",
  "Every meal is a chance to nourish your body.",
  "Healthy eating is not a diet, it is a lifestyle.",
  "You are what you eat, so eat well.",
  "Good nutrition is the foundation of good health.",
  "Food is fuel, not therapy.",
  "Eat to live, not live to eat.",
  "Your diet is a bank account — good food choices are good investments.",
  "Wellness is the natural state of my body.",
  "The groundwork of all happiness is good health.",
  "He who has health has hope, and he who has hope has everything.",
  "Investing in your health today prevents paying for illness tomorrow.",
  "Nutrition is not a punishment, it is a gift you give yourself.",
  "Start where you are, use what you have, do what you can.",
  "Progress, not perfection, is the goal.",
  "Healthy habits are learned in the same way as unhealthy ones — through practice.",
  "Make food choices that honour your health and taste buds.",
  "Eat colourfully — the more colours on your plate, the more nutrients you get.",
  "Your future self will thank you for the choices you make today.",
  "Mindful eating begins with a single bite.",
  "Listen to your body — it knows what it needs.",
  "Real food does not have ingredients — real food is ingredients.",
  "The best project you will ever work on is yourself.",
  "Wellness is not a destination, it is a journey.",
  "Feed your body with foods that heal, not harm.",
  "Cooking at home is one of the greatest acts of self-care.",
  "Fresh food is not expensive — medical bills are.",
  "Hydration is the simplest form of self-care.",
  "Sleep, move, eat well — repeat.",
  "Your immune system is your best doctor — feed it well.",
  "Eat with intention, not out of habit.",
  "One healthy meal at a time, one day at a time.",
  "Choosing health is choosing life.",
  "You cannot pour from an empty cup — nourish yourself first.",
  "Health is not about the weight you lose but the life you gain.",
  "Food should make you feel energised, not guilty.",
  "Whole foods, whole life.",
  "A healthy gut is a happy mind.",
  "Your plate is your medicine cabinet.",
  "Every healthy choice is a vote for the person you want to become.",
  "Small steps lead to big changes — start with one meal.",
  "Your health is an investment, not an expense.",
  "Eat like you love yourself.",
  "Wellness starts on your plate.",
];

const did_you_know = [
  "Reading food labels can help you make healthier choices at the grocery store.",
  "The average person makes over 200 food decisions per day.",
  "Eating slowly can help you feel fuller with less food.",
  "Processed foods often contain hidden sugars and sodium.",
  "Colorful fruits and vegetables provide a wide range of nutrients.",
  "Water makes up about 60 percent of the human body.",
  "Fibre helps keep your digestive system healthy and reduces cholesterol.",
  "Dark chocolate contains antioxidants that can benefit heart health.",
  "Blueberries are one of the highest antioxidant-rich foods available.",
  "Avocados are rich in healthy monounsaturated fats.",
  "Eggs are one of the most complete protein sources available.",
  "Salmon is one of the best sources of omega-3 fatty acids.",
  "Garlic has been used as medicine for thousands of years.",
  "Turmeric contains curcumin, a powerful anti-inflammatory compound.",
  "Green tea is loaded with antioxidants and nutrients.",
  "Broccoli is one of the most nutrient-dense vegetables on the planet.",
  "Sweet potatoes are rich in beta-carotene, which converts to vitamin A.",
  "Almonds are among the world best sources of vitamin E.",
  "Olive oil is high in healthy fats and antioxidants.",
  "Lentils are an excellent source of plant-based protein and fibre.",
  "The gut contains more neurons than the spinal cord.",
  "Fermented foods like yogurt support healthy gut bacteria.",
  "Vitamin D deficiency affects over one billion people worldwide.",
  "Iron deficiency is the most common nutritional deficiency globally.",
  "Potassium helps regulate blood pressure and heart function.",
  "Magnesium is involved in over 300 biochemical reactions in the body.",
  "Zinc supports immune function and wound healing.",
  "Calcium is essential for bone health, muscle function, and nerve signalling.",
  "B vitamins are essential for energy production in the body.",
  "Vitamin C helps the body absorb iron from plant-based foods.",
  "The brain is made up of about 60 percent fat.",
  "Omega-3 fatty acids are essential for brain health.",
  "Dehydration can impair concentration and mood.",
  "Skipping breakfast can lead to overeating later in the day.",
  "Meal prepping can save time and support healthier eating habits.",
  "Eating a variety of foods ensures a range of nutrients.",
  "The Mediterranean diet is linked to lower rates of heart disease.",
  "Sugar has over 60 different names on food labels.",
  "Trans fats have been banned in many countries due to health risks.",
  "Sodium intake should not exceed 2300mg per day for most adults.",
  "A diet high in fibre is linked to lower risk of colorectal cancer.",
  "Cooking methods affect the nutritional value of food.",
  "Microwaving vegetables preserves more nutrients than boiling.",
  "Food allergies affect approximately 8 percent of children.",
  "The colour of food often indicates its nutritional content.",
  "Red foods like tomatoes contain lycopene, a powerful antioxidant.",
  "Green foods are typically high in folate, fibre, and vitamins.",
  "Purple foods like grapes contain resveratrol, which supports heart health.",
  "Orange foods like carrots are high in beta-carotene.",
  "Staying hydrated can improve skin health, energy, and focus.",
];

export default function HomeTab() {
  const router = useRouter();

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [announcement, setAnnouncement] = useState<{text:string, image_url:string, title:string} | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const [premium, setHomePremium] = useState(false);

  const dismissNudge = async () => {
    await AsyncStorage.setItem("LAST_NUDGE_SHOWN", Date.now().toString());
    setShowNudge(false);
  };

  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setQuoteIndex(dayOfYear % wellness_quotes.length);
    setFactIndex(dayOfYear % did_you_know.length);

    // Load announcement from backend
    const loadAnnouncement = async () => {
      try {
        const res = await fetch("https://api.wellvalet.com/announcement");
        const data = await res.json();
        if (data.text || data.image_url) setAnnouncement(data);
      } catch {}
    };
    loadAnnouncement();

    // Check nudge — show once per week to free users
    const checkNudge = async () => {
      try {
        const isPrem = await isPremium();
        setHomePremium(isPrem);
        if (!isPrem) {
          const last = await AsyncStorage.getItem("LAST_NUDGE_SHOWN");
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (!last || Date.now() - parseInt(last) > sevenDays) {
            setShowNudge(true);
          }
        }
      } catch {}
    };
    checkNudge();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoWell}>Well</Text>
          <Text style={styles.logoValet}>Valet</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Ionicons name="person-circle-outline" size={30} color="#2D6A2D" />
        </TouchableOpacity>
      </View>

      {/* Welcome tagline */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeLine1}>
          <Text style={styles.welcomeWell}>Well</Text>
          <Text style={styles.welcomeValet}>Valet</Text>
          <Text style={styles.welcomeRest}>, your wellness partner</Text>
        </Text>
        <Text style={styles.welcomeSub}>
          Scan · Analyse · Improve · Thrive
        </Text>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <MaterialCommunityIcons name="food-apple-outline" size={12} color="#fff" />
            <Text style={styles.pillText}>Food</Text>
          </View>
          <View style={styles.pill}>
            <MaterialCommunityIcons name="lipstick" size={12} color="#fff" />
            <Text style={styles.pillText}>Beauty</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="people-outline" size={12} color="#fff" />
            <Text style={styles.pillText}>Family</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="star-outline" size={12} color="#fff" />
            <Text style={styles.pillText}>Wellness</Text>
          </View>
        </View>
      </View>

      {/* AI Valet Button */}
      <TouchableOpacity
        style={styles.aiValetBtn}
        onPress={() => router.push("/ai-valet")}
      >
        <View style={styles.aiValetLeft}>
          <MaterialCommunityIcons name="robot-outline" size={32} color="#fff" />
          <View>
            <Text style={styles.aiValetTitle}>AI Valet</Text>
            <Text style={styles.aiValetSub}>Ask me anything about wellness</Text>
          </View>
        </View>
        <Text style={styles.aiValetArrow}>→</Text>
      </TouchableOpacity>

      {/* Wellness Quote */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="chatbubble-outline" size={18} color="#2D6A2D" />
          <Text style={styles.cardTitle}>Wellness Quote of the Day</Text>
        </View>
        <Text style={styles.cardText}>"{wellness_quotes[quoteIndex]}"</Text>
      </View>

      {/* Did you know */}
      <View style={[styles.card, styles.factCard]}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="bulb-outline" size={18} color="#2D6A2D" />
          <Text style={styles.cardTitle}>Did You Know?</Text>
        </View>
        <Text style={styles.cardText}>{did_you_know[factIndex]}</Text>
      </View>

      {/* Weekly soft nudge for free users */}
      {showNudge && !premium && (
        <View style={styles.nudgeCard}>
          <TouchableOpacity style={styles.nudgeDismiss} onPress={dismissNudge}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <Ionicons name="star" size={32} color="#FFD54F" style={styles.nudgeIcon} />
          <Text style={styles.nudgeTitle}>See what Premium would catch</Text>
          <Text style={styles.nudgeSub}>
            Unlock allergen alerts for your profile, full ingredient breakdown and unlimited scanning.
          </Text>
          <TouchableOpacity
            style={styles.nudgeCta}
            onPress={() => { dismissNudge(); router.push("/upgrade"); }}
          >
            <Text style={styles.nudgeCtaText}>Start 7-Day Free Trial</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Admin Announcement Banner */}
      {announcement ? (
        <View style={styles.announcementCard}>
          <View style={styles.announcementHeader}>
            <Ionicons name="megaphone-outline" size={22} color="#2D6A2D" />
            <Text style={styles.announcementTitle}>{announcement.title || "WellValet News"}</Text>
            <View style={styles.announcementBadge}>
              <Text style={styles.announcementBadgeText}>NEW</Text>
            </View>
          </View>
          {announcement.image_url ? (
            <Image
              source={{ uri: announcement.image_url }}
              style={styles.announcementImage}
              resizeMode="cover"
            />
          ) : null}
          {announcement.text ? (
            <Text style={styles.announcementText}>{announcement.text}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Quick Guide */}
      <View style={[styles.card, styles.guideCard]}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="compass-outline" size={18} color="#2D6A2D" />
          <Text style={styles.cardTitle}>Quick Guide</Text>
        </View>
        <Text style={styles.cardText}>
          Use the bottom navigation bar to manage your shopping list, scan food and beauty products, get inspired with the meal planner and glance at your past bagged items. You may also refer to our FAQ for any other questions.
        </Text>
        <Text style={styles.enjoyText}>Enjoy your Wellness journey with WellValet!</Text>
        <TouchableOpacity onPress={() => router.push("/faq")} style={styles.faqLink}>
          <View style={styles.faqLinkRow}>
            <Ionicons name="book-outline" size={13} color="#2D6A2D" />
            <Text style={styles.faqLinkText}>Visit our FAQ</Text>
          </View>
        </TouchableOpacity>
      </View>



    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", paddingHorizontal: 20, paddingTop: 55, paddingBottom: 40 },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoWell: { fontSize: 22, fontWeight: "900", color: "#2D6A2D", fontFamily: "Georgia" },
  logoValet: { fontSize: 22, fontWeight: "900", color: "#42D674", fontFamily: "Georgia" },

  // Welcome card
  welcomeCard: { backgroundColor: "#2D6A2D", borderRadius: 20, padding: 22, marginBottom: 16, shadowColor: "#2D6A2D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  welcomeLine1: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  welcomeWell: { color: "#fff", fontFamily: "Georgia" },
  welcomeValet: { color: "#42D674", fontFamily: "Georgia" },
  welcomeRest: { color: "#D6EAA0", fontSize: 18, fontWeight: "500", fontFamily: "Georgia" },
  welcomeSub: { fontSize: 14, color: "#A8D5A2", marginBottom: 14, letterSpacing: 0.5 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  pillText: { fontSize: 12, color: "#fff", fontWeight: "600" },

  // Cards
  card: { backgroundColor: "#D6EAA0", borderRadius: 16, padding: 18, marginBottom: 14 },
  factCard: { backgroundColor: "#fff" },
  guideCard: { backgroundColor: "#E8F5E9", borderLeftWidth: 4, borderLeftColor: "#42D674" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#2D6A2D" },
  cardText: { fontSize: 14, color: "#333", lineHeight: 23 },
  enjoyText: { fontSize: 14, color: "#2D6A2D", fontWeight: "700" },
  faqLink: { marginTop: 10, alignSelf: "flex-start" },
  faqLinkRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  faqLinkText: { fontSize: 13, color: "#2D6A2D", fontWeight: "600", textDecorationLine: "underline" },

  // AI Valet button
  aiValetBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#2D6A2D", borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: "#2D6A2D", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10 },
  aiValetLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  aiValetTitle: { fontSize: 17, fontWeight: "900", color: "#fff" },
  aiValetSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  aiValetArrow: { fontSize: 22, color: "#42D674", fontWeight: "700" },
  // Announcement
  announcementCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 2, borderColor: "#42D674", shadowColor: "#2D6A2D", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8 },
  announcementHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  announcementTitle: { fontSize: 16, fontWeight: "800", color: "#2D6A2D", flex: 1 },
  announcementBadge: { backgroundColor: "#42D674", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  announcementBadgeText: { fontSize: 11, color: "#fff", fontWeight: "800" },
  announcementImage: { width: "100%", height: 180, borderRadius: 12, marginBottom: 12 },
  announcementText: { fontSize: 14, color: "#333", lineHeight: 22 },



  nudgeCard:        { backgroundColor: "#1a3a1a", borderRadius: 16, padding: 20,
                       marginHorizontal: 16, marginBottom: 16, alignItems: "center",
                       position: "relative" },
  nudgeDismiss:     { position: "absolute", top: 12, right: 12, padding: 6 },
  nudgeIcon:        { marginBottom: 8, marginTop: 8 },
  nudgeTitle:       { fontSize: 16, fontWeight: "800", color: "#fff",
                       textAlign: "center", marginBottom: 6 },
  nudgeSub:         { fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center",
                       lineHeight: 20, marginBottom: 14 },
  nudgeCta:         { backgroundColor: "#42D674", borderRadius: 20,
                       paddingVertical: 12, paddingHorizontal: 28 },
  nudgeCtaText:     { fontSize: 14, fontWeight: "800", color: "#1a3a1a" },
});
