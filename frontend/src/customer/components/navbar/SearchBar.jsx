import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Mic, Loader2, ArrowRight, X, Package } from "lucide-react";
import { fetchSearchSuggestions } from "../../services/customerSearchApi";

function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const containerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Synchronize input when URL search parameter changes
  useEffect(() => {
    const urlQuery = searchParams.get("search");
    if (urlQuery !== null && urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  // Click outside and Escape key handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debounced search suggestions effect (300ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        let address = null;
        try {
          const savedAddr = localStorage.getItem("selectedAddress");
          if (savedAddr) address = JSON.parse(savedAddr);
        } catch (e) {
          // Silent catch
        }

        const data = await fetchSearchSuggestions(trimmed, address, controller.signal);
        setSuggestions(data.products || []);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          // Silent error handling
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setShowDropdown(false);
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/customer/dashboard?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate(`/customer/dashboard`);
    }
  };

  const handleSelectProduct = (product) => {
    setShowDropdown(false);
    if (product.slug) {
      navigate(`/customer/product/slug/${product.slug}`);
    } else if (product._id) {
      navigate(`/customer/product/${product._id}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center h-12 md:h-14 bg-white md:bg-purple-50 border border-slate-200 md:border-purple-200 rounded-full md:rounded-2xl px-4 focus-within:ring-2 focus-within:ring-purple-300 transition relative">
          <Search
            size={20}
            className="text-slate-400 md:text-purple-655 flex-shrink-0"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
            placeholder="Search for milk, fruits, vegetables..."
            className="flex-1 px-3 bg-transparent outline-none text-sm md:text-base text-slate-800 placeholder-slate-400 font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setShowDropdown(false); }}
              className="p-1 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition mr-1"
            >
              <X size={16} />
            </button>
          )}
          <Mic
            size={20}
            className="text-[#0B2214] md:hidden block cursor-pointer flex-shrink-0"
          />
        </div>
      </form>

      {/* Live Suggestions Dropdown (Zepto-Style, Additive) */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-150 z-50 overflow-hidden transform origin-top transition-all">
          {loading ? (
            <div className="p-4 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin text-purple-600" /> Finding suggestions...
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {suggestions.length === 0 ? (
                <div className="p-4 text-center text-xs font-bold text-slate-500">
                  No products found for <span className="text-purple-700 font-extrabold">"{query.trim()}"</span>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto py-1">
                  {suggestions.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleSelectProduct(product)}
                      className="px-4 py-2.5 hover:bg-purple-50/60 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={18} className="text-slate-300" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-extrabold text-slate-800 truncate text-sm">
                            {product.name}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            {product.brand || product.category || "Grocery Item"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-extrabold text-purple-700 text-sm">
                          ₹{product.price?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Row: "Show all results for 'X' →" */}
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-3 bg-purple-50/50 hover:bg-purple-100/60 text-purple-700 font-extrabold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <span>Show all results for <strong className="font-black text-purple-900">"{query.trim()}"</strong></span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;