import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Trash2, UploadCloud, PlusCircle } from "lucide-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface Drink {
  _id: string;
  name: string;
  img: string;
  price: string;
  Dprice?: string;
  Off?: string;
}

const DrinkManager: React.FC = () => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDrink, setNewDrink] = useState({
    name: "",
    img: "",
    price: "",
    Dprice: "",
    Off: "",
  });

  useEffect(() => {
    const fetchDrinks = async () => {
      try {
        const res = await axios.get("http://192.168.144.2:5000/api/drinks");
        console.log("✅ Fetched Drinks:", res.data);
        setDrinks(res.data);
      } catch (error) {
        console.error("❌ Error fetching drinks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDrinks();
  }, []);

  const handleChange = (name: string, value: string) => {
    setNewDrink((prev) => ({ ...prev, [name]: value }));

    if (name === "Dprice") {
      const originalPrice = parseFloat(newDrink.price);
      const discountedPrice = parseFloat(value);
      if (!isNaN(originalPrice) && !isNaN(discountedPrice) && originalPrice > 0 && discountedPrice > 0) {
        const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
        setNewDrink((prev) => ({ ...prev, Off: discount.toString() }));
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewDrink((prev) => ({ ...prev, img: result.assets[0].uri }));
    }
  };

  const handleAddDrink = async () => {
    if (!newDrink.name || !newDrink.img || !newDrink.price) {
      Alert.alert("⚠️ Warning", "Please fill all fields!");
      return;
    }

    const formData = new FormData();
    formData.append("name", newDrink.name);
    formData.append("price", newDrink.price);
    formData.append("Dprice", newDrink.Dprice || "");
    formData.append("Off", newDrink.Off || "");
    formData.append("img", {
      uri: newDrink.img,
      type: "image/jpeg",
      name: newDrink.img.split("/").pop(),
    });

    try {
      const res = await axios.post("http://192.168.144.2:5000/api/drinks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Drink Added:", res.data);
      setDrinks([...drinks, res.data.drink]);
      setNewDrink({ name: "", img: "", price: "", Dprice: "", Off: "" });
    } catch (error) {
      console.error("❌ Error adding drink:", error.response?.data || error.message);
      Alert.alert("❌ Error", "Failed to add drink. Check server logs.");
    }
  };

  const handleDeleteDrink = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this drink?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`http://192.168.144.2:5000/api/drinks/${id}`);
            setDrinks(drinks.filter((drink) => drink._id !== id));
          } catch (error) {
            console.error("❌ Error deleting drink:", error.response?.data || error.message);
            Alert.alert("❌ Error", "Failed to delete drink.");
          }
        },
      },
    ]);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#f8f8f8", padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>🥤 Drink Manager</Text>

        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 10, marginTop: 20 }}>
          <TextInput placeholder="Drink Name" value={newDrink.name} onChangeText={(text) => handleChange("name", text)} style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8 }} />

          <TouchableOpacity onPress={pickImage} style={{ backgroundColor: "#e0e0e0", padding: 10, borderRadius: 5, alignItems: "center", marginBottom: 10 }}>
            <UploadCloud size={24} />
            <Text>Pick Image</Text>
          </TouchableOpacity>

          <TextInput placeholder="Price" value={newDrink.price} keyboardType="numeric" onChangeText={(text) => handleChange("price", text)} style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8 }} />
          <TextInput placeholder="Discounted Price" value={newDrink.Dprice} keyboardType="numeric" onChangeText={(text) => handleChange("Dprice", text)} style={{ borderBottomWidth: 1, marginBottom: 10, padding: 8 }} />

          <TouchableOpacity onPress={handleAddDrink} style={{ backgroundColor: "#007bff", padding: 10, borderRadius: 5, alignItems: "center" }}>
            <PlusCircle size={24} color="white" />
            <Text style={{ color: "white" }}>Add Drink</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

export default DrinkManager;
