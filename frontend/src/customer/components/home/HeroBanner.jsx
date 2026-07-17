import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Props:
//   vendorId (string | null) — the _id of the nearest vendor serving the
//   customer's delivery address. Resolved by CustomerDashboard and passed
//   down so HeroBanner doesn't need to make a redundant /api/products call.
function HeroBanner({ vendorId }) {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  // Fetch banners whenever the resolved vendorId changes
  useEffect(() => {
    if (!vendorId) {
      setBanners([]);
      return;
    }

    let cancelled = false;

    const fetchBanners = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/banners/public`,
          { params: { vendorId } }
        );
        if (!cancelled) {
          setBanners(res.data.banners || []);
          setCurrent(0); // reset carousel when vendor changes
        }
      } catch (err) {
        console.error("HeroBanner: Error fetching banners:", err);
        if (!cancelled) setBanners([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBanners();

    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  // Auto-rotate carousel every 3.5 seconds
  useEffect(() => {
    clearInterval(timerRef.current);
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 3500);
    }
    return () => clearInterval(timerRef.current);
  }, [banners]);

  const goTo = (idx) => {
    setCurrent(idx);
    clearInterval(timerRef.current);
    // restart auto-rotate after manual navigation
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 3500);
    }
  };

  const prev = () => goTo((current - 1 + banners.length) % banners.length);
  const next = () => goTo((current + 1) % banners.length);

  const handleBannerClick = (banner) => {
    const id = banner.productId?._id || banner.productId;
    if (id) {
      navigate(`/customer/product/${id}`);
    }
  };

  // Return loading skeleton
  if (loading) {
    return (
      <div className="w-full h-[140px] sm:h-[180px] bg-slate-100 animate-pulse rounded-3xl" />
    );
  }

  // Return fallback promotional banner if database has no active banners
  if (banners.length === 0) {
    return (
      <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-50 p-4 sm:p-5 flex items-center justify-between shadow-sm select-none border border-purple-100/50 min-h-[140px] sm:min-h-[180px]">
        {/* Left Info Column */}
        <div className="flex-1 space-y-2 z-10 max-w-[55%]">
          <h2 className="text-[#1F1A3A] text-xs sm:text-sm md:text-lg font-black leading-tight tracking-tight">
            Grocery, Khulaa Item <br />
            <span className="flex items-center gap-1 flex-wrap mt-0.5 text-purple-900">
              & more at 
              <span className="bg-[#6B21D9] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">
                ₹0
              </span> 
              Convenience Fee
            </span>
          </h2>

          {/* Trust Checkmarks list */}
          <div className="flex flex-col gap-1 text-[8px] sm:text-[9px] font-extrabold text-slate-600">
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-[#6B21D9] text-white flex items-center justify-center text-[7px] font-black">✓</span>
              Same Day Delivery
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-[#6B21D9] text-white flex items-center justify-center text-[7px] font-black">✓</span>
              Wide Range
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-full bg-[#6B21D9] text-white flex items-center justify-center text-[7px] font-black">✓</span>
              Best Prices
            </div>
          </div>

          <button
            onClick={() => navigate("/customer/categories")}
            className="bg-[#6B21D9] hover:bg-[#5B18C2] active:scale-[0.98] text-white text-[9px] font-black px-4 py-1.5 rounded-full flex items-center gap-1 shadow-md shadow-purple-200 transition-all duration-200"
          >
            Order Now <span className="text-xs">→</span>
          </button>
        </div>

        {/* Right Groceries Image Column */}
        <div className="absolute right-0 bottom-0 top-0 w-[45%] flex items-end justify-end overflow-hidden pointer-events-none">
          <img
            src="/grocery-hero.png"
            alt="Grocery Hero"
            className="max-h-[110%] w-auto object-contain object-bottom"
          />
        </div>

        {/* Static Dot Indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          <span className="w-4 h-1 rounded-full bg-[#6B21D9]" />
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="w-1 h-1 rounded-full bg-slate-300" />
        </div>
      </div>
    );
  }

  const activeBanner = banners[current];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-md group select-none">
      {/* Banner Image */}
      <div
        className="relative w-full cursor-pointer h-[140px] sm:h-[200px] md:h-[260px]"
        onClick={() => handleBannerClick(activeBanner)}
      >
        <img
          key={activeBanner._id}
          src={activeBanner.image}
          alt={activeBanner.productId?.name || "Promo Banner"}
          className="w-full h-full object-cover rounded-3xl transition-opacity duration-500 object-center"
        />
        {/* Subtle dark gradient at the bottom for visual depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-3xl pointer-events-none" />
      </div>

      {/* Navigation Arrows — only visible when hovering, only when 2+ banners */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-slate-700 opacity-0 group-hover:opacity-100 transition hover:bg-white"
            aria-label="Previous banner"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-slate-700 opacity-0 group-hover:opacity-100 transition hover:bg-white"
            aria-label="Next banner"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                aria-label={`Go to banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default HeroBanner;