import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryBoyEarnings from "../models/DeliveryBoyEarnings.js";
import CustomerOrder from "../../customer/models/CustomerOrder.js";
import Vendor from "../../vendor/models/Vendor.js";
import User from "../../customer/models/User.js";
import { emitToRoom } from "../../socket/socketManager.js";

// Seeding helper to ensure delivery boy has orders for UI demonstration
const ensureMockAssignments = async (deliveryBoyId) => {
  // Disabled mock seeder to use real live data only
  return;
};

import mongoose from "mongoose";
import { handleOrderStatusChange, runInTransaction } from "../../utils/ledgerSyncHelper.js";

// Get Dashboard Data
export const getDashboard = async (req, res) => {
  try {
    const deliveryBoyId = req.deliveryBoy._id;
    await ensureMockAssignments(deliveryBoyId);

    // Fetch earnings
    let earnings = await DeliveryBoyEarnings.findOne({ deliveryBoy: deliveryBoyId });
    if (!earnings) {
      earnings = await DeliveryBoyEarnings.create({
        deliveryBoy: deliveryBoyId,
        totalEarnings: 0,
        incentives: 0,
        commissions: 0,
        walletBalance: 0,
        pendingBalance: 0,
        settledBalance: 0,
      });
    }

    // Fetch stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = await CustomerOrder.find({
      deliveryBoyId,
      deliveryStatus: "Delivered",
      updatedAt: { $gte: todayStart }
    });

    const todayEarningsCount = todayOrders.reduce((sum, order) => sum + (order.deliveryCharge || 0), 0);

    const pendingCount = await CustomerOrder.countDocuments({
      deliveryBoyId,
      deliveryStatus: "Assigned"
    });

    const inProgressCount = await CustomerOrder.countDocuments({
      deliveryBoyId,
      deliveryStatus: { $in: ["Picked_Up", "On_the_Way", "Reached_Customer"] }
    });

    const completedCount = await CustomerOrder.countDocuments({
      deliveryBoyId,
      deliveryStatus: "Delivered"
    });

    // Fetch active assignments (Pending or In Progress)
    const activeDeliveries = await CustomerOrder.find({
      deliveryBoyId,
      deliveryStatus: { $in: ["Assigned", "Picked_Up", "On_the_Way", "Reached_Customer"] }
    }).populate("vendorId", "shopName phone address latitude longitude");

    // Compute weekly earnings breakdown (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyOrders = await CustomerOrder.find({
      deliveryBoyId,
      deliveryStatus: "Delivered",
      updatedAt: { $gte: sevenDaysAgo }
    }).select("deliveryCharge updatedAt");

    // Build day-keyed map
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      dayMap[key] = { day: dayNames[d.getDay()], amount: 0 };
    }

    weeklyOrders.forEach(order => {
      const key = new Date(order.updatedAt).toISOString().slice(0, 10);
      if (dayMap[key]) {
        dayMap[key].amount += (order.deliveryCharge || 35);
      }
    });

    const weeklyBreakdown = Object.values(dayMap);

    res.status(200).json({
      success: true,
      stats: {
        todayEarnings: todayEarningsCount,
        completedDeliveries: completedCount,
        pendingOrders: pendingCount,
        inProgressOrders: inProgressCount,
      },
      earnings,
      activeDeliveries,
      weeklyBreakdown
    });
  } catch (error) {
    console.error("Get Delivery Boy Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Assigned Orders
export const getOrders = async (req, res) => {
  try {
    const deliveryBoyId = req.deliveryBoy._id;
    const { tab } = req.query; // 'all', 'pending', 'progress', 'completed'

    let filter = { deliveryBoyId };

    if (tab === "pending") {
      filter.deliveryStatus = "Assigned";
    } else if (tab === "progress") {
      filter.deliveryStatus = { $in: ["Picked_Up", "On_the_Way", "Reached_Customer"] };
    } else if (tab === "completed") {
      filter.deliveryStatus = "Delivered";
    }

    const orders = await CustomerOrder.find(filter)
      .populate("vendorId", "shopName phone address latitude longitude")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get Assigned Orders Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Order Details
export const getOrderById = async (req, res) => {
  try {
    const order = await CustomerOrder.findOne({
      _id: req.params.id,
      deliveryBoyId: req.deliveryBoy._id
    })
    .populate("vendorId", "shopName phone address latitude longitude")
    .populate("customerId", "fullName phoneNumber");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get Order Details Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Order Status (Sequential Transitions)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, latitude, longitude, note } = req.body;
    const order = await CustomerOrder.findOne({
      _id: req.params.id,
      deliveryBoyId: req.deliveryBoy._id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order assignment not found" });
    }

    // Validate sequential state transitions
    const validTransitions = {
      "Assigned": "Picked_Up",
      "Picked_Up": "On_the_Way",
      "On_the_Way": "Reached_Customer"
    };

    if (validTransitions[order.deliveryStatus] !== status) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${order.deliveryStatus}' to '${status}'`
      });
    }

    // Update status
    order.deliveryStatus = status;

    // Map deliveryStatus to CustomerOrder orderStatus for customer dashboard timeline visibility
    if (status === "Picked_Up") {
      order.orderStatus = "Packed";
    } else if (status === "On_the_Way") {
      order.orderStatus = "Out_for_Delivery";
    }

    // Log the event
    order.deliveryLogs.push({
      status,
      timestamp: new Date(),
      latitude: latitude || null,
      longitude: longitude || null,
      note: note || `Order updated to ${status.replace(/_/g, " ")}`
    });

    await order.save();

    // Map status to socket event name
    const eventMap = {
      Picked_Up: "order:pickedUp",
      On_the_Way: "order:onTheWay",
      Reached_Customer: "order:reachedCustomer",
    };
    const eventName = eventMap[status];
    if (eventName) {
      const payload = { orderId: order._id, orderId: order.orderId, status };
      // Notify customer
      if (order.customerId) emitToRoom(`customer:${order.customerId}`, eventName, payload);
      // Notify vendor
      if (order.vendorId) emitToRoom(`vendor:${order.vendorId}`, eventName, payload);
      // Notify admin dashboard
      emitToRoom("admin:global", eventName, payload);
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      order
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// OTP Verification (Complete Delivery)
export const verifyOtp = async (req, res) => {
  try {
    const { otp, latitude, longitude } = req.body;
    const orderId = req.params.id;
    let resultOrder = null;

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP code is required" });
    }

    await runInTransaction(async (session) => {
      const order = await CustomerOrder.findOne({
        _id: orderId,
        deliveryBoyId: req.deliveryBoy._id
      }).session(session);

      if (!order) {
        throw new Error("Order assignment not found");
      }

      if (order.deliveryOtp !== otp) {
        throw new Error("Invalid OTP code. Access denied.");
      }

      // Mark as completed
      order.deliveryStatus = "Delivered";
      order.orderStatus = "Delivered";
      order.paymentStatus = "Paid"; // COD orders are marked as Paid on delivery

      order.deliveryLogs.push({
        status: "Delivered",
        timestamp: new Date(),
        latitude: latitude || null,
        longitude: longitude || null,
        note: "Delivery successfully completed via customer OTP verification."
      });

      await order.save({ session });

      // Sync the ledger status to Delivered
      await handleOrderStatusChange(order._id, "Delivered", session);

      // Credit earnings to rider
      const fee = order.deliveryCharge || 35;
      const incentive = 5;
      const commission = 2;
      const credit = fee + incentive + commission;

      await DeliveryBoyEarnings.findOneAndUpdate(
        { deliveryBoy: req.deliveryBoy._id },
        {
          $inc: {
            totalEarnings: credit,
            incentives: incentive,
            commissions: commission,
            walletBalance: credit,
            settledBalance: credit
          }
        },
        { upsert: true, session }
      );
      resultOrder = order;
    });

    // Emit real-time "delivered" event to customer, vendor, and admin
    const deliveredPayload = { orderId: resultOrder._id, orderIdStr: resultOrder.orderId, status: "Delivered" };
    if (resultOrder.customerId) emitToRoom(`customer:${resultOrder.customerId}`, "order:delivered", deliveredPayload);
    if (resultOrder.vendorId) emitToRoom(`vendor:${resultOrder.vendorId}`, "order:delivered", deliveredPayload);
    emitToRoom("admin:global", "order:delivered", deliveredPayload);

    res.status(200).json({
      success: true,
      message: "Order delivered successfully!",
      order: resultOrder
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// Get Earnings Analytics
export const getEarnings = async (req, res) => {
  try {
    const deliveryBoyId = req.deliveryBoy._id;
    const earnings = await DeliveryBoyEarnings.findOne({ deliveryBoy: deliveryBoyId });

    // Fetch past completed orders to construct recent breakdown list
    const completedOrders = await CustomerOrder.find({
      deliveryBoyId,
      deliveryStatus: "Delivered"
    }).sort({ updatedAt: -1 }).limit(10);

    res.status(200).json({
      success: true,
      earnings: earnings || {
        totalEarnings: 0,
        incentives: 0,
        commissions: 0,
        walletBalance: 0,
        pendingBalance: 0,
        settledBalance: 0,
      },
      history: completedOrders
    });
  } catch (error) {
    console.error("Get Earnings Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName, vehicleType, vehicleNumber, latitude, longitude } = req.body;
    const deliveryBoy = await DeliveryBoy.findById(req.deliveryBoy._id);

    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    if (fullName) deliveryBoy.fullName = fullName;
    if (vehicleType) deliveryBoy.vehicleDetails.type = vehicleType;
    if (vehicleNumber) deliveryBoy.vehicleDetails.number = vehicleNumber;
    if (latitude) deliveryBoy.latitude = latitude;
    if (longitude) deliveryBoy.longitude = longitude;

    await deliveryBoy.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      deliveryBoy
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
