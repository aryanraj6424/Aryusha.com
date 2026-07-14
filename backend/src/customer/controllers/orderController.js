import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import CustomerOrder from "../models/CustomerOrder.js";
import Invoice from "../models/Invoice.js";
import { VendorListing, VendorProduct, ProductVariant } from "../../models/catalog.js";
import { calculateOrderFees } from "../../utils/feeCalculator.js";
import { calculateVendorOrderCommission } from "../../utils/commissionCalculator.js";

// Helper: Generate unique IDs
const generateUniqueId = async (prefix, Model, field) => {
  let unique = false;
  let id = "";
  while (!unique) {
    id = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await Model.findOne({ [field]: id });
    if (!existing) unique = true;
  }
  return id;
};

// @desc    Place a new order (Customer side only)
// @route   POST /api/customer/orders
// @access  Public (Customer)
export const placeOrder = async (req, res) => {
  try {
    const {
      customerId,
      vendorId,
      items,
      deliveryAddress,
      totalAmount,
      deliveryCharge,
      taxAmount,
      grandTotal,
      couponCode,
      couponDiscount,
      paymentMethod,
      deliverySlot,
      customerLiveLocation,
      locationUnavailable,
    } = req.body;

    if (!customerId || !vendorId || !items || items.length === 0 || !deliveryAddress) {
      return res.status(400).json({ success: false, message: "Missing required order fields." });
    }

    // 1. Prevent duplicate/double order submission (within 15 seconds window)
    const duplicateWindow = new Date(Date.now() - 15 * 1000);
    const potentialDuplicate = await CustomerOrder.findOne({
      customerId,
      grandTotal,
      createdAt: { $gte: duplicateWindow },
    });

    if (potentialDuplicate) {
      return res.status(400).json({
        success: false,
        message: "Duplicate order submission detected. Please wait 15 seconds.",
      });
    }

    // 2. Validate stock availability for each item and decrement stock
    const operationsToExecute = [];
    for (const item of items) {
      // Check standard VendorListing first
      const listing = await VendorListing.findOne({
        vendorId,
        variantId: item.variantId,
      });

      if (listing) {
        if (listing.stock.quantity < item.qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for variant "${item.name}". Available: ${listing.stock.quantity}, requested: ${item.qty}`,
          });
        }
        operationsToExecute.push({
          type: "listing",
          query: { vendorId, variantId: item.variantId },
          update: { $inc: { "stock.quantity": -item.qty } },
        });
      } else {
        // Fallback: Check VendorProduct link
        const vpLink = await VendorProduct.findOne({
          vendorId,
          masterProductId: item.productId,
        });

        if (vpLink) {
          if (vpLink.stock < item.qty) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for product "${item.name}". Available: ${vpLink.stock}, requested: ${item.qty}`,
            });
          }
          operationsToExecute.push({
            type: "vendorProduct",
            query: { vendorId, masterProductId: item.productId },
            update: { $inc: { stock: -item.qty } },
          });
        } else {
          return res.status(400).json({
            success: false,
            message: `Product variant "${item.name}" is not listed by this vendor.`,
          });
        }
      }
    }

    // Execute stock decrements
    for (const op of operationsToExecute) {
      if (op.type === "listing") {
        await VendorListing.updateOne(op.query, op.update);
      } else if (op.type === "vendorProduct") {
        await VendorProduct.updateOne(op.query, op.update);
      }
    }

    // 3. Generate Unique Order ID
    const orderId = await generateUniqueId("QK", CustomerOrder, "orderId");

    // 4. Create the CustomerOrder record
    // 3.5 Recalculate fees server-side based on customer city/zone and total
    const zoneId = deliveryAddress.city || "";
    const { breakdown, totalFees } = await calculateOrderFees(totalAmount, zoneId);

    const finalHandlingFee = breakdown.find(f => f.feeType === "handling")?.amount || 0;
    const finalSmallCartFee = breakdown.find(f => f.feeType === "small_cart")?.amount || 0;
    const finalDeliveryFee = breakdown.find(f => f.feeType === "delivery_partner")?.amount || 0;
    const finalGst = breakdown.find(f => f.feeType === "gst")?.amount || 0;
    const finalRainFee = breakdown.find(f => f.feeType === "rain")?.amount || 0;

    const totalCalculatedFees = finalHandlingFee + finalSmallCartFee + finalDeliveryFee + finalGst + finalRainFee;
    const finalGrandTotal = Math.max(0, totalAmount - couponDiscount + totalCalculatedFees);

    // Calculate and lock the commission at order time
    const commissionDetails = await calculateVendorOrderCommission({ items }, vendorId);

    // 4. Create the CustomerOrder record
    const order = await CustomerOrder.create({
      orderId,
      customerId,
      vendorId,
      items,
      totalAmount,
      deliveryCharge: finalDeliveryFee,
      taxAmount: finalGst,
      handlingFee: finalHandlingFee,
      smallCartFee: finalSmallCartFee,
      rainFee: finalRainFee,
      feeBreakdown: breakdown.map(f => ({ feeType: f.feeType, label: f.label, amount: f.amount })),
      grandTotal: finalGrandTotal,
      couponCode: couponCode || null,
      couponDiscount: couponDiscount || 0,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentMethod === "Online" ? "Paid" : "Pending",
      orderStatus: "Pending",
      deliveryAddress,
      deliverySlot: deliverySlot || null,
      customerLiveLocation: customerLiveLocation || null,
      locationUnavailable: locationUnavailable || false,
      vendorCommission: {
        rate: commissionDetails.rate,
        commissionType: commissionDetails.type,
        amount: commissionDetails.commissionAmount,
        calculatedAt: new Date()
      }
    });

    if (couponCode) {
      // Lazy load/lookup the Coupon model to update its usage count
      const Coupon = mongoose.model("Coupon");
      await Coupon.updateOne(
        { code: couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    // Clean cart notification/confirmation simulation
    console.log(`Notification sent to Customer ${customerId}: Order ${orderId} placed successfully!`);

    const orderObj = order.toObject();
    delete orderObj.vendorCommission;

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: orderObj,
    });
  } catch (error) {
    console.error("Order placement failure:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders for a customer user
// @route   GET /api/customer/orders/user/:userId
// @access  Public (Customer)
export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await CustomerOrder.find({ customerId: req.params.userId })
      .select("-vendorCommission")
      .populate("vendorId", "shopName phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Fetch orders failure:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order details (tracking page)
// @route   GET /api/customer/orders/:id
// @access  Public (Customer)
export const getOrderById = async (req, res) => {
  try {
    const order = await CustomerOrder.findById(req.params.id)
      .select("-vendorCommission")
      .populate("vendorId", "shopName phone address")
      .populate("customerId", "fullName phoneNumber email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Fetch order details failure:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download PDF invoice for delivered orders
// @route   GET /api/customer/orders/:id/invoice
// @access  Public (Customer)
export const downloadInvoice = async (req, res) => {
  try {
    const order = await CustomerOrder.findById(req.params.id)
      .populate("vendorId", "shopName phone address")
      .populate("customerId", "fullName phoneNumber");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Invoice download is only available for delivered orders.",
      });
    }

    // Resolve or create Invoice record
    let invoice = await Invoice.findOne({ orderId: order._id });
    if (!invoice) {
      const invoiceId = await generateUniqueId("INV", Invoice, "invoiceId");
      invoice = await Invoice.create({
        invoiceId,
        orderId: order._id,
        customerId: order.customerId._id,
        vendorId: order.vendorId._id,
        totalAmount: order.grandTotal,
      });
    }

    // Generate PDF document in-memory and stream
    const doc = new PDFDocument({ margin: 50 });

    // Set Response Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order.orderId}.pdf`
    );

    doc.pipe(res);

    // Document Header
    doc
      .fillColor("#4f46e5")
      .fontSize(20)
      .text("QUICKKART INVOICE", { align: "right" })
      .fillColor("#475569")
      .fontSize(10)
      .text(`Invoice ID: ${invoice.invoiceId}`, { align: "right" })
      .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, { align: "right" })
      .moveDown(1);

    // Vendor and Customer Info Section
    doc
      .fontSize(12)
      .fillColor("#1e293b")
      .text("Fulfillment Partner (Seller):", { underline: true })
      .fontSize(10)
      .fillColor("#475569")
      .text(order.vendorId?.shopName || "Registered Partner")
      .text(`Phone: ${order.vendorId?.phone || "N/A"}`)
      .moveDown(1);

    doc
      .fontSize(12)
      .fillColor("#1e293b")
      .text("Delivered To (Buyer):", { underline: true })
      .fontSize(10)
      .fillColor("#475569")
      .text(order.deliveryAddress?.fullName)
      .text(`Phone: ${order.deliveryAddress?.phoneNumber}`)
      .text(
        `Address: ${order.deliveryAddress?.houseNo}, ${order.deliveryAddress?.area}, ${order.deliveryAddress?.city}, ${order.deliveryAddress?.state} - ${order.deliveryAddress?.pincode}`
      )
      .moveDown(1.5);

    // Items Table Header
    const tableTop = 270;
    doc
      .fontSize(10)
      .fillColor("#1e293b")
      .text("Item Name", 50, tableTop)
      .text("Unit Price", 250, tableTop, { width: 90, align: "right" })
      .text("Qty", 350, tableTop, { width: 50, align: "right" })
      .text("Total Price", 420, tableTop, { width: 100, align: "right" });

    // Draw horizontal separator
    doc
      .strokeColor("#cbd5e1")
      .lineWidth(1)
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Items List
    let currentY = tableTop + 25;
    order.items.forEach((item) => {
      doc
        .fillColor("#475569")
        .text(item.name, 50, currentY, { width: 190 })
        .text(`₹${item.price.toFixed(2)}`, 250, currentY, { width: 90, align: "right" })
        .text(item.qty.toString(), 350, currentY, { width: 50, align: "right" })
        .text(`₹${(item.price * item.qty).toFixed(2)}`, 420, currentY, { width: 100, align: "right" });

      currentY += 20;
    });

    // Draw separator
    doc
      .strokeColor("#cbd5e1")
      .lineWidth(1)
      .moveTo(50, currentY + 5)
      .lineTo(550, currentY + 5)
      .stroke();

    currentY += 15;

    // Totals Section
    doc
      .fontSize(10)
      .fillColor("#475569")
      .text("Subtotal:", 320, currentY, { width: 100, align: "right" })
      .text(`₹${order.totalAmount.toFixed(2)}`, 420, currentY, { width: 100, align: "right" });

    currentY += 15;

    doc
      .text("Delivery Charge:", 320, currentY, { width: 100, align: "right" })
      .text(`₹${order.deliveryCharge.toFixed(2)}`, 420, currentY, { width: 100, align: "right" });

    currentY += 15;

    doc
      .text("Tax Amount (GST):", 320, currentY, { width: 100, align: "right" })
      .text(`₹${order.taxAmount.toFixed(2)}`, 420, currentY, { width: 100, align: "right" });

    currentY += 20;

    doc
      .fontSize(12)
      .fillColor("#1e293b")
      .text("Grand Total:", 320, currentY, { width: 100, align: "right" })
      .text(`₹${order.grandTotal.toFixed(2)}`, 420, currentY, { width: 100, align: "right" });

    currentY += 30;

    // Payment details
    doc
      .fontSize(10)
      .fillColor("#475569")
      .text(`Payment Method: ${order.paymentMethod} (Cash on Delivery)`, 50, currentY)
      .text(`Payment Status: Paid`, 50, currentY + 15);

    // Thank you message
    doc
      .moveDown(4)
      .fontSize(12)
      .fillColor("#4f46e5")
      .text("Thank you for shopping with QuickCart! 🚀", { align: "center" });

    // End Document Stream
    doc.end();
  } catch (error) {
    console.error("PDF Invoice download failure:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order live tracking details
// @route   GET /api/customer/orders/:id/tracking
// @access  Protected (Customer)
export const getOrderTracking = async (req, res) => {
  try {
    const order = await CustomerOrder.findById(req.params.id)
      .populate("deliveryBoyId", "fullName phone latitude longitude");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Ownership check
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access to order tracking." });
    }

    // Dynamic ETA calculation if active
    let eta = null;
    if (["On_the_Way", "Reached_Customer"].includes(order.deliveryStatus)) {
      eta = "12-15 Mins";
    } else if (order.deliveryStatus === "Assigned" || order.deliveryStatus === "Picked_Up") {
      eta = "20-25 Mins";
    }

    res.status(200).json({
      success: true,
      tracking: {
        orderId: order.orderId,
        deliveryStatus: order.deliveryStatus,
        orderStatus: order.orderStatus,
        deliveryAddress: order.deliveryAddress,
        liveTracking: order.liveTracking !== false, // default to true
        eta,
        deliveryOtp: order.deliveryOtp,
        deliveryBoy: order.deliveryBoyId ? {
          fullName: order.deliveryBoyId.fullName,
          phone: order.deliveryBoyId.phone,
          rating: 4.8, // Mock rating
          latitude: order.deliveryBoyId.latitude,
          longitude: order.deliveryBoyId.longitude
        } : null,
        deliveryLogs: order.deliveryLogs,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error("Order tracking fetch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order delivery OTP
// @route   GET /api/customer/orders/:id/otp
// @access  Protected (Customer)
export const getOrderOtp = async (req, res) => {
  try {
    const order = await CustomerOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Ownership check
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access to OTP." });
    }

    res.status(200).json({
      success: true,
      otp: order.deliveryOtp
    });
  } catch (error) {
    console.error("Fetch OTP error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rate an order
// @route   PUT /api/customer/orders/:id/rate
// @access  Private (Customer)
export const rateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const order = await CustomerOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Enforce owner check
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to rate this order." });
    }

    order.rating = rating;
    order.ratingFeedback = feedback || "";
    await order.save();

    res.status(200).json({ success: true, message: "Thank you for rating the order!" });
  } catch (error) {
    console.error("Error rating order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
