import {
  Product,
  ProductFamily,
  Category,
  SubCategory,
  ProductVariant,
  VendorListing
} from "../../models/catalog.js";

// ============================================================================
// GET ALL PRODUCTS (with search & filters)
// ============================================================================
export const getProducts = async (req, res) => {
  try {
    const { 
      search, categoryId, subCategoryId, familyId, brand, status, 
      stockStatus, startDate, endDate, creatorModel, createdBy 
    } = req.query;

    let query = { isDeleted: { $ne: true } };

    // Hierarchy Filters
    if (categoryId && categoryId !== "all") query.categoryId = categoryId;
    if (subCategoryId && subCategoryId !== "all") query.subCategoryId = subCategoryId;
    if (familyId && familyId !== "all") query.familyId = familyId;
    if (brand && brand !== "all") query.brand = brand;
    if (status && status !== "all") query.status = status;
    if (creatorModel) query.creatorModel = creatorModel;
    if (createdBy) query.createdBy = createdBy;

    // Date Filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // SKU / Barcode / Name / Brand Search
    if (search) {
      // Find variant IDs matching SKU or Barcode
      const matchingVariants = await ProductVariant.find({
        $or: [
          { sku: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } }
        ]
      }).select("productId");
      
      const variantProductIds = matchingVariants.map(v => v.productId);

      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { _id: { $in: variantProductIds } }
      ];
    }

    // Stock Status Filter
    if (stockStatus && stockStatus !== "all") {
      let listQuery = {};
      if (stockStatus === "out_of_stock") {
        listQuery = { "stock.quantity": 0 };
      } else if (stockStatus === "low_stock") {
        listQuery = { $expr: { $lte: ["$stock.quantity", "$stock.lowStockThreshold"] }, "stock.quantity": { $gt: 0 } };
      } else if (stockStatus === "in_stock") {
        listQuery = { "stock.quantity": { $gt: 0 } };
      }
      
      const matchingListings = await VendorListing.find(listQuery).select("variantId");
      const variantIds = matchingListings.map(l => l.variantId);
      
      const matchingVariants = await ProductVariant.find({ _id: { $in: variantIds } }).select("productId");
      const productIds = matchingVariants.map(v => v.productId);
      
      query._id = { $in: productIds };
    }

    const products = await Product.find(query)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .populate("familyId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// GET SINGLE PRODUCT
// ============================================================================
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .populate("familyId", "name")
      .populate("variants");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// CREATE PRODUCT
// ============================================================================
export const createProduct = async (req, res) => {
  try {
    const {
      categoryId,
      subCategoryId,
      familyId,
      name,
      brand,
      description,
      images,
      unitType,
      status,
      mrp,
      sellingPrice,
      sku
    } = req.body;

    if (!categoryId || !subCategoryId || !familyId || !name || !unitType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: Category, Sub Category, Product Family, Name, Unit Type",
      });
    }

    const normalizedUnitType = String(unitType).toLowerCase();
    if (!['weight', 'volume', 'count'].includes(normalizedUnitType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Unit Type. Must be Weight, Volume, or Count.",
      });
    }

    const category = await Category.findOne({ _id: categoryId, isDeleted: { $ne: true } });
    if (!category) return res.status(400).json({ success: false, message: "Invalid Category" });

    const subCategory = await SubCategory.findOne({ _id: subCategoryId, isDeleted: { $ne: true } });
    if (!subCategory) return res.status(400).json({ success: false, message: "Invalid Sub Category" });

    const family = await ProductFamily.findOne({ _id: familyId, isDeleted: { $ne: true } });
    if (!family) return res.status(400).json({ success: false, message: "Invalid Product Family" });

    // Check name duplication under family
    const exists = await Product.findOne({ familyId, name: name.trim(), isDeleted: { $ne: true } });
    if (exists) {
      return res.status(400).json({ success: false, message: "Product name already exists in this family" });
    }

    // Determine creator
    const creatorId = req.admin?._id || req.vendor?._id;
    const creatorModel = req.admin ? "Admin" : "Vendor";
    const initialStatus = req.admin ? (status || "active") : "pending";

    const product = await Product.create({
      categoryId,
      subCategoryId,
      familyId,
      name: name.trim(),
      brand,
      description,
      images: Array.isArray(images) ? images : [],
      unitType: normalizedUnitType,
      status: initialStatus,
      createdBy: creatorId,
      creatorModel,
      approvalHistory: [
        {
          status: initialStatus,
          updatedBy: creatorId,
          remarks: req.admin ? "Created by Admin" : "Created by Vendor (Submitted for approval)",
          updatedAt: new Date()
        }
      ]
    });

    // Create default variant if pricing information is passed
    if (mrp && sellingPrice) {
      const label = normalizedUnitType === 'weight' ? '1 kg' : normalizedUnitType === 'volume' ? '1 L' : '1 pcs';
      await ProductVariant.create({
        productId: product._id,
        variantLabel: label,
        packSize: { value: 1, unit: normalizedUnitType === 'weight' ? 'kg' : normalizedUnitType === 'volume' ? 'l' : 'pcs' },
        sku: sku || `SKU-${product.name.substring(0, 3).toUpperCase()}-${Date.now()}`,
        mrp: Number(mrp),
        basePrice: Number(sellingPrice),
        status: 'active',
        createdBy: creatorId
      });
    }

    const populated = await Product.findById(product._id)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .populate("familyId", "name")
      .populate("variants");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populated,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// UPDATE PRODUCT
// ============================================================================
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Vendor lock
    if (req.vendor && (product.creatorModel !== "Vendor" || product.createdBy.toString() !== req.vendor._id.toString())) {
      return res.status(403).json({ success: false, message: "Access Denied: You cannot modify this product" });
    }

    const {
      name,
      brand,
      categoryId,
      subCategoryId,
      familyId,
      unitType,
      description,
      images,
      status
    } = req.body;

    if (name) product.name = name;
    if (brand) product.brand = brand;
    if (categoryId) product.categoryId = categoryId;
    if (subCategoryId) product.subCategoryId = subCategoryId;
    if (familyId) product.familyId = familyId;
    if (unitType) {
      const normalizedUnit = String(unitType).toLowerCase();
      if (['weight', 'volume', 'count'].includes(normalizedUnit)) {
        product.unitType = normalizedUnit;
      }
    }
    if (description !== undefined) product.description = description;
    if (images) product.images = images;
    
    // Status update
    if (status) {
      if (req.vendor) {
        // Vendor changes trigger pending re-verification
        product.status = "pending";
        product.approvalHistory.push({
          status: "pending",
          updatedBy: req.vendor._id,
          remarks: "Re-submitted due to vendor modifications",
          updatedAt: new Date()
        });
      } else {
        product.status = status;
      }
    }

    await product.save();

    const populated = await Product.findById(product._id)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .populate("familyId", "name")
      .populate("variants");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: populated,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// DELETE PRODUCT (soft delete)
// ============================================================================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Vendor lock
    if (req.vendor && (product.creatorModel !== "Vendor" || product.createdBy.toString() !== req.vendor._id.toString())) {
      return res.status(403).json({ success: false, message: "Access Denied: You cannot delete this product" });
    }

    product.isDeleted = true;
    product.status = "inactive";
    await product.save();

    // Mark variants as inactive
    await ProductVariant.updateMany({ productId: product._id }, { status: "inactive" });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully (soft deleted)",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================================
// APPROVE / REJECT PRODUCT
// ============================================================================
export const approveProduct = async (req, res) => {
  try {
    const { remarks } = req.body;
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.status = "active";
    product.approvalHistory.push({
      status: "approved",
      updatedBy: req.admin._id,
      remarks: remarks || "Approved by Admin",
      updatedAt: new Date()
    });

    await product.save();
    res.json({ success: true, message: "Product approved successfully", product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectProduct = async (req, res) => {
  try {
    const { remarks } = req.body;
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.status = "rejected";
    product.approvalHistory.push({
      status: "rejected",
      updatedBy: req.admin._id,
      remarks: remarks || "Rejected by Admin",
      updatedAt: new Date()
    });

    await product.save();
    res.json({ success: true, message: "Product rejected successfully", product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// HIDE / RESTORE PRODUCT
// ============================================================================
export const hideProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.status = "hidden";
    await product.save();
    res.json({ success: true, message: "Product hidden successfully", product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.status = "active";
    await product.save();
    res.json({ success: true, message: "Product restored to active list", product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================
export const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: "Product IDs array is required" });
    }

    // Soft delete matching products
    await Product.updateMany({ _id: { $in: productIds } }, { isDeleted: true, status: "inactive" });
    await ProductVariant.updateMany({ productId: { $in: productIds } }, { status: "inactive" });

    res.json({ success: true, message: "Products soft-deleted in bulk successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updateData } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0 || !updateData) {
      return res.status(400).json({ success: false, message: "Product IDs and update data are required" });
    }

    await Product.updateMany({ _id: { $in: productIds } }, { $set: updateData });
    res.json({ success: true, message: "Products updated in bulk successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// IMPORT & EXPORT
// ============================================================================
export const importProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: "Invalid payload: array of products expected" });
    }

    const importedCount = [];
    for (const item of products) {
      // Find hierarchy elements
      const cat = await Category.findOne({ name: item.category, isDeleted: { $ne: true } });
      const sub = await SubCategory.findOne({ name: item.subCategory, isDeleted: { $ne: true } });
      const fam = await ProductFamily.findOne({ name: item.productFamily, isDeleted: { $ne: true } });

      if (!cat || !sub || !fam) continue; // Skip invalid records

      // Check name duplication under family
      const exists = await Product.findOne({ familyId: fam._id, name: item.name.trim(), isDeleted: { $ne: true } });
      if (exists) continue;

      const newProd = await Product.create({
        categoryId: cat._id,
        subCategoryId: sub._id,
        familyId: fam._id,
        name: item.name.trim(),
        brand: item.brand,
        description: item.description,
        unitType: item.unitType || "weight",
        status: "active",
        createdBy: req.admin?._id,
        creatorModel: "Admin"
      });

      // Default variant
      await ProductVariant.create({
        productId: newProd._id,
        variantLabel: item.variantLabel || "1 kg",
        packSize: { value: 1, unit: item.unitType === 'weight' ? 'kg' : item.unitType === 'volume' ? 'l' : 'pcs' },
        sku: item.sku || `SKU-${newProd.name.substring(0, 3).toUpperCase()}-${Date.now()}`,
        mrp: Number(item.mrp) || 100,
        basePrice: Number(item.sellingPrice) || 90,
        status: 'active',
        createdBy: req.admin?._id
      });

      importedCount.push(newProd._id);
    }

    res.json({ success: true, message: `Import completed. ${importedCount.length} products loaded successfully.`, importedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: { $ne: true } })
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .populate("familyId", "name")
      .populate("variants");

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};