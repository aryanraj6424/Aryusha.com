import { Product, VendorProduct } from "../../models/catalog.js";

/**
 * ============================================================================
 * Vendor Product Reference Controller
 * ============================================================================
 * Enables vendors to search the master product catalog and link existing
 * master products to their store rather than creating duplicate catalog entries.
 * ============================================================================
 */

// @desc    Search master catalog products not yet linked to this vendor
// @route   GET /api/vendor/products/search
// @access  Private/Vendor
export const searchMasterProducts = async (req, res) => {
  try {
    const { query } = req.query;
    const vendorId = req.vendor._id;

    // 1. Get IDs of products already linked to this vendor
    const linkedReferences = await VendorProduct.find({ vendorId })
      .select("masterProductId");
    
    const linkedProductIds = linkedReferences.map(r => r.masterProductId);

    // 2. Query products: must be created by Admin or be approved vendor products,
    //    and not yet linked by this vendor
    const searchFilter = {
      _id: { $nin: linkedProductIds },
      isDeleted: { $ne: true },
      $or: [
        { creatorModel: "Admin" },
        { status: "approved" }
      ]
    };

    // 3. Apply search query
    if (query && query.trim()) {
      const regex = new RegExp(query.trim(), "i");
      searchFilter.$and = [
        {
          $or: [
            { name: regex },
            { brand: regex }
          ]
        }
      ];
    }

    const products = await Product.find(searchFilter)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .populate("familyId", "name")
      .populate("variants")
      .limit(30);

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create vendor product reference (link existing master product)
// @route   POST /api/vendor/products
// @access  Private/Vendor
export const createVendorProductReference = async (req, res) => {
  try {
    const { masterProductId, price, mrp, stock, sku, condition, vendorNotes } = req.body;
    const vendorId = req.vendor._id;

    if (!masterProductId || !price || !sku) {
      return res.status(400).json({ success: false, message: "masterProductId, price, and sku are required" });
    }

    if (mrp && Number(price) > Number(mrp)) {
      return res.status(400).json({ success: false, message: "Selling price cannot exceed MRP" });
    }

    // 1. Verify master product exists and is active/approved
    const product = await Product.findOne({ _id: masterProductId, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Master product not found or is inactive" });
    }

    // 2. Ensure it is not already linked
    const existingLink = await VendorProduct.findOne({ vendorId, masterProductId });
    if (existingLink) {
      return res.status(400).json({ success: false, message: "This product is already linked to your store" });
    }

    // 3. Create the reference entry
    const link = await VendorProduct.create({
      masterProductId,
      vendorId,
      price: Number(price),
      mrp: mrp ? Number(mrp) : null,
      stock: Number(stock || 0),
      sku: sku.trim(),
      condition: condition || "New",
      vendorNotes: vendorNotes || ""
    });

    const populated = await VendorProduct.findById(link._id)
      .populate({
        path: "masterProductId",
        populate: [
          { path: "categoryId", select: "name" },
          { path: "subCategoryId", select: "name" },
          { path: "familyId", select: "name" }
        ]
      });

    res.status(201).json({ success: true, message: "Product linked to store successfully", vendorProduct: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all master products linked to this vendor
// @route   GET /api/vendor/products/my-links
// @access  Private/Vendor
export const getMyLinkedProducts = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const linked = await VendorProduct.find({ vendorId })
      .populate({
        path: "masterProductId",
        populate: [
          { path: "categoryId", select: "name" },
          { path: "subCategoryId", select: "name" },
          { path: "familyId", select: "name" }
        ]
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, linked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update linked product details (price, stock, notes)
// @route   PUT /api/vendor/products/link/:id
// @access  Private/Vendor
export const updateLinkedProductDetails = async (req, res) => {
  try {
    const { price, mrp, stock, sku, condition, vendorNotes } = req.body;
    const vendorId = req.vendor._id;

    const link = await VendorProduct.findOne({ _id: req.params.id, vendorId });
    if (!link) {
      return res.status(404).json({ success: false, message: "Linked product reference not found" });
    }

    // Validate price vs MRP relation
    const targetPrice = price !== undefined ? Number(price) : link.price;
    const targetMrp = mrp !== undefined ? (mrp ? Number(mrp) : null) : link.mrp;
    if (targetMrp && targetPrice > targetMrp) {
      return res.status(400).json({ success: false, message: "Selling price cannot exceed MRP" });
    }

    if (price !== undefined) link.price = Number(price);
    if (mrp !== undefined) link.mrp = mrp ? Number(mrp) : null;
    if (stock !== undefined) link.stock = Number(stock);
    if (sku !== undefined) link.sku = sku.trim();
    if (condition !== undefined) link.condition = condition;
    if (vendorNotes !== undefined) link.vendorNotes = vendorNotes;

    await link.save();
    res.json({ success: true, message: "Linked product updated successfully", vendorProduct: link });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unlink a master product from vendor's store
// @route   DELETE /api/vendor/products/link/:id
// @access  Private/Vendor
export const unlinkProductFromStore = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const link = await VendorProduct.findOne({ _id: req.params.id, vendorId });
    if (!link) {
      return res.status(404).json({ success: false, message: "Linked product reference not found" });
    }

    await VendorProduct.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Product unlinked successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
