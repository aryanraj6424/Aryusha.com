import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import {
  getDeliveries,
  getDeliveryById,
  getDeliveryLogs,
  exportDeliveryLogs,
  getDeliveryReports,
  exportDeliveryReports,
  getDeliveryBoys,
  getDeliveryBoyById,
  updateDeliveryBoyStatus
} from "../controllers/adminDeliveryController.js";

const router = express.Router();

// Enforce protectAdmin session check on all routes in this file
router.use(protectAdmin);

router.get("/deliveries", getDeliveries);
router.get("/deliveries/:orderId", getDeliveryById);
router.get("/delivery-logs", getDeliveryLogs);
router.get("/delivery-logs/export", exportDeliveryLogs);
router.get("/reports/deliveries", getDeliveryReports);
router.get("/reports/deliveries/export", exportDeliveryReports);
router.get("/delivery-boys", getDeliveryBoys);
router.get("/delivery-boys/:id", getDeliveryBoyById);
router.put("/delivery-boys/:id/status", updateDeliveryBoyStatus);

export default router;
