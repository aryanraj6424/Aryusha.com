import express from "express";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  approveProduct,
  rejectProduct,
  hideProduct,
  restoreProduct,
  bulkDeleteProducts,
  bulkUpdateProducts,
  importProducts,
  exportProducts
} from "../controllers/productController.js";

const router = express.Router();

router.use(protectAdmin);

// Bulk operations & files import/export
router.post("/bulk-delete", bulkDeleteProducts);
router.post("/bulk-update", bulkUpdateProducts);
router.post("/import", importProducts);
router.get("/export", exportProducts);

// Standard CRUD
router.get("/all", getProducts);
router.get("/:id", getProduct);
router.post("/create", createProduct);
router.put("/update/:id", updateProduct);
router.delete("/delete/:id", deleteProduct);

// Approvals & visibility controls
router.put("/approve/:id", protectAdmin, approveProduct);
router.put("/reject/:id", protectAdmin, rejectProduct);
router.put("/hide/:id", hideProduct);
router.put("/restore/:id", restoreProduct);

export default router;
