import { useState, useMemo, useEffect } from "react";
import { useToast } from "../../components/Toast";

export default function useProductVariant(product) {
  // Gracefully handle if useToast is called outside context (though it shouldn't be)
  let showToast = () => {};
  try {
    const toastData = useToast();
    showToast = toastData.showToast;
  } catch (e) {
    // Ignore
  }
  
  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants?.[0] || null
  );

  const [selectedImage, setSelectedImage] = useState(
    product?.variants?.[0]?.images?.[0] || product?.images?.[0] || ""
  );

  useEffect(() => {
    if (product && !selectedVariant && product.variants?.length > 0) {
      setSelectedVariant(product.variants[0]);
      if (!selectedImage) {
        setSelectedImage(product.variants[0].images?.[0] || product.images?.[0] || "");
      }
    }
  }, [product]);

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setSelectedImage(variant.images?.[0] || product?.images?.[0] || "");
  };

  const computed = useMemo(() => {
    if (!product) return {};

    const currentVariant = selectedVariant || product.variants?.[0] || {};
    
    // Derived state
    const displayPrice = currentVariant.sellingPrice || product.primaryPrice;
    const displayMrp = currentVariant.mrp || product.primaryMrp;
    const displayDiscount = displayMrp && displayPrice && displayMrp > displayPrice 
      ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) 
      : product.primaryDiscount || 0;
      
    const displayVendorName = currentVariant.vendorName || product.primaryVendorName;
    const isOutOfStock = currentVariant.stockQty <= 0 || product.primaryStockStatus === "out_of_stock";
    const isLowStock = currentVariant.stockQty > 0 && currentVariant.stockQty <= 5;
    
    const packSizeLabel = currentVariant.variantLabel || (currentVariant.packSize?.value 
      ? `${currentVariant.packSize.value} ${currentVariant.packSize.unit}` 
      : product.primaryUnit || "1 Unit");

    // Clean product name logic (Bug 2)
    let cleanName = product.name;
    if (cleanName && currentVariant.variantLabel) {
      // Strip out ", 10 kg" or " - 10 kg" or similar suffixes
      const suffixes = [
        `, ${currentVariant.variantLabel}`,
        ` - ${currentVariant.variantLabel}`,
        ` ${currentVariant.variantLabel}`
      ];
      for (const suffix of suffixes) {
        if (cleanName.endsWith(suffix)) {
          cleanName = cleanName.substring(0, cleanName.length - suffix.length);
          break;
        }
      }
    }

    return {
      displayPrice,
      displayMrp,
      displayDiscount,
      displayVendorName,
      isOutOfStock,
      isLowStock,
      packSizeLabel,
      cleanName
    };
  }, [product, selectedVariant]);

  const handleAddToCart = (qty = 1) => {
    if (!product) return;
    const variant = selectedVariant || product.variants?.[0];
    if (!variant) return;

    const cartStr = localStorage.getItem("cart");
    let cart = [];
    try {
      cart = cartStr ? JSON.parse(cartStr) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch {
      cart = [];
    }

    const existingIndex = cart.findIndex((item) => item.variantId === variant._id);
    if (existingIndex > -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        variantId: variant._id,
        productId: product._id,
        name: computed.cleanName || product.name,
        brand: product.brand,
        price: computed.displayPrice,
        mrp: computed.displayMrp,
        qty: qty,
        img: variant.images?.[0] || product.images?.[0] || "https://via.placeholder.com/150",
        vendorName: computed.displayVendorName,
        vendorId: variant.vendorId || product.primaryVendorId,
        packSize: computed.packSizeLabel
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    showToast({ type: "success", message: `${qty} x ${computed.cleanName || product.name} added to cart!` });
  };

  return {
    selectedVariant,
    handleVariantChange,
    selectedImage,
    setSelectedImage,
    handleAddToCart,
    ...computed
  };
}
