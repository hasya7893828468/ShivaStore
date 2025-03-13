const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order"); // ✅ Ensure the correct import

// ✅ Add Order Route (Fixed Validation & Logging)
router.post("/add-order", async (req, res) => {
  try {
    console.log("🛠️ Incoming Order Data:", JSON.stringify(req.body, null, 2));

    const { userId, userName, vendorId, name, phone, address, userLocation, cartItems } = req.body;

    // ✅ Validate input
    if (!userId || !userName || !vendorId || !name || !phone || !address || !cartItems || cartItems.length === 0) {
      console.error("❌ Missing required fields:", { userId, userName, vendorId, name, phone, address, cartItems });
      return res.status(400).json({ msg: "❌ Invalid order details! Required fields are missing." });
    }

    // ✅ Validate location
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.error("❌ Location data missing:", userLocation);
      return res.status(400).json({ msg: "❌ User location is required!" });
    }

    // ✅ Create and save order
    const newOrder = new Order({
      userId,
      userName,
      vendorId,
      name,
      phone,
      address,
      userLocation,
      cartItems,
      status: "Pending",
      createdAt: new Date(),
    });

    await newOrder.save();
    console.log("✅ Order saved successfully!");
    res.status(201).json({ message: "✅ Order placed successfully", orderId: newOrder._id });

  } catch (error) {
    console.error("❌ Error saving order:", error);
    res.status(500).json({ msg: "❌ Server error! Unable to place order." });
  }
});

// ✅ Get Vendor Orders
router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ error: "❌ Invalid vendor ID format" });
    }

    const orders = await Order.find({ vendorId: mongoose.Types.ObjectId(vendorId) }).sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ error: "⚠️ No orders found for this vendor" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error fetching vendor orders:", error);
    res.status(500).json({ message: "❌ Error fetching vendor orders" });
  }
});

// ✅ Get User Orders
router.get("/user/:userId", async (req, res) => {
  try {
    let { userId } = req.params;

    console.log("🔍 Fetching orders for userId:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "❌ Invalid user ID format" });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ error: "⚠️ No orders found for this user" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error fetching user orders:", error);
    res.status(500).json({ message: "❌ Error fetching user orders" });
  }
});

// ✅ Mark Order as Completed
router.put("/complete-order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "❌ Invalid order ID format" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "⚠️ Order not found" });
    }

    order.status = "Completed";
    await order.save();

    res.status(200).json({ message: "✅ Order marked as completed", order });
  } catch (error) {
    console.error("❌ Error completing order:", error);
    res.status(500).json({ message: "❌ Error completing order" });
  }
});

module.exports = router;
