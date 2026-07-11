import { useState, useEffect } from "react";
import axios from "axios";
import HeroBanner from "../components/home/HeroBanner";
import CategorySection from "../components/home/CategorySection";
import TrendingProducts from "../components/home/TrendingProducts";
import ComingSoon from "../components/location/ComingSoon";
import { Search, Filter, RotateCcw, ShieldCheck } from "lucide-react";

function CustomerDashboard() {
  const [address, setAddress] = useState(null);
  const [products, setProducts] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [nearestVendor, setNearestVendor] = useState(null);

  // Filter States
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [productFamily, setProductFamily] = useState("all");
  const [brand, setBrand] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("all"); // 'all' or 'in_stock'

  // Subcategories & Product Families lists
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setCategory("all");
    setSubCategory("all");
    setProductFamily("all");
    setBrand("all");
    setMinPrice("");
    setMaxPrice("");
    setAvailability("all");
  };

  const isFilterActive = !!(searchQuery || category !== "all" || subCategory !== "all" || productFamily !== "all" || brand !== "all" || minPrice || maxPrice || availability === "in_stock");

  return (
    <div className="py-6 space-y-6">
      {/* Location Bar / Info */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
            📍
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold">DELIVERING TO</p>
            <p className="text-sm font-extrabold text-slate-800">
              {address ? address.fullAddress : "No Location Selected"} 
              {address?.pincode ? ` (${address.pincode})` : ""}
            </p>
          </div>
        </div>

        {nearestVendor && serviceAvailable && (
          <div className="bg-white border border-purple-100 rounded-xl px-4 py-2 text-left shadow-sm">
            <span className="text-[10px] text-gray-400 font-extrabold tracking-wider block">SHOPPING FROM STORE</span>
            <span className="text-sm font-extrabold text-purple-700 flex items-center gap-1">
              🏪 {nearestVendor.shopName} {nearestVendor.distance !== null ? `(${nearestVendor.distance} km)` : ""}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl text-xs font-bold">
          <ShieldCheck size={14} />
          Verified Service Areas
        </div>
      </div>

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
        /* Service Available Dashboard Grid */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 h-fit">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                <Filter size={18} className="text-purple-600" />
                Filter & Search
              </h3>
              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              )}
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                className="w-full border rounded-2xl pl-10 pr-4 py-2.5 outline-none focus:border-purple-600 text-sm font-semibold transition"
              />
              <button type="submit" className="absolute left-3 top-3 text-slate-400">
                <Search size={16} />
              </button>
            </form>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-sm font-semibold text-slate-700 bg-white"
              >
                <option value="all">All Categories</option>
                {groupedProducts.byCategory?.map((group) => (
                  <option key={group.category._id} value={group.category._id}>
                    {group.category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub Category Dropdown */}
            {subCategoriesList.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Sub Category</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-sm font-semibold text-slate-700 bg-white"
                >
                  <option value="all">All Sub Categories</option>
                  {subCategoriesList.map((sc) => (
                    <option key={sc._id} value={sc._id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Product Family Dropdown */}
            {familiesList.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Product Family</label>
                <select
                  value={productFamily}
                  onChange={(e) => setProductFamily(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-sm font-semibold text-slate-700 bg-white"
                >
                  <option value="all">All Product Families</option>
                  {familiesList.map((pf) => (
                    <option key={pf._id} value={pf._id}>
                      {pf.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Brand Dropdown */}
            {availableBrands.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Brand</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-sm font-semibold text-slate-700 bg-white"
                >
                  <option value="all">All Brands</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">Price Range (₹)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-sm font-semibold text-center"
                />
                <span className="text-slate-400 self-center">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 outline-none focus:border-purple-600 text-sm font-semibold text-center"
                />
              </div>
            </div>

            {/* Availability */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={availability === "in_stock"}
                  onChange={(e) => setAvailability(e.target.checked ? "in_stock" : "all")}
                  className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero Promo Banner */}
            {!isFilterActive && <HeroBanner />}

            {/* Category Slider Grid */}
            {!isFilterActive && (
              <CategorySection
                selectedCategory={category === "all" ? null : category}
                onSelectCategory={(catId) => setCategory(catId || "all")}
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
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;