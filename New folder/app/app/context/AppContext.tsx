import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Alert } from "react-native";
import * as Location from "expo-location"; // ✅ Import Location API
;import Toast from "react-native-toast-message";


// ✅ Define Types
interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  img?: string;
}

interface User {
  _id: string;
  name: string;
  phone: string;
  address: string;
}

interface AppContextProps {
  user: User | null;
  vendorId: string | null;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  handleOrderNow: () => void;
  searchValue: string; // ✅ Added
  setSearchValue: (value: string) => void; // ✅ Added

}

// ✅ Create Context
const AppContext = createContext<AppContextProps | undefined>(undefined);

// ✅ Context Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const API_URL = "http://192.168.144.2:5000/api"; // Backend URL
  const isDataLoaded = useRef(false); // Prevent multiple API calls
  const [searchValue, setSearchValue] = useState(""); // ✅ Ensure it's properly defined


  // ✅ Load User, Vendor, and Cart from AsyncStorage & Backend
  useEffect(() => {
    if (isDataLoaded.current) return; // Prevent duplicate fetches
    isDataLoaded.current = true;

    const fetchData = async () => {
      try {
        // 🔍 Get User ID
        const storedUserId = await AsyncStorage.getItem("userId");
        if (!storedUserId) {
          console.warn("⚠️ No userId found in AsyncStorage!");
          return;
        }

        console.log("🟢 Found userId:", storedUserId);

        // ✅ Fetch user from backend
        const userResponse = await axios.get(`${API_URL}/auth/user/${storedUserId}`);
        setUser(userResponse.data);
        console.log("🟢 User Data Loaded:", userResponse.data);

        // ✅ Get Vendor ID from AsyncStorage or API
        let storedVendorId = await AsyncStorage.getItem("vendorId");
        if (!storedVendorId) {
          const vendorResponse = await axios.get(`${API_URL}/vendors/get-vendor`);
          storedVendorId = vendorResponse.data._id;
          await AsyncStorage.setItem("vendorId", storedVendorId);
        }
        setVendorId(storedVendorId);
        console.log("🟢 Vendor ID Set:", storedVendorId);

        // ✅ Load cart from AsyncStorage
        const storedCart = await AsyncStorage.getItem("cart");
        if (storedCart) setCart(JSON.parse(storedCart));
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // ✅ Function to store cart in AsyncStorage **instantly**
  const saveCartToStorage = async (updatedCart: CartItem[]) => {
    try {
      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (error) {
      console.error("❌ Error saving cart:", error);
    }
  };

  // ✅ Add Item to Cart & Store **instantly**
  const addToCart = useCallback((item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem._id === item._id);
      let updatedCart;
  
      if (existingItem) {
        updatedCart = prevCart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      } else {
        updatedCart = [...prevCart, item];
      }
  
      saveCartToStorage(updatedCart); // ✅ Store immediately
      return updatedCart;
    });
  
    // ✅ Show toast notification
    Toast.show({
      type: "success",
      text1: "✅ Success",
      text2: `${item.name} added to cart!`,
      visibilityTime: 2000, // Auto dismiss in 2 seconds
      position: "bottom",
    });
  }, []);

  // ✅ Remove Item from Cart & Store **instantly**
  const removeFromCart = useCallback((itemId: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter((item) => item._id !== itemId);
      saveCartToStorage(updatedCart); // ✅ Store immediately
      return updatedCart;
    });

    Alert.alert("✅ Success", "Item removed from cart!");
  }, []);

  // ✅ Update Cart Quantity & Store **instantly**
  const updateCartQuantity = useCallback((id: string, newQuantity: number) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item._id === id ? { ...item, quantity: newQuantity } : item
      );
      saveCartToStorage(updatedCart); // ✅ Store immediately
      return updatedCart;
    });
  }, []);


  // ✅ Place Order: Send Cart Items to Vendor
  // import * as Location from "expo-location";

  const handleOrderNow = async () => {
    try {
      console.log("📡 Connecting to API:", API_URL);
  
      // ✅ Fetch stored user data
      const storedUserData = await AsyncStorage.getItem("userData");
      const user = storedUserData ? JSON.parse(storedUserData) : null;
      const storedUserId = await AsyncStorage.getItem("userId");
  
      // ✅ Fetch cart items
      const storedCart = await AsyncStorage.getItem("cart");
      const cartItems = storedCart ? JSON.parse(storedCart) : [];
  
      if (!storedUserId || !user || cartItems.length === 0) {
        Alert.alert("❌ Error", "Missing user details or cart is empty.");
        return;
      }
  
      // ✅ Fetch user location
      const storedLocation = await AsyncStorage.getItem("userLocation");
      const userLocation = storedLocation ? JSON.parse(storedLocation) : null;
  
      if (!userLocation?.latitude || !userLocation?.longitude) {
        Alert.alert("⚠️ Error", "User location missing! Please enable location.");
        return;
      }
  
      const vendorId = "67bda14d08437495dde45ef3"; // Ensure this is dynamically set if needed
  
      // ✅ Construct order data correctly
      const orderData = {
        userId: storedUserId,
        userName: user.name,  // ✅ Ensure userName is set
        name: user.name,       // ✅ Explicitly add 'name' field
        phone: user.phone,
        address: user.address,
        userLocation,
        vendorId,
        cartItems, // ✅ Send ordered items
        status: "Pending",
      };
  
      console.log("🛒 Placing Order:", JSON.stringify(orderData, null, 2));
  
      const response = await axios.post(`${API_URL}/orders/add-order`, orderData, { timeout: 10000 });
      console.log("✅ Order Response:", response.status, response.data);
  
      if (response.status === 201) {
        Alert.alert("✅ Success", "Order placed successfully!");
        setCart([]);
        await AsyncStorage.removeItem("cart");
      } else {
        Alert.alert("⚠️ Error", "Unexpected response from server.");
      }
    } catch (error) {
      console.error("❌ Order Placement Error:", error?.response?.data || error);
      Alert.alert("⚠️ Order Error", "Could not place order! Try again later.");
    }
  };
  

  return (
    <AppContext.Provider
      value={{
        user,
        vendorId,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        handleOrderNow,
        searchValue, // ✅ Added
        setSearchValue, // ✅ Added
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
};

export default AppProvider;
