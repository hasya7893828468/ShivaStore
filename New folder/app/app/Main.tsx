import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { Plus, Minus, ShoppingBag } from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "./context/AppContext";
import NavBar from "./context/NavBar";
import { useNavigation } from "@react-navigation/native";
import SearchBar from "./context/SearchBar";
import HomeCard from "./comp/HomeCard";

interface Product {
  _id: string;
  name: string;
  price: number;
  Dprice: number;
  img?: string;
  category: string;
}

const Main: React.FC = () => {
  const { searchValue, addToCart } = useAppContext();
  const [productList, setProductList] = useState<Product[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [cartBadgeVisibility, setCartBadgeVisibility] = useState<Record<string, boolean>>({});

  const router = useRouter();
  const apiUrl = "http://192.168.144.2:5000/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching products...");
        const storedData = await AsyncStorage.getItem("allProductsData");

        if (storedData) {
          setProductList(JSON.parse(storedData));
          return;
        }

        const [groceriesRes, drinksRes, snacksRes] = await Promise.all([
          axios.get(`${apiUrl}/groceries`).catch(() => ({ data: [] })),
          axios.get(`${apiUrl}/drinks`).catch(() => ({ data: [] })),
          axios.get(`${apiUrl}/snacks`).catch(() => ({ data: [] })),
        ]);

        const allProducts = [
          ...groceriesRes.data.map((p: Product) => ({ ...p, category: "grocery" })),
          ...drinksRes.data.map((p: Product) => ({ ...p, category: "drink" })),
          ...snacksRes.data.map((p: Product) => ({ ...p, category: "snacks" })),
        ];

        await AsyncStorage.setItem("allProductsData", JSON.stringify(allProducts));
        setProductList(allProducts);
      } catch (error) {
        console.error("❌ Error fetching products:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("mainQuantities", JSON.stringify(cartQuantities));
  }, [cartQuantities]);

  const filteredData = useMemo(() => {
    return productList.filter((val) =>
      val?.name?.toLowerCase().includes((searchValue ?? "").toLowerCase())
    );
  }, [productList, searchValue]);

  const handleIncrement = (id: string) => {
    setCartQuantities((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setCartBadgeVisibility((prev) => ({ ...prev, [id]: true }));
  };

  const handleDecrement = (id: string) => {
    setCartQuantities((prev) => {
      const updatedQuantity = Math.max((prev[id] ?? 0) - 1, 0);
      return { ...prev, [id]: updatedQuantity };
    });
    setCartBadgeVisibility((prev) => ({ ...prev, [id]: (cartQuantities[id] ?? 0) > 1 }));
  };

  const handleAddToCart = (item: Product) => {
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

      setCartBadgeVisibility((prev) => ({ ...prev, [item._id]: false }));
      Alert.alert("Added to cart", `${item.name} added successfully!`);
    }
  };

  const calculateDiscount = (originalPrice: number, discountedPrice: number) => {
    if (originalPrice <= 0 || discountedPrice <= 0 || discountedPrice < originalPrice) return 0;
    return Math.abs(Math.round(((originalPrice - discountedPrice) / originalPrice) * 100));
  };
  

  return (
    <View style={styles.container}>
      <NavBar />
      <SearchBar />
      <HomeCard />
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.setItem("selectedProduct", JSON.stringify(item));
                router.push("Card");
              }}
            >
              <Image
                source={{
                  uri: `http://192.168.144.2:5000/${item.img?.replace(/^\/+/, "")}`,
                }}
                style={styles.image}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{item.price}</Text>
              <Text style={styles.discount}>₹{item.Dprice}</Text>
            </View>
            <Text style={styles.discountBadge}>
              {calculateDiscount(item.price, item.Dprice)}% OFF
            </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "Black" },
  row: { justifyContent: "space-between" },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 1,
    marginBottom: 10,
    width: "49%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: { width: 190, height: 150, borderRadius: 8 },
  name: { fontSize: 14, fontWeight: "bold", textAlign: "center", width: "90%" },
  priceContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  discountBadge: { fontSize: 12, color: "red", fontWeight: "bold" },
  price: { fontSize: 20, fontWeight: "bold", color: "green", marginRight: 6 },
  discount: { fontSize: 12, color: "gray", textDecorationLine: "line-through" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  quantityInput: {
    width: 40,
    textAlign: "center",
    borderBottomWidth: 0,
    borderColor: "#ccc",
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: "#FFb900",
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 0,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFb900",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    margin: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    marginRight: 4,
  },
});

export default Main;
