import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.144.2:5000/api/auth/login';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

 const handleLogin = async () => {
  try {
    const response = await axios.post(API_URL, { email, password });
    console.log("🔍 Response Data:", response.data);

    if (response.data.success && response.data.token) {
      // ✅ Clear previous user data before storing new login info
      await AsyncStorage.multiRemove(["userToken", "userId", "userData"]);

      // ✅ Store new user data in AsyncStorage
      const user = {
        id: response.data.user.id,
        name: response.data.user.name,
        phone: response.data.user.phone,
        address: response.data.user.address,
      };

      await AsyncStorage.setItem("userToken", response.data.token);
      await AsyncStorage.setItem("userId", response.data.user.id);
      await AsyncStorage.setItem("userData", JSON.stringify(user)); // ✅ Store as JSON

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
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      
      {/* Vendor Login Button */}
      <TouchableOpacity 
        style={[styles.button, styles.vendorButton]} 
        onPress={() => router.push('/Vendor/VendorLogin')}>
        <Text style={styles.buttonText}>Vendor Login</Text>
      </TouchableOpacity>
      
      <Text style={styles.text}>
        Don't have an account?{' '}
        <Text style={styles.link} onPress={() => router.push('/SignUp')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  vendorButton: {
    backgroundColor: '#28a745', // Green color for vendor login
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  link: {
    color: '#007bff',
    fontWeight: 'bold',
  },
});