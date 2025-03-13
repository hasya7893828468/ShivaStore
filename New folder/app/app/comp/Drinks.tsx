import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { Plus, Minus, ShoppingBag } from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context/AppContext";
import NavBar from "../context/NavBar";
import SearchBar from "../context/SearchBar";
import Toast from "react-native-toast-message"; // ✅ Import Toast
import HomeCard from "./HomeCard";

const Drinks: React.FC = () => {
  const { addToCart, searchValue } = useAppContext();
  const [productList, setProductList] = useState<any[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  const router = useRouter();
  const API_URL = "http://192.168.144.2:5000/api/drinks"; // ✅ Backend API

  // ✅ Fetch drinks data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://192.168.144.2:5000/api/drinks");
        console.log("🟢 API Response:", response.data); // ✅ Check API response
  
        const allProducts = response.data.map((p: any) => ({
          ...p,
          img: p.img.startsWith("http")
            ? p.img
            : `http://192.168.144.2:5000/${p.img.replace(/^\/+/, "")}`,
        }));
  
        console.log("🟢 Processed Product List:", allProducts); // ✅ Debug processed images
  
        setProductList(allProducts);
      } catch (error) {
        console.error("❌ Error fetching drinks:", error);
      }
    };
  
    fetchData();
  }, []);
  
  
  // ✅ Persist cart quantity changes
  useEffect(() => {
    AsyncStorage.setItem("drinksQuantities", JSON.stringify(cartQuantities));
  }, [cartQuantities]);

  // ✅ Filter products based on search
  const filteredData = useMemo(
    () =>
      productList.filter((val) =>
        val?.name?.toLowerCase().includes((searchValue ?? "").toLowerCase())
      ),
    [productList, searchValue]
  );

  // ✅ Increase quantity
  const handleIncrement = (id: string) => {
    setCartQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  // ✅ Decrease quantity
  const handleDecrement = (id: string) => {
    setCartQuantities((prev) => {
      const updatedQuantity = Math.max((prev[id] ?? 0) - 1, 0);
      return { ...prev, [id]: updatedQuantity };
    });
  };

  // ✅ Add to cart with toast notification
  const handleAddToCart = (item: any) => {
    const quantityToAdd = cartQuantities[item._id] ?? 0;

    if (quantityToAdd > 0) {
      const imageUrl = item.img.startsWith("http")
        ? item.img
        : `http://192.168.144.2:5000/${item.img?.replace(/^\/+/, "")}`;

      addToCart({
        ...item,
        img: imageUrl,
        quantity: quantityToAdd,
      });

      Toast.show({
        type: "success",
        text1: "✅ Success",
        text2: `${item.name} added to cart!`,
        visibilityTime: 2000,
        position: "bottom",
      });
    }
  };

  // ✅ Calculate discount percentage
  const calculateDiscount = (originalPrice: number, discountedPrice: number) => {
    if (originalPrice <= 0 || discountedPrice <= 0 || discountedPrice < originalPrice) return 0;
    return Math.abs(Math.round(((originalPrice - discountedPrice) / originalPrice) * 100));
  };

  return (
    <View style={styles.container}>
      <NavBar />
      <SearchBar />
      <HomeCard/>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* ✅ Navigate to details page */}
            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.setItem("selectedDrink", JSON.stringify(item));
                router.push("/comp/DrinkDetails");
              }}
            >
<Image
  source={{
    uri: item.img && item.img.startsWith("http")
      ? item.img
      : `http://192.168.144.2:5000/${item.img.replace(/^\/+/, "")}`,
  }}
  style={styles.image}
  resizeMode="cover"
  onError={(e) => console.log("❌ Image failed to load:", item.img, e.nativeEvent.error)}
/>


            </TouchableOpacity>

            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{item.price}</Text>
              <Text style={styles.discount}>₹{item.Dprice}</Text>
            </View>

            <Text style={styles.discountBadge}>{calculateDiscount(item.price, item.Dprice)}% OFF</Text>

            <View style={styles.controls}>
              <TouchableOpacity onPress={() => handleDecrement(item._id)} style={styles.button}>
                <Minus size={18} color="white" />
              </TouchableOpacity>

              <TextInput
                style={styles.quantityInput}
                value={String(cartQuantities[item._id] ?? 0)}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setCartQuantities((prev) => ({ ...prev, [item._id]: parseInt(text) || 0 }))
                }
              />

              <TouchableOpacity onPress={() => handleIncrement(item._id)} style={styles.button}>
                <Plus size={18} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => handleAddToCart(item)} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
              <ShoppingBag size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  row: { justifyContent: "space-between" },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    paddingBottom:9,
    marginBottom: 10,
    width: "49%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityInput: {
    width: 40,
    textAlign: "center",
    borderBottomWidth: 0,
    borderColor: "#ccc",
    marginHorizontal: 20,
  },
  image: { width: 190, height: 150, borderRadius: 8 },
  name: { fontSize: 14, fontWeight: "bold", marginTop: 8, textAlign: "center" },
  priceContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  price: { fontSize: 20, fontWeight: "bold", color: "green", marginRight: 6 },
  discount: { fontSize: 12, color: "gray", textDecorationLine: "line-through" },
  discountBadge: { fontSize: 12, color: "red", fontWeight: "bold", marginLeft: 6 },
  controls: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  button: { backgroundColor: "#FFb900", borderRadius: 4, padding: 4, marginHorizontal: 10 },
  addButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFb900", borderRadius: 6, padding: 8, marginTop: 8 },
  addButtonText: { color: "white", fontWeight: "bold", marginRight: 4 },
});

export default Drinks;
