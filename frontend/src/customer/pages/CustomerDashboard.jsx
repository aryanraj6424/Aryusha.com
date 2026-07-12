import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import HeroBanner from "../components/home/HeroBanner";
import CategorySection from "../components/home/CategorySection";
import TrendingProducts from "../components/home/TrendingProducts";
import ComingSoon from "../components/location/ComingSoon";

function CustomerDashboard() {
  const [address, setAddress] = useState(null);
  const [products, setProducts] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [nearestVendor, setNearestVendor] = useState(null);

  // Search parameters for filters (URL search is the single source of truth)
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || "";

  // Remaining filter states (kept to maintain downstream structures safely)
  const [subCategory, setSubCategory] = useState("all");
  const [productFamily, setProductFamily] = useState("all");
  const [brand, setBrand] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("all");

  // Lists populated for filters/selections
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [familiesList, setFamiliesList] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);

  // 1. Fetch current browser coordinates automatically if selectedAddress is not set in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("selectedAddress");
    if (!stored && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newAddress = {
            latitude,
            longitude,
            fullAddress: "Current Location",
            pincode: ""
          };
          localStorage.setItem("selectedAddress", JSON.stringify(newAddress));
          setAddress(newAddress);
        },
        (error) => {
          console.error("Error fetching automatic customer coordinates:", error);
        }
      );
    }
  }, []);

  // 2. Monitor localStorage location changes
  useEffect(() => {
    const checkAddress = () => {
      const stored = localStorage.getItem("selectedAddress");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (JSON.stringify(parsed) !== JSON.stringify(address)) {
            setAddress(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setAddress(null);
      }
    };
    checkAddress();
    const timer = setInterval(checkAddress, 1500);
    return () => clearInterval(timer);
  }, [address]);

  // 3. Fetch subcategories when category changes
  useEffect(() => {
    if (category && category !== "all") {
      axios
        .get(`${import.meta.env.VITE_API_URL}/sub-categories/category/${category}`)
        .then((res) => setSubCategoriesList(res.data.subCategories || []))
        .catch((err) => console.error(err));
      setSubCategory("all");
      setProductFamily("all");
    } else {
      setSubCategoriesList([]);
      setFamiliesList([]);
      setSubCategory("all");
      setProductFamily("all");
    }
  }, [category]);

  // 4. Fetch product families when subcategory changes
  useEffect(() => {
    if (subCategory && subCategory !== "all") {
      axios
        .get(`${import.meta.env.VITE_API_URL}/product-families/sub-category/${subCategory}`)
        .then((res) => setFamiliesList(res.data.productFamilies || []))
        .catch((err) => console.error(err));
      setProductFamily("all");
    } else {
      setFamiliesList([]);
      setProductFamily("all");
    }
  }, [subCategory]);

  // 5. Core product fetching function
  const fetchProducts = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const params = {};
      if (address) {
        if (address.pincode) params.pincode = address.pincode;
        if (address.latitude) params.latitude = address.latitude;
        if (address.longitude) params.longitude = address.longitude;
      }
      if (searchQuery) params.search = searchQuery;
      if (category !== "all") params.category = category;
      if (subCategory !== "all") params.subCategory = subCategory;
      if (productFamily !== "all") params.productFamily = productFamily;
      if (brand !== "all") params.brand = brand;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (availability === "in_stock") params.availability = "in_stock";

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`, { params });
      
      setServiceAvailable(res.data.serviceAvailable !== false);
      setProducts(res.data.products || []);
      setGroupedProducts(res.data.groupedProducts || {});
      setNearestVendor(res.data.nearestVendor || null);

      // Dynamically extract unique brands for filtering from the loaded products
      if (res.data.products) {
        const brands = res.data.products
          .map((p) => p.brand)
          .filter((b, idx, self) => b && self.indexOf(b) === idx);
        setAvailableBrands(brands);
      }
    } catch (err) {
      console.error("Error fetching customer products:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Trigger loading when location or filters change
  useEffect(() => {
    fetchProducts(true);
  }, [address, searchQuery, category, subCategory, productFamily, brand, minPrice, maxPrice, availability]);

  // Polling for real-time dynamic updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts(false); // Silent background fetch
    }, 10000);
    return () => clearInterval(interval);
  }, [address, searchQuery, category, subCategory, productFamily, brand, minPrice, maxPrice, availability]);

  const isFilterActive = !!(searchQuery || category !== "all" || subCategory !== "all" || productFamily !== "all" || brand !== "all" || minPrice || maxPrice || availability === "in_stock");

  return (
    <div className="py-4 space-y-6">
      {loading ? (
        /* Loading State */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-50 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4 animate-pulse"></div>
          <p className="text-slate-500 font-bold text-sm">Searching for products in your area...</p>
        </div>
      ) : !serviceAvailable ? (
        /* Coming Soon State */
        <ComingSoon />
      ) : (
        /* Service Available Dashboard Single Column Layout */
        <div className="space-y-8">
          {/* Hero Promo Banner */}
          {!isFilterActive && <HeroBanner vendorId={nearestVendor?._id || null} />}

          {/* Category Slider Strip */}
          {!isFilterActive && (
            <CategorySection
              selectedCategory={category === "all" ? null : category}
              onSelectCategory={(catId) => {
                const newParams = {};
                if (catId) newParams.category = catId;
                if (searchQuery) newParams.search = searchQuery;
                setSearchParams(newParams);
              }}
            />
          )}

          {/* Dynamic Products view */}
          <TrendingProducts
            products={products}
            groupedProducts={groupedProducts}
            isFilterActive={isFilterActive}
            serviceAvailable={serviceAvailable}
          />
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;