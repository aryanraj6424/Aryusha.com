import express from "express";
import { protectVendor } from "../middleware/vendorAuthMiddleware.js";
import {
  searchMasterProducts,
  createVendorProductReference,
  getMyLinkedProducts,
  updateLinkedProductDetails,
  unlinkProductFromStore
} from "../controllers/vendorProductsController.js";

const router = express.Router();

router.use(protectVendor);

// Linked Master Products CRUD
router.get("/search", searchMasterProducts);
router.post("/", createVendorProductReference);
router.get("/my-links", getMyLinkedProducts);
router.put("/link/:id", updateLinkedProductDetails);
router.delete("/link/:id", unlinkProductFromStore);

export default router;
