import React, { useEffect, useState, useCallback } from "react";
import { 
  View, Text, FlatList, ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, Linking 
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PendingOrders: React.FC = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorLocation, setVendorLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const fetchVendorId = async () => {
      try {
        const id = await AsyncStorage.getItem("vendorId");
        if (!id) throw new Error("Vendor ID not found.");
        setVendorId(id);
        fetchOrders(id);
      } catch (error) {
        Alert.alert("Error", error.message);
        setLoading(false);
      }
    };
    fetchVendorId();
  }, []);

  const fetchOrders = useCallback(async (id: string) => {
    try {
      console.log(`Fetching pending orders for vendor: ${id}`);
      const response = await axios.get(`http://192.168.144.2:5000/api/vendor-cart/${id}`);
      console.log("Fetched pending orders:", response.data);
      
      const pending = response.data.filter((order) => order.status === "Pending");
      setPendingOrders(pending);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      Alert.alert("Error", "Failed to fetch pending orders");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVendorLocation = async () => {
    if (!vendorId) return;

    try {
      const response = await axios.get(`http://192.168.144.2:5000/api/vendors/vendor-location/${vendorId}`);
      if (response.data.latitude && response.data.longitude) {
        setVendorLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
        });
        console.log("📍 Vendor Location Fetched:", response.data);
      } else {
        console.log("❌ Vendor location not found.");
      }
    } catch (error) {
      console.error("❌ Error fetching vendor location:", error);
    }
  };

  useEffect(() => {
    fetchVendorLocation();
    const interval = setInterval(fetchVendorLocation, 10000);
    return () => clearInterval(interval);
  }, [vendorId]);

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    try {
      await axios.put(`http://192.168.144.2:5000/api/orders/complete-order/${orderId}`);
      setPendingOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
      Alert.alert("✅ Success", "Order marked as completed.");
    } catch (error) {
      console.error("❌ Error completing order:", error);
      Alert.alert("Error", "Failed to complete order.");
    }
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#00f" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Orders</Text>
      {vendorLocation && (
        <View style={styles.vendorLocationContainer}>
          <Text style={styles.vendorLocationText}>📍 Vendor Location: {vendorLocation.latitude}, {vendorLocation.longitude}</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`https://www.google.com/maps?q=${vendorLocation.latitude},${vendorLocation.longitude}`)}
            style={styles.directionButton}
          >
            <Text style={styles.directionButtonText}>🌍 View Vendor Location</Text>
          </TouchableOpacity>
        </View>
      )}
      {pendingOrders.length === 0 ? (
        <Text style={styles.noOrders}>No pending orders found</Text>
      ) : (
        <FlatList
          data={pendingOrders}
          keyExtractor={(order) => order._id}
          initialNumToRender={5}
          getItemLayout={(data, index) => ({ length: 160, offset: 160 * index, index })}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <Text style={styles.orderId}>Order ID: {item._id}</Text>
              <Text style={styles.customer}>📅 Date: {new Date(item.createdAt).toLocaleString()}</Text>
              <Text style={styles.customer}>👤 Customer: {item.userName || "Unknown User"}</Text>
              <Text style={styles.customer}>📞 Phone: {item.phone || "No phone provided"}</Text>
              <Text style={styles.customer}>🏠 Address: {item.address || "No address provided"}</Text>
              <FlatList
                data={item.cartItems}
                keyExtractor={(product) => product._id}
                renderItem={({ item }) => (
                  <View style={styles.itemRow}>
                    <Image source={{ uri: item.img }} style={styles.image} resizeMode="contain" />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>₹{item.price} x {item.quantity}</Text>
                      <Text style={styles.itemTotal}>💰 Total: ₹{(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  </View>
                )}
              />
              {item.userLocation?.latitude && item.userLocation?.longitude && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.userLocation.latitude},${item.userLocation.longitude}`)}
                  style={styles.directionButton}
                >
                  <Text style={styles.directionButtonText}>📍 View Customer Location</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.completeButton} 
                onPress={() => handleCompleteOrder(item._id)}
              >
                <Text style={styles.completeButtonText}>✅ Mark as Completed</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  noOrders: { textAlign: "center", color: "gray", marginTop: 20 },
  orderCard: { backgroundColor: "white", padding: 10, marginBottom: 10, borderRadius: 10, elevation: 3 },
  orderId: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  customer: { color: "gray", fontSize: 14 },
  totalItems: { fontSize: 14, fontWeight: "bold", marginTop: 5 },
  itemRow: { flexDirection: "row", alignItems: "center", marginTop: 5, backgroundColor: "#f1f3f5", padding: 5, borderRadius: 5 },
  image: { width: 50, height: 50, marginRight: 10, borderRadius: 5 },
  itemDetails: { flex: 1 },
  itemName: { fontWeight: "bold" },
  itemPrice: { color: "gray" },
  itemTotal: { fontWeight: "bold", color: "blue" },
  totalContainer: { backgroundColor: "#e9ecef", padding: 5, marginTop: 10, borderRadius: 5 },
  totalText: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  directionButton: { marginTop: 10, backgroundColor: "#ff9800", padding: 10, borderRadius: 5, alignItems: "center" },
  directionButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  completeButton: { backgroundColor: "green", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 10 },
  completeButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default PendingOrders;
