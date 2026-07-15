import { View } from "react-native";
import { useState } from "react";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={{ padding: 20 }}>
      <InputField label="Email" value={email} onChangeText={setEmail} />
      <InputField label="Password" value={password} onChangeText={setPassword} />

      <PrimaryButton
        title="Create Account"
        onPress={() => navigation.navigate("Verify")}
      />
    </View>
  );
}