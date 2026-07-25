import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, Zap, Percent, Grid } from "lucide-react";

function HeroBanner({ vendorId }) {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch banners whenever resolved vendorId changes
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
          setCurrent(0);
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

  // Auto-rotate carousel every 4 seconds
  useEffect(() => {
    clearInterval(timerRef.current);
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 4000);
    }
    return () => clearInterval(timerRef.current);
  }, [banners]);

  const goTo = (idx) => {
    setCurrent(idx);
    clearInterval(timerRef.current);
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 4000);
    }
  };

  const prev = () => goTo((current - 1 + banners.length) % banners.length);
  const next = () => goTo((current + 1) % banners.length);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      next(); // Swiped left -> Next
    } else if (diff < -40) {
      prev(); // Swiped right -> Prev
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleBannerClick = (banner) => {
    const slug = banner.productId?.slug;
    const id = banner.productId?._id || banner.productId;
    if (slug) {
      navigate(`/customer/product/slug/${slug}`);
    } else if (id) {
      navigate(`/customer/product/${id}`);
    }
  };

  // Return loading skeleton with responsive aspect ratio
  if (loading) {
    return (
      <div className="w-full aspect-[3/1] max-h-[220px] bg-slate-100 animate-pulse rounded-2xl md:rounded-3xl border border-purple-100" />
    );
  }

  // Return fallback promotional banner if database has no active banners
  if (banners.length === 0) {
    return (
      <div className="space-y-2 select-none">
        <div className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl bg-[#F3E8FF] p-4 sm:p-5 flex items-center justify-between border border-purple-200/50 min-h-[160px] sm:min-h-[190px] md:min-h-[220px]">
          {/* Left Info Column */}
          <div className="flex-1 space-y-2 z-10 max-w-[62%]">
            <h2 className="text-[#2D1B6B] text-[clamp(13px,3.2vw,20px)] font-black leading-tight tracking-tight">
              Grocery, Khulaa Item <br className="hidden sm:inline" />
              <span className="flex items-center gap-1 flex-wrap mt-0.5 text-[#2D1B6B]">
                &amp; more at 
                <span className="bg-[#5B21B6] text-white text-[clamp(9px,2vw,12px)] font-black px-2 py-0.5 rounded-lg leading-none align-middle">
                  ₹0
                </span> 
                Convenience Fee
              </span>
            </h2>

            <p className="text-[#5B21B6] font-bold text-[clamp(9px,2vw,12px)] leading-none">
              Best Quality, Quick Delivery
            </p>

            {/* Badges list */}
            <div className="flex flex-row gap-1.5 flex-wrap text-[clamp(7px,1.6vw,10px)] font-bold text-slate-700 mt-1.5">
              <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full border border-purple-100 shadow-2xs">
                <span className="w-3.5 h-3.5 rounded-full bg-[#5B21B6] text-white flex items-center justify-center flex-shrink-0">
                  <Zap size={8} className="fill-white stroke-[2.5]" />
                </span>
                Super Fast Delivery
              </div>
              <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full border border-purple-100 shadow-2xs">
                <span className="w-3.5 h-3.5 rounded-full bg-[#5B21B6] text-white flex items-center justify-center flex-shrink-0">
                  <Percent size={8} className="stroke-[2.5]" />
                </span>
                Best Prices &amp; Offers
              </div>
              <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded-full border border-purple-100 shadow-2xs">
                <span className="w-3.5 h-3.5 rounded-full bg-[#5B21B6] text-white flex items-center justify-center flex-shrink-0">
                  <Grid size={8} className="stroke-[2.5]" />
                </span>
                Wide Range of Products
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => navigate("/customer/categories")}
                className="bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-[clamp(9px,1.8vw,12px)] font-black px-5 py-2 rounded-xl shadow-md transition duration-200 cursor-pointer active:scale-95"
              >
                Order Now
              </button>
              <span className="text-slate-500 hover:text-slate-700 text-[clamp(8px,1.6vw,10px)] font-bold cursor-pointer underline">
                T&amp;C Apply
              </span>
            </div>
          </div>

          {/* Right Groceries Image Column */}
          <div className="absolute right-0 bottom-0 top-0 w-[40%] flex items-end justify-end overflow-hidden pointer-events-none">
            <img
              src="/grocery-hero.png"
              alt="Grocery Hero"
              className="max-h-[105%] w-auto object-contain object-bottom"
            />
          </div>
        </div>

        {/* Static Dot Indicators Outside */}
        <div className="flex justify-center gap-1.5 mt-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#5B21B6]" />
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="w-2 h-2 rounded-full bg-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 select-none">
      {/* Outer Banner Wrapper — overflow-hidden & rounded edges */}
      <div 
        className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-sm border border-purple-100/60 group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slider Container with smooth transform transition */}
        <div
          className="flex transition-transform duration-500 ease-out w-full"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((banner, idx) => (
            <div
              key={banner._id || idx}
              onClick={() => handleBannerClick(banner)}
              className="w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl flex items-center justify-center"
            >
              <img
                src={banner.image}
                alt={banner.productId?.name || "Promotional Banner"}
                loading="eager"
                decoding="async"
                className="w-full h-auto rounded-2xl md:rounded-3xl block transition-opacity duration-300"
              />
            </div>
          ))}
        </div>

        {/* Navigation Arrows (Visible on hover when 2+ banners) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 bg-white/85 backdrop-blur-md rounded-full shadow-lg text-slate-800 opacity-0 group-hover:opacity-100 transition hover:bg-white active:scale-90"
              aria-label="Previous banner"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-white/85 backdrop-blur-md rounded-full shadow-lg text-slate-800 opacity-0 group-hover:opacity-100 transition hover:bg-white active:scale-90"
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
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === current ? "w-6 bg-[#5B21B6]" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroBanner;