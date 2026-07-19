import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, Zap, Percent, Grid } from "lucide-react";

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
      <div className="space-y-3 select-none">
        <div className="relative w-full overflow-hidden rounded-3xl bg-[#F3E8FF] p-5 flex items-center justify-between border border-purple-200/50 min-h-[170px] sm:min-h-[200px] md:min-h-[240px]">
          {/* Left Info Column */}
          <div className="flex-1 space-y-2 z-10 max-w-[60%]">
            <h2 className="text-[#2D1B6B] text-[clamp(14px,3.5vw,22px)] font-black leading-tight tracking-tight">
              Grocery, Khulaa Item <br className="hidden sm:inline" />
              <span className="flex items-center gap-1 flex-wrap mt-0.5 text-[#2D1B6B]">
                & more at 
                <span className="bg-[#5B21B6] text-white text-[clamp(9px,2.2vw,13px)] font-black px-2 py-0.5 rounded-lg leading-none align-middle">
                  ₹0
                </span> 
                Convenience Fee
              </span>
            </h2>

            <p className="text-[#5B21B6] font-bold text-[clamp(9px,2.2vw,13px)] leading-none">
              Best Quality, Quick Delivery
            </p>

            {/* Badges list */}
            <div className="flex flex-row gap-2 flex-wrap text-[clamp(7px,1.8vw,10px)] font-bold text-slate-700 mt-2">
              <div className="flex items-center gap-1 bg-white/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-purple-100 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#5B21B6] text-white flex items-center justify-center flex-shrink-0">
                  <Zap size={9} className="fill-white stroke-[2.5]" />
                </span>
                Super Fast Delivery
              </div>
              <div className="flex items-center gap-1 bg-white/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-purple-100 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#5B21B6] text-white flex items-center justify-center flex-shrink-0">
                  <Percent size={9} className="stroke-[2.5]" />
                </span>
                Best Prices & Offers
              </div>
              <div className="flex items-center gap-1 bg-white/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-purple-100 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#5B21B6] text-white flex items-center justify-center flex-shrink-0">
                  <Grid size={9} className="stroke-[2.5]" />
                </span>
                Wide Range of Products
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={() => navigate("/customer/categories")}
                className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-[clamp(9px,2vw,12px)] font-black px-6 py-2.5 rounded-xl shadow-md transition duration-200 cursor-pointer active:scale-95"
              >
                Order Now
              </button>
              <span className="text-slate-500 hover:text-slate-700 text-[clamp(8px,1.8vw,11px)] font-bold cursor-pointer underline">
                T&C Apply
              </span>
            </div>
          </div>

          {/* Right Groceries Image Column */}
          <div className="absolute right-0 bottom-0 top-0 w-[42%] flex items-end justify-end overflow-hidden pointer-events-none">
            <img
              src="/grocery-hero.png"
              alt="Grocery Hero"
              className="max-h-[110%] w-auto object-contain object-bottom"
            />
          </div>
        </div>

        {/* Static Dot Indicators Outside */}
        <div className="flex justify-center gap-1.5 mt-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#5B21B6]" />
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="w-2 h-2 rounded-full bg-slate-300" />
        </div>
      </div>
    );
  }

  const activeBanner = banners[current];

  return (
    <div className="space-y-3 select-none">
      <div className="relative w-full overflow-hidden rounded-3xl shadow-md group">
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
          </>
        )}
      </div>

      {/* Dot Indicators Outside */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              aria-label={`Go to banner ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-[#5B21B6]" : "w-2.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroBanner;