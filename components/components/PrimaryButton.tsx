import { Pressable, Text, StyleSheet } from "react-native";

export default function PrimaryButton({ title, onPress }: any) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});