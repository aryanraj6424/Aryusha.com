import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { MapPin, Navigation, Search as SearchIcon } from "lucide-react";
import HeroBanner from "../components/home/HeroBanner";
import CategorySection from "../components/home/CategorySection";
import TrendingProducts from "../components/home/TrendingProducts";
import ComingSoon from "../components/location/ComingSoon";
import { getAddressFromCoords } from "../../services/locationApi";

function CustomerDashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [address, setAddress] = useState(null);
  const [products, setProducts] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [nearestVendor, setNearestVendor] = useState(null);

  // Geolocation state: null = not yet determined, "requesting" = in progress,
  // "denied" = user denied, "unavailable" = no geolocation API
  const [geoStatus, setGeoStatus] = useState(null);

  // Search parameters for filters (URL search is the single source of truth)
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || "";
  const subCategory = searchParams.get("subCategory") || "all";

  // Remaining filter states
  const [productFamily, setProductFamily] = useState("all");
  const [brand, setBrand] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("all");

  // Lists populated for filters/selections
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [familiesList, setFamiliesList] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);

  // ── Attempt automatic geolocation on first visit ──────────────────────────
  const attemptGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      setLoading(false);
      return;
    }

    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await getAddressFromCoords(latitude, longitude);
          const newAddress = {
            latitude,
            longitude,
            fullAddress: result.formatted || "Current Location",
            pincode: result.postcode || "",
            city: result.city || "",
            addressType: "Current Location",
          };
          localStorage.setItem("selectedAddress", JSON.stringify(newAddress));
          setAddress(newAddress);
          setGeoStatus("granted");
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          // Still save coords even if reverse geocoding fails
          const { latitude, longitude } = position.coords;
          const fallbackAddress = { latitude, longitude, fullAddress: "Current Location", pincode: "" };
          localStorage.setItem("selectedAddress", JSON.stringify(fallbackAddress));
          setAddress(fallbackAddress);
          setGeoStatus("granted");
        }
      },
      (error) => {
        console.error("Geolocation denied:", error);
        setGeoStatus("denied");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  // 1. On mount: if selectedAddress already exists use it, else request geolocation
  useEffect(() => {
    const stored = localStorage.getItem("selectedAddress");
    if (stored) {
      try {
        setAddress(JSON.parse(stored));
        setGeoStatus("granted");
      } catch {
        localStorage.removeItem("selectedAddress");
        attemptGeolocation();
      }
    } else {
      attemptGeolocation();
    }
  }, []);

  // 2. Monitor localStorage location changes (e.g., user picks a new location)
  useEffect(() => {
    const checkAddress = () => {
      const stored = localStorage.getItem("selectedAddress");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (JSON.stringify(parsed) !== JSON.stringify(address)) {
            setAddress(parsed);
            setGeoStatus("granted");
          }
        } catch {
          /* ignore */
        }
      } else {
        setAddress(null);
      }
    };
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
      setProductFamily("all");
    } else {
      setSubCategoriesList([]);
      setFamiliesList([]);
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
      fetchProducts(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [address, searchQuery, category, subCategory, productFamily, brand, minPrice, maxPrice, availability]);

  const isFilterActive = !!(searchQuery || category !== "all" || subCategory !== "all" || productFamily !== "all" || brand !== "all" || minPrice || maxPrice || availability === "in_stock");

  const showHero = pathname === "/customer/dashboard" || pathname === "/" || pathname === "/customer";
  const showCategories = pathname === "/customer/dashboard" || pathname === "/" || pathname === "/customer" || pathname === "/customer/categories";
  const showTrending = pathname === "/customer/dashboard" || pathname === "/" || pathname === "/customer" || pathname === "/customer/trending" || (pathname === "/customer/categories" && category !== "all");

  // ── Location selection prompt (shown when geo denied / unavailable) ────────
  if (!address && geoStatus !== "requesting" && geoStatus !== null) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Animated map pin */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center shadow-lg">
                <MapPin size={44} className="text-purple-600" />
              </div>
              <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-purple-500 border-2 border-white animate-ping" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Where should we deliver?
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            We need your location to find the nearest vendor and show you available products.
          </p>

          <div className="flex flex-col gap-3">
            {/* Try geolocation again */}
            {geoStatus === "denied" ? (
              <button
                onClick={attemptGeolocation}
                className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-purple-200"
              >
                <Navigation size={20} />
                Try Again — Enable Location
              </button>
            ) : (
              <button
                onClick={attemptGeolocation}
                className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-purple-200"
              >
                <Navigation size={20} />
                Use My Current Location
              </button>
            )}

            {/* Search / choose manually */}
            <button
              onClick={() => navigate("/customer/location")}
              className="w-full flex items-center justify-center gap-3 border-2 border-purple-200 text-purple-700 font-semibold py-4 rounded-2xl hover:bg-purple-50 transition"
            >
              <SearchIcon size={20} />
              Search & Select Location
            </button>
          </div>

          {geoStatus === "denied" && (
            <p className="text-xs text-gray-400 mt-6">
              Location permission was denied. Please allow location access in your browser settings or search for your area manually.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      {loading || geoStatus === "requesting" ? (
        /* Loading State */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-50 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
          <p className="text-slate-500 font-bold text-sm">
            {geoStatus === "requesting"
              ? "Detecting your location..."
              : "Searching for products in your area..."}
          </p>
        </div>
      ) : !serviceAvailable ? (
        /* Coming Soon State */
        <ComingSoon />
      ) : (
        /* Service Available Dashboard Single Column Layout */
        <div className="space-y-8">
          {/* Hero Promo Banner */}
          {showHero && !isFilterActive && <HeroBanner vendorId={nearestVendor?._id || null} />}

          {/* Category Slider Strip */}
          {showCategories && (!isFilterActive || pathname === "/customer/categories") && (
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
          {showTrending && (
            <TrendingProducts
              products={products}
              groupedProducts={groupedProducts}
              isFilterActive={isFilterActive}
              serviceAvailable={serviceAvailable}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;