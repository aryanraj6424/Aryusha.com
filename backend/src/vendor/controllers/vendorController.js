import Vendor from "../models/Vendor.js";
import VendorPermission from "../models/VendorPermission.js";
import VendorEarnings from "../models/VendorEarnings.js";
import Settlement from "../models/Settlement.js";
import Commission from "../models/Commission.js";
import CommissionLedger from "../models/CommissionLedger.js";
import Order from "../models/Order.js";
import { Product } from "../../models/catalog.js";
import CustomerOrder from "../../customer/models/CustomerOrder.js";
import DeliveryBoy from "../../deliveryBoy/models/DeliveryBoy.js";
import { emitToRoom } from "../../socket/socketManager.js";
import RiderNotification from "../../deliveryBoy/models/RiderNotification.js";
import PlatformFeeSettings from "../../admin/models/PlatformFeeSettings.js";
import { calculateCommissionSync } from "../../utils/commissionCalculator.js";
import mongoose from "mongoose";
import { handleOrderStatusChange, runInTransaction } from "../../utils/ledgerSyncHelper.js";

const ensureMockOrders = async (vendorId) => {
  // Disabled mock seeder to use real live data only
  return;
};

// Vendor Dashboard
export const getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const vendor = await Vendor.findById(vendorId);
    
    const platformSettings = await PlatformFeeSettings.findOne() || {
      defaultCommissionType: "percentage",
      defaultCommissionValue: 8
    };

    const commType = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
      ? vendor.commissionType 
      : platformSettings.defaultCommissionType || "percentage";
      
    const commVal = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
      ? vendor.commissionValue 
      : platformSettings.defaultCommissionValue ?? 8;

    // Fetch all real customer orders for this vendor
    const realOrders = await CustomerOrder.find({ vendorId })
      .populate("customerId", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    const mappedOrders = realOrders.map(order => {
      const commission = calculateCommissionSync(order, commType, commVal);
      const netAmount = order.totalAmount - commission;
      
      let status = "pending";
      if (order.orderStatus === "Delivered") {
        status = "completed";
      } else if (order.orderStatus === "Cancelled" || order.orderStatus === "Rejected") {
        status = "cancelled";
      } else if (order.orderStatus === "Accepted" || order.orderStatus === "Packed") {
        status = "processing";
      }

      return {
        orderId: order.orderId,
        customerName: order.customerId?.fullName || order.deliveryAddress?.fullName || "Customer",
        totalAmount: order.totalAmount,
        commission,
        netAmount,
        status,
        createdAt: order.createdAt
      };
    });

    // Dynamic calculations from the commission ledger (Single Source of Truth)
    const activeLedgerEntries = await CommissionLedger.find({
      vendorId,
      orderStatus: "Delivered"
    });

    const totalSales = activeLedgerEntries.reduce((sum, entry) => sum + entry.orderAmount, 0);
    const commissionPaid = activeLedgerEntries.reduce((sum, entry) => sum + entry.commissionAmount, 0);
    const netRevenue = totalSales - commissionPaid;

    let earnings = await VendorEarnings.findOne({ vendor: vendorId });
    if (!earnings) {
      earnings = await VendorEarnings.create({
        vendor: vendorId,
        totalSales,
        grossRevenue: totalSales,
        netRevenue,
        commissionPaid,
        walletBalance: netRevenue,
        pendingBalance: 0,
        settledBalance: 0,
      });
    } else {
      earnings.totalSales = totalSales;
      earnings.grossRevenue = totalSales;
      earnings.netRevenue = netRevenue;
      earnings.commissionPaid = commissionPaid;
      // Auto-update wallet balance keeping track of withdrawals
      earnings.walletBalance = Math.max(0, netRevenue - (earnings.pendingBalance + earnings.settledBalance));
      await earnings.save();
    }

    const totalProducts = await Product.countDocuments({
      createdBy: vendorId,
      creatorModel: "Vendor",
      isDeleted: { $ne: true }
    });

    res.status(200).json({
      success: true,
      vendor,
      earnings,
      orders: mappedOrders,
      totalProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Vendor Profile Self
export const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id);
    res.status(200).json({
      success: true,
      vendor,
      allowLocationEdit: process.env.ALLOW_VENDOR_LOCATION_EDIT === "true"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Vendor Permissions Self
export const getVendorPermissionsSelf = async (req, res) => {
  try {
    let permissions = await VendorPermission.findOne({ vendor: req.vendor._id });
    if (!permissions) {
      permissions = await VendorPermission.create({
        vendor: req.vendor._id,
        permissions: {
          category: { view: true, add: true, edit: true, delete: true },
          subCategory: { view: true, add: true, edit: true, delete: true },
          productFamily: { view: true, add: true, edit: true, delete: true },
          areaAccess: { view: true },
          couponAccess: { view: true, create: true, edit: true, delete: true },
          product: { view: true, add: true, edit: true, delete: true },
        },
      });
    } else {
      let modified = false;
      if (!permissions.permissions.product) {
        permissions.permissions.product = { view: true, add: true, edit: true, delete: true };
        modified = true;
      }
      if (modified) {
        permissions.markModified("permissions");
        await permissions.save();
      }
    }
    res.status(200).json({ success: true, permissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Vendor Earnings Self
export const getVendorEarningsSelf = async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const vendor = await Vendor.findById(vendorId);
    const platformSettings = await PlatformFeeSettings.findOne() || {
      defaultCommissionType: "percentage",
      defaultCommissionValue: 8
    };

    const commType = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
      ? vendor.commissionType 
      : platformSettings.defaultCommissionType || "percentage";
      
    const commVal = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
      ? vendor.commissionValue 
      : platformSettings.defaultCommissionValue ?? 8;

    // Dynamic calculations from the commission ledger (Single Source of Truth)
    const activeLedgerEntries = await CommissionLedger.find({
      vendorId,
      orderStatus: "Delivered"
    });

    const totalSales = activeLedgerEntries.reduce((sum, entry) => sum + entry.orderAmount, 0);
    const commissionPaid = activeLedgerEntries.reduce((sum, entry) => sum + entry.commissionAmount, 0);
    const netRevenue = totalSales - commissionPaid;

    // Get current earnings config
    let earnings = await VendorEarnings.findOne({ vendor: vendorId });
    if (!earnings) {
      earnings = await VendorEarnings.create({
        vendor: vendorId,
        totalSales,
        grossRevenue: totalSales,
        netRevenue,
        commissionPaid,
        walletBalance: netRevenue,
        pendingBalance: 0,
        settledBalance: 0,
      });
    } else {
      earnings.totalSales = totalSales;
      earnings.grossRevenue = totalSales;
      earnings.netRevenue = netRevenue;
      earnings.commissionPaid = commissionPaid;
      // Auto-update wallet balance keeping track of withdrawals
      earnings.walletBalance = Math.max(0, netRevenue - (earnings.pendingBalance + earnings.settledBalance));
      await earnings.save();
    }

    res.status(200).json({ success: true, earnings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Settlements History Self
export const getVendorSettlementsSelf = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    await ensureMockOrders(vendorId);

    const settlements = await Settlement.find({ vendor: vendorId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, settlements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Request Withdrawal / Payout Request
export const requestWithdrawalSelf = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Please provide a valid withdrawal amount" });
    }

    const earnings = await VendorEarnings.findOne({ vendor: vendorId });
    if (!earnings || earnings.walletBalance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    // Deduct from wallet and add to pending balance
    earnings.walletBalance -= amount;
    earnings.pendingBalance += amount;
    await earnings.save();

    // Fetch vendor documents bankDetails if any
    const vendor = await Vendor.findById(vendorId);

    const settlement = await Settlement.create({
      vendor: vendorId,
      amount,
      status: "pending",
      bankDetails: {
        accountHolder: vendor?.documents?.bankDetails?.accountHolder || "Vendor Account",
        accountNumber: vendor?.documents?.bankDetails?.accountNumber || "",
        ifsc: vendor?.documents?.bankDetails?.ifsc || "",
        bankName: vendor?.documents?.bankDetails?.bankName || "",
      },
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      settlement,
      earnings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Commission Details Self
export const getVendorCommissionSelf = async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const vendor = await Vendor.findById(vendorId);
    const platformSettings = await PlatformFeeSettings.findOne() || {
      defaultCommissionType: "percentage",
      defaultCommissionValue: 8
    };

    const commType = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
      ? vendor.commissionType 
      : platformSettings.defaultCommissionType || "percentage";
      
    const commVal = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
      ? vendor.commissionValue 
      : platformSettings.defaultCommissionValue ?? 8;

    let commission = await Commission.findOne({ vendor: vendorId });
    if (!commission) {
      commission = await Commission.create({ vendor: vendorId, rate: commVal });
    } else {
      commission.rate = commVal;
      await commission.save();
    }

    // Recalculate based on orders
    const completedOrders = await CustomerOrder.find({ vendorId, orderStatus: "Delivered" });
    const calculatedCommission = completedOrders.reduce((sum, o) => sum + calculateCommissionSync(o, commType, commVal), 0);

    commission.calculatedCommission = calculatedCommission;
    await commission.save();

    res.status(200).json({ success: true, commission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Sales Report from actual orders in MongoDB
export const getVendorSalesReportSelf = async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const vendor = await Vendor.findById(vendorId);
    const platformSettings = await PlatformFeeSettings.findOne() || {
      defaultCommissionType: "percentage",
      defaultCommissionValue: 8
    };

    const commType = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
      ? vendor.commissionType 
      : platformSettings.defaultCommissionType || "percentage";
      
    const commVal = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
      ? vendor.commissionValue 
      : platformSettings.defaultCommissionValue ?? 8;

    // Fetch all real customer orders for this vendor
    const realOrders = await CustomerOrder.find({ vendorId })
      .populate("customerId", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    const mappedOrders = realOrders.map(order => {
      const commission = calculateCommissionSync(order, commType, commVal);
      const netAmount = order.grandTotal - commission;
      
      let status = "pending";
      if (order.orderStatus === "Delivered") {
        status = "completed";
      } else if (order.orderStatus === "Cancelled" || order.orderStatus === "Rejected") {
        status = "cancelled";
      } else if (order.orderStatus === "Accepted" || order.orderStatus === "Packed") {
        status = "processing";
      }

      return {
        orderId: order.orderId,
        customerName: order.customerId?.fullName || order.deliveryAddress?.fullName || "Customer",
        totalAmount: order.grandTotal,
        commission,
        netAmount,
        status,
        createdAt: order.createdAt
      };
    });

    const totalOrdersCount = mappedOrders.length;
    const completedOrders = mappedOrders.filter((o) => o.status === "completed");
    const totalSalesRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalCommissionDeducted = completedOrders.reduce((sum, o) => sum + o.commission, 0);
    const totalNetPayout = completedOrders.reduce((sum, o) => sum + o.netAmount, 0);

    // Group sales by date for report chart
    const dailySales = {};
    completedOrders.forEach((order) => {
      const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
      if (!dailySales[dateStr]) {
        dailySales[dateStr] = { date: dateStr, sales: 0, revenue: 0 };
      }
      dailySales[dateStr].sales += 1;
      dailySales[dateStr].revenue += order.totalAmount;
    });

    const reportData = Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      summary: {
        totalOrdersCount,
        completedOrdersCount: completedOrders.length,
        totalSalesRevenue,
        totalCommissionDeducted,
        totalNetPayout,
      },
      chartData: reportData,
      orders: mappedOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update Vendor Profile Self (Coordinates, Radius, Service Areas)
export const updateVendorProfileSelf = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { latitude, longitude, deliveryRadius, serviceAreas } = req.body;

    // Check if vendor tries to edit location coordinates or radius, and configuration disallows it
    const isEditingLocation =
      (latitude !== undefined) ||
      (longitude !== undefined) ||
      (deliveryRadius !== undefined);

    if (isEditingLocation && process.env.ALLOW_VENDOR_LOCATION_EDIT !== "true") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit store coordinates or delivery radius. Please contact administration."
      });
    }

    // Validation rules
    if (latitude !== undefined && latitude !== null && latitude !== "") {
      const latNum = Number(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return res.status(400).json({ success: false, message: "Invalid latitude. Must be between -90 and 90." });
      }
    }
    if (longitude !== undefined && longitude !== null && longitude !== "") {
      const lngNum = Number(longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({ success: false, message: "Invalid longitude. Must be between -180 and 180." });
      }
    }
    if (deliveryRadius !== undefined && deliveryRadius !== null && deliveryRadius !== "") {
      const radNum = Number(deliveryRadius);
      if (isNaN(radNum) || radNum < 0) {
        return res.status(400).json({ success: false, message: "Invalid delivery radius. Must be a positive number." });
      }
    }
    if (serviceAreas !== undefined) {
      if (!Array.isArray(serviceAreas)) {
        return res.status(400).json({ success: false, message: "Service areas must be an array." });
      }
      const pincodes = new Set();
      for (const sa of serviceAreas) {
        if (!sa.pincode || !sa.areaName || !sa.city || !sa.state) {
          return res.status(400).json({ success: false, message: "Each service area must contain pincode, areaName, city, and state." });
        }
        if (pincodes.has(sa.pincode)) {
          return res.status(400).json({ success: false, message: `Duplicate pincode found: ${sa.pincode}` });
        }
        pincodes.add(sa.pincode);
      }
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (latitude !== undefined) vendor.latitude = (latitude === null || latitude === "") ? null : Number(latitude);
    if (longitude !== undefined) vendor.longitude = (longitude === null || longitude === "") ? null : Number(longitude);
    if (deliveryRadius !== undefined) vendor.deliveryRadius = (deliveryRadius === null || deliveryRadius === "") ? null : Number(deliveryRadius);
    if (serviceAreas !== undefined) vendor.serviceAreas = serviceAreas;

    if (req.body.shopName !== undefined) vendor.shopName = req.body.shopName;
    if (req.body.phone !== undefined) vendor.phone = req.body.phone;
    if (req.body.businessEmail !== undefined) vendor.businessEmail = req.body.businessEmail;
    if (req.body.whatsapp !== undefined) vendor.whatsapp = req.body.whatsapp;

    if (req.body.address !== undefined) {
      vendor.address = {
        ...(vendor.address || {}),
        ...req.body.address
      };
    }
    if (req.body.ownerDetails !== undefined) {
      vendor.ownerDetails = {
        ...(vendor.ownerDetails || {}),
        ...req.body.ownerDetails
      };
    }
    if (req.body.storeDetails !== undefined) {
      vendor.storeDetails = {
        ...(vendor.storeDetails || {}),
        ...req.body.storeDetails
      };
    }
    if (req.body.documents !== undefined) {
      const docs = req.body.documents || {};
      const bank = docs.bankDetails || {};
      vendor.documents = {
        ...(vendor.documents || {}),
        ...docs,
        bankDetails: {
          ...(vendor.documents?.bankDetails || {}),
          ...bank
        }
      };
    }

    await vendor.save();
    res.status(200).json({ success: true, message: "Vendor profile updated successfully", vendor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Vendor Order Management Endpoints
export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const orders = await CustomerOrder.find({ vendorId })
      .populate("customerId", "fullName email phoneNumber")
      .populate("deliveryBoyId", "fullName phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get Vendor Orders Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const assignDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    const orderId = req.params.id;
    const vendorId = req.vendor._id;

    if (!deliveryBoyId) {
      return res.status(400).json({ success: false, message: "Delivery Boy ID is required" });
    }

    const order = await CustomerOrder.findOne({ _id: orderId, vendorId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Constraint: Dispatch readiness check
    if (order.orderStatus === "Pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not yet ready for dispatch. You must accept/pack it first."
      });
    }

    if (["Delivered", "Rejected", "Cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign delivery boy to an order that is ${order.orderStatus.toLowerCase()}.`
      });
    }

    const rider = await DeliveryBoy.findById(deliveryBoyId);
    if (!rider || rider.status !== "approved" || rider.accountStatus !== "active") {
      return res.status(400).json({ success: false, message: "Delivery boy is not available or inactive" });
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    order.deliveryBoyId = deliveryBoyId;
    order.deliveryStatus = "Assigned";
    order.deliveryOtp = otpCode;

    order.deliveryLogs.push({
      status: "Assigned",
      timestamp: new Date(),
      note: `Order assigned to rider ${rider.fullName} with verification OTP: ${otpCode}`
    });

    await order.save();

    // Create persistent notification for delivery boy
    await RiderNotification.create({
      deliveryBoyId,
      title: "New Delivery Assigned! 📦",
      message: `A new order (${order.orderId}) has been assigned to you.`,
      type: "order"
    });

    // Notify the assigned delivery boy in real-time
    emitToRoom(`deliveryBoy:${deliveryBoyId}`, "order:assigned", {
      orderId: order._id,
      orderRef: order.orderId,
      message: "A new order has been assigned to you."
    });
    // Notify admin
    emitToRoom("admin:global", "order:assigned", { orderId: order._id, orderRef: order.orderId });

    res.status(200).json({
      success: true,
      message: "Delivery boy assigned successfully",
      order
    });
  } catch (error) {
    console.error("Assign Delivery Boy Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const reassignDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    const orderId = req.params.id;
    const vendorId = req.vendor._id;

    if (!deliveryBoyId) {
      return res.status(400).json({ success: false, message: "Delivery Boy ID is required" });
    }

    const order = await CustomerOrder.findOne({ _id: orderId, vendorId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Constraint: Reassignment is blocked once order status is "Picked Up" or later
    if (order.deliveryStatus !== "Assigned" && order.deliveryStatus !== "None") {
      return res.status(400).json({
        success: false,
        message: "Reassignment blocked: Order has already been picked up or delivered by the rider."
      });
    }

    const rider = await DeliveryBoy.findById(deliveryBoyId);
    if (!rider || rider.status !== "approved" || rider.accountStatus !== "active") {
      return res.status(400).json({ success: false, message: "Delivery boy is not available or inactive" });
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    order.deliveryBoyId = deliveryBoyId;
    order.deliveryStatus = "Assigned";
    order.deliveryOtp = otpCode;

    order.deliveryLogs.push({
      status: "Assigned",
      timestamp: new Date(),
      note: `Order reassigned to rider ${rider.fullName} with verification OTP: ${otpCode}`
    });

    await order.save();

    // Create persistent notification for newly assigned delivery boy
    await RiderNotification.create({
      deliveryBoyId,
      title: "New Delivery Assigned! 📦",
      message: `An order (${order.orderId}) has been reassigned to you.`,
      type: "order"
    });

    // Notify newly assigned delivery boy and admin
    emitToRoom(`deliveryBoy:${deliveryBoyId}`, "order:assigned", {
      orderId: order._id,
      orderRef: order.orderId,
      message: "An order has been reassigned to you."
    });
    emitToRoom("admin:global", "order:assigned", { orderId: order._id, orderRef: order.orderId });

    res.status(200).json({
      success: true,
      message: "Delivery boy reassigned successfully",
      order
    });
  } catch (error) {
    console.error("Reassign Delivery Boy Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getOrderDeliveryStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const vendorId = req.vendor._id;

    const order = await CustomerOrder.findOne({ _id: orderId, vendorId })
      .populate("deliveryBoyId", "fullName phone vehicleDetails status accountStatus");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      deliveryStatus: order.deliveryStatus,
      deliveryOtp: order.deliveryOtp,
      deliveryLogs: order.deliveryLogs,
      deliveryBoy: order.deliveryBoyId || null
    });
  } catch (error) {
    console.error("Get Order Delivery Status Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const listActiveDeliveryBoys = async (req, res) => {
  try {
    const riders = await DeliveryBoy.find({
      status: "approved",
      accountStatus: "active"
    }).select("fullName phone vehicleDetails latitude longitude");

    // Compute activeLoad count dynamically for each rider
    const ridersWithLoad = await Promise.all(
      riders.map(async (rider) => {
        const activeLoad = await CustomerOrder.countDocuments({
          deliveryBoyId: rider._id,
          deliveryStatus: { $in: ["Assigned", "Picked_Up", "On_the_Way", "Reached_Customer"] }
        });
        return {
          ...rider.toObject(),
          activeLoad
        };
      })
    );

    res.status(200).json({
      success: true,
      riders: ridersWithLoad
    });
  } catch (error) {
    console.error("List Active Delivery Boys Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const vendorId = req.vendor._id;
    let resultOrder = null;

    await runInTransaction(async (session) => {
      const order = await CustomerOrder.findOne({ _id: orderId, vendorId })
        .populate("customerId", "fullName email phoneNumber")
        .populate("deliveryBoyId", "fullName phone")
        .session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.orderStatus !== "Pending") {
        throw new Error("Order is already accepted or processed");
      }

      order.orderStatus = "Accepted";
      await order.save({ session });

      // Sync status in the commission ledger
      await handleOrderStatusChange(order._id, "Accepted", session);
      resultOrder = order;
    });

    // Notify customer that their order was accepted
    if (resultOrder.customerId) {
      emitToRoom(`customer:${resultOrder.customerId._id || resultOrder.customerId}`, "order:accepted", {
        orderId: resultOrder._id,
        orderRef: resultOrder.orderId,
        message: "Your order has been accepted by the vendor!"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      order: resultOrder
    });
  } catch (error) {
    console.error("Accept Order Error:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};