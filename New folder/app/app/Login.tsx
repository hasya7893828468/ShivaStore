import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.144.2:5001/api/auth/login";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await axios.post(API_URL, { email, password });
      console.log("🔍 Response Data:", response.data);

      if (response.data.success && response.data.token) {
        await AsyncStorage.multiRemove(["userToken", "userId", "userData"]);

        const user = {
          id: response.data.user.id,
          name: response.data.user.name,
          phone: response.data.user.phone,
          address: response.data.user.address,
        };

        await AsyncStorage.setItem("userToken", response.data.token);
        await AsyncStorage.setItem("userId", response.data.user.id);
        await AsyncStorage.setItem("userData", JSON.stringify(user));

        Alert.alert("✅ Success", "Login successful!");
        router.replace("/Main");
      } else {
        Alert.alert("❌ Error", response.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("❌ Login Error:", error.response ? error.response.data : error);
      Alert.alert("⚠️ Error", "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.vendorButton}
        onPress={() => router.push("/Vendor/VendorLogin")}
      >
        <Text style={styles.buttonText}>Vendor Login</Text>
      </TouchableOpacity>

      <Text style={styles.text}>
        Don't have an account?{' '}
        <Text style={styles.link} onPress={() => router.push("/SignUp")}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f4f4f4", // Light gray background for IBM style
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#161616", // Dark text for contrast
  },
  subtitle: {
    fontSize: 16,
    color: "#525252",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Subtle shadow effect
  },
  loginButton: {
    backgroundColor: "#0f62fe", // IBM blue
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  vendorButton: {
    backgroundColor: "#393939", // IBM Gray for vendor login
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    color: "#161616",
  },
  link: {
    color: "#0f62fe",
    fontWeight: "bold",
  },
});
