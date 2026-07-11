import express from "express";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/imageUpload.js";

const router = express.Router();

// Upload endpoint
router.post("/", uploadMiddleware.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const folder = req.body.folder || req.query.folder || "general";
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully to Cloudinary",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload route error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image to Cloudinary",
    });
  }
});

// Delete endpoint
router.post("/delete", async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ success: false, message: "public_id is required" });
    }

    await deleteFromCloudinary(public_id);

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully from Cloudinary",
    });
  } catch (error) {
    console.error("Delete route error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete image from Cloudinary",
    });
  }
});

export default router;
