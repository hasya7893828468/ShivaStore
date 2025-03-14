import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, StyleSheet } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OrderList from "./OrderListProps";

const MyOrders: React.FC = () => {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (!storedUserId) {
          setError("❌ User ID not found. Please log in.");
          setLoading(false);
          return;
        }
        setUserId(storedUserId);
      } catch (err) {
        setError("❌ Failed to retrieve user ID.");
        setLoading(false);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://192.168.144.2:5001/api/orders/user/${userId}`);
        const ordersWithTotal = response.data.map(order => {
          const grandTotal = order.cartItems.reduce((sum, item) => {
            item.totalPrice = (item.price || 0) * (item.quantity || 1);
            return sum + item.totalPrice;
          }, 0);
          return { ...order, grandTotal };
        });

        const sortedOrders = ordersWithTotal.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPendingOrders(sortedOrders.filter(order => order.status === "Pending"));
        setCompletedOrders(sortedOrders.filter(order => order.status === "Completed"));
        setError("");
      } catch (err: any) {
        setError(`❌ Error fetching orders: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📦 My Orders</Text>

      {loading && <ActivityIndicator size="large" color="#f59e0b" style={styles.loader} />}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && (
        <FlatList
          data={[{ type: "Pending" }, { type: "Completed" }]}
          keyExtractor={(item) => item.type}
          renderItem={({ item }) => (
            <View style={styles.section}>
              <Text style={item.type === "Pending" ? styles.pendingText : styles.completedText}>
                {item.type === "Pending" ? "⏳ Pending Orders" : "✅ Completed Orders"}
              </Text>
              <OrderList orders={item.type === "Pending" ? pendingOrders : completedOrders} />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  heading: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  loader: { marginTop: 20 },
  errorText: { textAlign: "center", color: "red", marginBottom: 10 },
  section: { marginBottom: 20 },
  pendingText: { fontSize: 18, fontWeight: "600", color: "#f59e0b", textAlign: "center" },
  completedText: { fontSize: 18, fontWeight: "600", color: "green", textAlign: "center" },
  noOrders: { textAlign: "center", color: "#666", marginTop: 10 },
});

export default MyOrders;
