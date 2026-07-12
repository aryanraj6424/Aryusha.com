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

  // Don't render anything if no banners to show
  if (loading || banners.length === 0) return null;

  const activeBanner = banners[current];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-md group select-none">
      {/* Banner Image */}
      <div
        className="relative w-full cursor-pointer"
        onClick={() => handleBannerClick(activeBanner)}
        style={{ minHeight: "160px" }}
      >
        <img
          key={activeBanner._id}
          src={activeBanner.image}
          alt={activeBanner.productId?.name || "Promo Banner"}
          className="w-full object-cover rounded-3xl transition-opacity duration-500"
          style={{ maxHeight: "260px", minHeight: "140px", objectPosition: "center" }}
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