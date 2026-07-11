import mongoose from "mongoose";
import CustomerOrder from "../../customer/models/CustomerOrder.js";
import DeliveryBoy from "../../deliveryBoy/models/DeliveryBoy.js";
import DeliveryBoyEarnings from "../../deliveryBoy/models/DeliveryBoyEarnings.js";

// Helper: Convert array of objects to CSV string
const convertToCSV = (data, fields) => {
  const header = fields.join(",") + "\n";
  const rows = data.map(row => {
    return fields.map(field => {
      let val = field.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : '', row);
      if (val instanceof Date) val = val.toISOString();
      if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
      return val;
    }).join(",");
  }).join("\n");
  return header + rows;
};

// 1. GET /admin/deliveries (list with filters)
export const getDeliveries = async (req, res) => {
  try {
    const { status, vendor, deliveryBoy, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { deliveryStatus: { $ne: "None" } };

    if (status) query.deliveryStatus = status;
    if (vendor) query.vendorId = vendor;
    if (deliveryBoy) query.deliveryBoyId = deliveryBoy;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skipCount = (Number(page) - 1) * Number(limit);

    const deliveries = await CustomerOrder.find(query)
      .populate("vendorId", "shopName")
      .populate("customerId", "fullName")
      .populate("deliveryBoyId", "fullName phone")
      .sort({ updatedAt: -1 })
      .skip(skipCount)
      .limit(Number(limit));

    const totalCount = await CustomerOrder.countDocuments(query);
    const totalPages = Math.ceil(totalCount / Number(limit));

    res.status(200).json({
      success: true,
      deliveries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error("Get Deliveries Admin Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. GET /admin/deliveries/:orderId (full delivery timeline)
export const getDeliveryById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await CustomerOrder.findById(orderId)
      .populate("vendorId", "shopName phone address")
      .populate("customerId", "fullName email phoneNumber")
      .populate("deliveryBoyId", "fullName phone vehicleDetails status accountStatus");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get Delivery By ID Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 3. GET /admin/delivery-logs (filterable audit log)
export const getDeliveryLogs = async (req, res) => {
  try {
    const { vendor, deliveryBoy, orderId, eventType, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const match = { deliveryStatus: { $ne: "None" } };
    if (vendor) match.vendorId = new mongoose.Types.ObjectId(vendor);
    if (deliveryBoy) match.deliveryBoyId = new mongoose.Types.ObjectId(deliveryBoy);
    if (orderId) match.orderId = orderId;

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: match },
      { $unwind: "$deliveryLogs" },
      {
        $project: {
          _id: 1,
          orderId: 1,
          vendorId: 1,
          deliveryBoyId: 1,
          log: "$deliveryLogs"
        }
      }
    ];

    // Filter by Event Type
    if (eventType) {
      if (eventType === "status_change") {
        pipeline.push({ $match: { "log.status": { $ne: "None" } } });
      } else if (eventType === "otp_verified") {
        pipeline.push({ $match: { "log.note": /verified|confirmed/i } });
      } else if (eventType === "otp_failed") {
        pipeline.push({ $match: { "log.note": /failed|invalid/i } });
      }
    }

    pipeline.push({ $sort: { "log.timestamp": -1 } });

    // For total count
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await CustomerOrder.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    // Apply pagination
    const skipCount = (Number(page) - 1) * Number(limit);
    pipeline.push({ $skip: skipCount }, { $limit: Number(limit) });

    // Populate references in aggregation
    pipeline.push(
      {
        $lookup: {
          from: "vendors",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor"
        }
      },
      {
        $lookup: {
          from: "deliveryboys",
          localField: "deliveryBoyId",
          foreignField: "_id",
          as: "rider"
        }
      },
      {
        $project: {
          orderId: 1,
          vendorName: { $arrayElemAt: ["$vendor.shopName", 0] },
          riderName: { $arrayElemAt: ["$rider.fullName", 0] },
          status: "$log.status",
          timestamp: "$log.timestamp",
          note: "$log.note"
        }
      }
    );

    const logs = await CustomerOrder.aggregate(pipeline);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error("Get Delivery Logs Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 4. GET /admin/delivery-logs/export (CSV export)
export const exportDeliveryLogs = async (req, res) => {
  try {
    const { vendor, deliveryBoy, orderId, eventType, startDate, endDate } = req.query;

    const match = { deliveryStatus: { $ne: "None" } };
    if (vendor) match.vendorId = new mongoose.Types.ObjectId(vendor);
    if (deliveryBoy) match.deliveryBoyId = new mongoose.Types.ObjectId(deliveryBoy);
    if (orderId) match.orderId = orderId;

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: match },
      { $unwind: "$deliveryLogs" },
      {
        $project: {
          _id: 1,
          orderId: 1,
          vendorId: 1,
          deliveryBoyId: 1,
          log: "$deliveryLogs"
        }
      }
    ];

    if (eventType) {
      if (eventType === "status_change") {
        pipeline.push({ $match: { "log.status": { $ne: "None" } } });
      } else if (eventType === "otp_verified") {
        pipeline.push({ $match: { "log.note": /verified|confirmed/i } });
      } else if (eventType === "otp_failed") {
        pipeline.push({ $match: { "log.note": /failed/i } });
      }
    }

    pipeline.push(
      { $sort: { "log.timestamp": -1 } },
      {
        $lookup: {
          from: "vendors",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor"
        }
      },
      {
        $lookup: {
          from: "deliveryboys",
          localField: "deliveryBoyId",
          foreignField: "_id",
          as: "rider"
        }
      },
      {
        $project: {
          orderId: 1,
          vendorName: { $arrayElemAt: ["$vendor.shopName", 0] },
          riderName: { $arrayElemAt: ["$rider.fullName", 0] },
          status: "$log.status",
          timestamp: "$log.timestamp",
          note: "$log.note"
        }
      }
    );

    const logs = await CustomerOrder.aggregate(pipeline);
    const fields = ["orderId", "vendorName", "riderName", "status", "timestamp", "note"];
    const csv = convertToCSV(logs, fields);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="delivery-logs.csv"');
    res.status(200).send(csv);
  } catch (error) {
    console.error("Export Logs Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 5. GET /admin/reports/deliveries (aggregated reports)
export const getDeliveryReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = { deliveryStatus: { $ne: "None" } };

    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    // A. Performance Leaderboard & Payout totals
    const leaderboardPipeline = [
      { $match: dateQuery },
      {
        $group: {
          _id: "$deliveryBoyId",
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$deliveryStatus", "Delivered"] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Cancelled"] }, 1, 0] }
          },
          totalEarnings: { $sum: "$deliveryCharge" }
        }
      },
      {
        $lookup: {
          from: "deliveryboys",
          localField: "_id",
          foreignField: "_id",
          as: "rider"
        }
      },
      {
        $project: {
          riderName: { $arrayElemAt: ["$rider.fullName", 0] },
          phone: { $arrayElemAt: ["$rider.phone", 0] },
          totalOrders: 1,
          completedOrders: 1,
          cancelledOrders: 1,
          totalEarnings: 1
        }
      },
      { $sort: { completedOrders: -1 } }
    ];

    const leaderboard = await CustomerOrder.aggregate(leaderboardPipeline);

    // B. Vendorwise volume
    const vendorVolumePipeline = [
      { $match: dateQuery },
      {
        $group: {
          _id: "$vendorId",
          orderCount: { $sum: 1 },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ["$deliveryStatus", "Delivered"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendor"
        }
      },
      {
        $project: {
          shopName: { $arrayElemAt: ["$vendor.shopName", 0] },
          orderCount: 1,
          deliveredCount: 1
        }
      },
      { $sort: { orderCount: -1 } }
    ];

    const vendorVolume = await CustomerOrder.aggregate(vendorVolumePipeline);

    // C. General Performance metrics: On-time vs Delayed (Threshold: 45 minutes = 2700000 ms)
    const orders = await CustomerOrder.find(dateQuery).select("deliveryLogs deliveryStatus");
    let totalCompleted = 0;
    let onTimeCount = 0;
    let delayedCount = 0;

    orders.forEach(order => {
      if (order.deliveryStatus === "Delivered") {
        totalCompleted++;
        const assignedLog = order.deliveryLogs.find(l => l.status === "Assigned");
        const deliveredLog = order.deliveryLogs.find(l => l.status === "Delivered");
        
        if (assignedLog && deliveredLog) {
          const duration = new Date(deliveredLog.timestamp) - new Date(assignedLog.timestamp);
          if (duration <= 45 * 60 * 1000) {
            onTimeCount++;
          } else {
            delayedCount++;
          }
        } else {
          onTimeCount++; // Default fallback
        }
      }
    });

    const onTimeRate = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 100;

    res.status(200).json({
      success: true,
      leaderboard,
      vendorVolume,
      metrics: {
        totalCompleted,
        onTimeCount,
        delayedCount,
        onTimeRate
      }
    });
  } catch (error) {
    console.error("Get Delivery Reports Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 6. GET /admin/reports/deliveries/export
export const exportDeliveryReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = { deliveryStatus: { $ne: "None" } };

    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const leaderboardPipeline = [
      { $match: dateQuery },
      {
        $group: {
          _id: "$deliveryBoyId",
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$deliveryStatus", "Delivered"] }, 1, 0] }
          },
          totalEarnings: { $sum: "$deliveryCharge" }
        }
      },
      {
        $lookup: {
          from: "deliveryboys",
          localField: "_id",
          foreignField: "_id",
          as: "rider"
        }
      },
      {
        $project: {
          riderName: { $arrayElemAt: ["$rider.fullName", 0] },
          phone: { $arrayElemAt: ["$rider.phone", 0] },
          totalOrders: 1,
          completedOrders: 1,
          totalEarnings: 1
        }
      },
      { $sort: { completedOrders: -1 } }
    ];

    const report = await CustomerOrder.aggregate(leaderboardPipeline);
    const fields = ["riderName", "phone", "totalOrders", "completedOrders", "totalEarnings"];
    const csv = convertToCSV(report, fields);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="delivery-boy-performance-report.csv"');
    res.status(200).send(csv);
  } catch (error) {
    console.error("Export Reports Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 7. GET /admin/delivery-boys (list with performance summary)
export const getDeliveryBoys = async (req, res) => {
  try {
    const riders = await DeliveryBoy.find({ status: "approved" }).sort({ createdAt: -1 });

    const ridersWithStats = await Promise.all(
      riders.map(async (rider) => {
        const completedCount = await CustomerOrder.countDocuments({
          deliveryBoyId: rider._id,
          deliveryStatus: "Delivered"
        });

        const activeCount = await CustomerOrder.countDocuments({
          deliveryBoyId: rider._id,
          deliveryStatus: { $in: ["Assigned", "Picked_Up", "On_the_Way", "Reached_Customer"] }
        });

        const earningsDoc = await DeliveryBoyEarnings.findOne({ deliveryBoyId: rider._id });

        return {
          _id: rider._id,
          fullName: rider.fullName,
          phone: rider.phone,
          vehicleDetails: rider.vehicleDetails,
          accountStatus: rider.accountStatus,
          status: rider.status,
          completedDeliveries: completedCount,
          activeDeliveries: activeCount,
          walletBalance: earningsDoc?.walletBalance || 0
        };
      })
    );

    res.status(200).json({
      success: true,
      riders: ridersWithStats
    });
  } catch (error) {
    console.error("Get Admin Delivery Boys Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 8. GET /admin/delivery-boys/:id (profile + history)
export const getDeliveryBoyById = async (req, res) => {
  try {
    const { id } = req.params;
    const rider = await DeliveryBoy.findById(id);
    
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    const earnings = await DeliveryBoyEarnings.findOne({ deliveryBoyId: id }) || { walletBalance: 0, totalEarnings: 0 };

    const history = await CustomerOrder.find({ deliveryBoyId: id })
      .populate("vendorId", "shopName")
      .populate("customerId", "fullName")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      rider,
      earnings,
      history
    });
  } catch (error) {
    console.error("Get Rider Detail Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 9. PUT /admin/delivery-boys/:id/status (activate/suspend)
export const updateDeliveryBoyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body; // 'active' or 'suspended'

    if (!["active", "suspended"].includes(accountStatus)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const rider = await DeliveryBoy.findByIdAndUpdate(
      id,
      { accountStatus },
      { new: true }
    );

    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    res.status(200).json({
      success: true,
      message: `Rider account has been ${accountStatus === "active" ? "activated" : "suspended"} successfully.`,
      rider
    });
  } catch (error) {
    console.error("Update Rider Status Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
