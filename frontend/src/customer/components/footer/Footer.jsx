import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Smartphone,
  Heart,
  ChevronRight
} from "lucide-react";

export default function Footer() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Categories Fetch
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories`);
        if (res.data && res.data.categories && res.data.categories.length > 0) {
          setCategories(res.data.categories.slice(0, 5));
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error("Error loading categories for footer:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCities = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/footer/cities`);
        if (res.data && res.data.cities && res.data.cities.length > 0) {
          setCities(res.data.cities);
        } else {
          setCities([]);
        }
      } catch (err) {
        console.error("Error loading cities for footer:", err);
        setCities([]);
      }
    };

    fetchCategories();
    fetchCities();
  }, []);

  // Standard fallback categories if database is empty or API fails
  const fallbackCategories = [
    { _id: "fruits-veg", name: "Fruits & Vegetables", icon: "🥦", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { _id: "dairy-bread", name: "Dairy, Bread & Eggs", icon: "🥛", color: "bg-blue-50 text-blue-600 border-blue-100" },
    { _id: "snacks-munchies", name: "Snacks & Munchies", icon: "🍿", color: "bg-amber-50 text-amber-600 border-amber-100" },
    { _id: "cold-drinks", name: "Cold Drinks & Juices", icon: "🥤", color: "bg-red-50 text-red-600 border-red-100" },
    { _id: "instant-food", name: "Instant & Frozen Food", icon: "🍜", color: "bg-orange-50 text-orange-600 border-orange-100" }
  ];

  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  const handleCategoryClick = (catId) => {
    // Navigate to homepage dashboard filtering by category
    if (catId.startsWith("fruits-veg") || catId.startsWith("dairy") || catId.startsWith("snacks") || catId.startsWith("cold") || catId.startsWith("instant")) {
      navigate("/");
    } else {
      navigate(`/?category=${catId}`);
    }
  };

  const fallbackCities = [
    "Samastipur", "Delhi", "Noida", "Gurugram", "Ghaziabad", "Faridabad",
    "Mumbai", "Pune", "Bengaluru", "Hyderabad", "Kolkata", "Chennai",
    "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore", "Kochi"
  ];

  const displayCities = cities.length > 0 ? cities : fallbackCities;

  return (
    <footer className="bg-white border-t border-purple-100 mt-12 w-full pb-24 md:pb-8">
      {/* 1. Categories Grid Section */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8 border-b border-purple-50">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
          Popular Categories
        </h3>
        
        {loading && categories.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {displayCategories.map((category) => {
              const isFallback = !category.image && !category.icon?.startsWith("http");
              const hasColor = category.color;
              
              return (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category._id)}
                  className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-100 hover:border-purple-200 transition-all duration-300 group text-left cursor-pointer active:scale-95 animate-fade-in"
                >
                  {/* Category Image/Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-300 shadow-sm overflow-hidden group-hover:scale-110 
                    ${isFallback && hasColor ? category.color : "bg-white border-slate-200"}`}
                  >
                    {!isFallback ? (
                      <img
                        src={category.icon || category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.parentNode.innerHTML = `<span class="text-xl">🛒</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-xl">{category.icon || "🛒"}</span>
                    )}
                  </div>
                  
                  {/* Category Info */}
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-purple-700 truncate leading-snug">
                      {category.name}
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-purple-500 transition-transform duration-300 group-hover:translate-x-1 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Cities We Serve Section */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 border-b border-purple-50">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
          Cities We Serve
        </h3>
        <p className="text-xs leading-relaxed text-slate-500 font-medium">
          {displayCities.map((city, index) => (
            <span key={city} className="inline-block whitespace-nowrap">
              <span className="hover:text-purple-600 cursor-pointer transition-colors duration-200 font-semibold">{city}</span>
              {index < displayCities.length - 1 && <span className="mx-2.5 text-slate-300">|</span>}
            </span>
          ))}
        </p>
      </div>

      {/* 3. Bottom Footer Sections */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Column 1: Logo + Tagline + Social Icons */}
          <div className="flex flex-col gap-5">
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer flex items-center gap-3 w-fit"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-md shadow-purple-100">
                Q
              </div>
              <h1 className="text-xl font-bold text-purple-700 tracking-tight">
                QuickCart
              </h1>
            </div>
            
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">
              Quick essentials, delivered to your door. Get fresh groceries, household items, snacks, and daily needs in minutes.
            </p>
            
            <div className="flex items-center gap-3 mt-1">
              {[
                { icon: Instagram, url: "https://instagram.com", name: "Instagram" },
                { icon: Twitter, url: "https://twitter.com", name: "Twitter" },
                { icon: Facebook, url: "https://facebook.com", name: "Facebook" },
                { icon: Linkedin, url: "https://linkedin.com", name: "LinkedIn" }
              ].map((social) => {
                const IconComp = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200 transition-all duration-300 active:scale-90"
                    aria-label={social.name}
                  >
                    <IconComp size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-5 relative pl-3">
              <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-purple-600 rounded-full"></span>
              Useful Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Home", path: "/" },
                { label: "About Us", path: "/customer/page/about-us" },
                { label: "Customer Support", path: "/customer/page/customer-support" },
                { label: "Delivery Areas", path: "/customer/page/delivery-area" }
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors duration-200 block w-fit py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Help & Support Links */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-5 relative pl-3">
              <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-purple-600 rounded-full"></span>
              Help & Support
            </h4>
            <ul className="space-y-3">
              {[
                { label: "FAQ", path: "/customer/page/faq" },
                { label: "Privacy Policy", path: "/customer/page/privacy-policy" },
                { label: "Terms & Conditions", path: "/customer/page/terms-conditions" },
                { label: "Vendor Connect", path: "/vendor/login" }
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors duration-200 block w-fit py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Download App box */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-5 relative pl-3">
              <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-purple-600 rounded-full"></span>
              Experience Our App
            </h4>
            
            <div className="border border-dashed border-purple-200 rounded-2xl p-5 bg-purple-50/30 flex items-start gap-4 hover:border-purple-300 transition-colors duration-300">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                <Smartphone size={20} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-700">
                  Download QuickCart App
                </p>
                <p className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full w-fit">
                  Coming Soon
                </p>
                <p className="text-[10px] text-slate-400 font-medium pt-1">
                  Available soon on iOS & Android
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Copyright Bar */}
      <div className="bg-slate-50 border-t border-purple-50 py-6">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 text-center sm:text-left">
          <p>
            © 2025 <span className="text-purple-600 font-bold">QuickCart</span>. All rights reserved.
          </p>
          <p className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-purple-100 shadow-sm w-fit mx-auto sm:mx-0">
            <span>Proudly made for our customers</span>
            <Heart size={12} className="text-red-500 fill-red-500 animate-bounce" />
          </p>
        </div>
      </div>
    </footer>
  );
}
