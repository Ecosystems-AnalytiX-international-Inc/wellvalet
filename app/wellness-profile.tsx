import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { saveUserProfile, getUserProfile } from "../components/profileService";

function getAgeGroup(age: number): string {
  if (age < 18) return "Youth (under 18)";
  if (age < 35) return "Young Adult (18-34)";
  if (age < 55) return "Adult (35-54)";
  return "Senior (55+)";
}
import { getAuthToken } from "../components/authService";

const API_BASE_URL = "https://api.wellvalet.com";

export default function WellnessProfileScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profile, setProfile] = useState<any>({
    age: "35",
    weight_kg: "78",
    weight_goal: "lose_weight",
    activity_level: "medium",
    known_illness: ["none"],
    allergies: ["none"],
    ageGroup: { fontSize: 12, color: "#2D6A2D", fontWeight: "600", marginBottom: 12, fontStyle: "italic" },
});

  const options = {
    weight_goal: [
      { value: "lose_weight", label: "Lose weight" },
      { value: "maintain_weight", label: "Maintain weight" },
      { value: "gain_weight", label: "Gain weight" },
      { value: "build_muscle", label: "Build muscle" },
    ],
    activity_level: [
      { value: "low", label: "Low Activity" },
      { value: "medium", label: "Medium Activity" },
      { value: "high", label: "High Activity" },
      { value: "very_high", label: "V.High Activity" },
    ],
    known_illness: [
      { value: "none", label: "No Known Ones" },
      { value: "diabetes", label: "Diabetes/Sugar" },
      { value: "hypertension", label: "High B.P.*" },
      { value: "high_cholesterol", label: "Cholesterol" },
    ],
    allergies: [
      { value: "none", label: "None" },
      { value: "peanut", label: "Peanut" },
      { value: "tree_nuts", label: "Tree Nuts" },
      { value: "milk", label: "Milk" },
      { value: "soy", label: "Soy" },
      { value: "egg", label: "Egg" },
      { value: "gluten", label: "Gluten" },
      { value: "sesame", label: "Sesame" },
      { value: "fish", label: "Fish" },
      { value: "shellfish", label: "Shellfish" },
    ],
  };

  useEffect(() => {
    const loadProfile = async () => {
      // Always load local profile first
      const localProfile = await getUserProfile();
      if (localProfile) {
        const p = { ...localProfile };
        if (!Array.isArray(p.known_illness)) {
          p.known_illness = p.known_illness ? [p.known_illness] : ["none"];
        }
        if (!Array.isArray(p.allergies)) {
          p.allergies = p.allergies ? [p.allergies] : ["none"];
        }
        setProfile(p);
      }
      setProfileLoaded(true);
    };
    loadProfile();
  }, []);

  const updateProfile = (key: string, value: any) => {
    setProfile({ ...profile, [key]: value });
  };

  const toggleMultiSelect = (field: string, value: string) => {
    if (value === "none") {
      updateProfile(field, ["none"]);
      return;
    }
    let current = Array.isArray(profile[field])
      ? profile[field].filter((x: string) => x !== "none")
      : [];
    if (current.includes(value)) {
      current = current.filter((x: string) => x !== value);
    } else {
      current = [...current, value];
    }
    if (current.length === 0) current = ["none"];
    updateProfile(field, current);
  };

  const saveProfile = async () => {
    setMessage("Saving...");
    await saveUserProfile(profile);
    const token = await getAuthToken();
    if (!token) {
      setMessage("Saved locally. Login required for cloud sync.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/me/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const json = await res.json();
      if (json.error) {
        setMessage(json.error);
        return;
      }
      setMessage("Profile saved successfully.");
      setTimeout(async () => {
        // Show trial offer only once — on first profile save after signup
        const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
        const offerShown = await AsyncStorage.getItem("TRIAL_OFFER_SHOWN");
        if (!offerShown) {
          router.replace("/trial-offer");
        } else {
          router.replace("/(tabs)");
        }
      }, 800);
    } catch {
      setMessage("Saved locally, backend not reachable.");
    }
  };


  // Single select pill row
  const SinglePillSelector = ({ title, field, items, note }: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={styles.pillRow}>
        {items.map((item: any) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.pill, profile[field] === item.value && styles.pillSelected]}
            onPress={() => updateProfile(field, item.value)}
          >
            <Text style={[styles.pillText, profile[field] === item.value && styles.pillTextSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Multi select pill row
  const MultiPillSelector = ({ title, field, items, note }: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={styles.pillRow}>
        {items.map((item: any) => {
          const selected = Array.isArray(profile[field]) && profile[field].includes(item.value);
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.pill, selected && styles.pillSelected]}
              onPress={() => toggleMultiSelect(field, item.value)}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>Your Wellness Profile</Text>

      {/* Age Height Weight Cards */}
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>Age</Text>
        <TextInput
          style={styles.metricInput}
          value={String(profile.age)}
          keyboardType="numeric"
          onChangeText={(v) => updateProfile("age", v)}
        />
      </View>

      

      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>Weight</Text>
        <TextInput
          style={styles.metricInput}
          value={String(profile.weight_kg)}
          keyboardType="numeric"
          onChangeText={(v) => updateProfile("weight_kg", v)}
        />
      </View>

      {/* Single select */}
      <SinglePillSelector title="Weight Goal" field="weight_goal" items={options.weight_goal} />
      <SinglePillSelector title="Physical Activity Level" field="activity_level" items={options.activity_level} />

      {/* Multi select */}
      <MultiPillSelector
        title="Known Concern / Illness"
        field="known_illness"
        items={options.known_illness}
        note="*B.P. Blood Pressure"
      />
      <MultiPillSelector
        title="Allergies"
        field="allergies"
        items={options.allergies}
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#E3F0A3", padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "600", color: "#1a1a1a", textAlign: "center", marginBottom: 20 },
  metricCard: { backgroundColor: "#E8E8E8", borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metricLabel: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  metricInput: { fontSize: 16, color: "#1a1a1a", textAlign: "right", minWidth: 60 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  note: { fontSize: 11, color: "#666", marginBottom: 6 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { backgroundColor: "#E3F0A3", borderWidth: 1, borderColor: "#aaa", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 4 },
  pillSelected: { backgroundColor: "#42D674", borderColor: "#42D674" },
  pillText: { fontSize: 13, color: "#1a1a1a" },
  pillTextSelected: { fontWeight: "600", color: "#1a1a1a" },
  message: { marginTop: 16, color: "#2D6A2D", fontWeight: "bold", textAlign: "center" },
  saveButton: { backgroundColor: "#2D6A2D", borderRadius: 25, paddingVertical: 16, alignItems: "center", marginTop: 30 },
  saveButtonText: { fontSize: 16, color: "white", fontWeight: "600" },
});
