import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

function CategorySection({ selectedCategory, onSelectCategory }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/categories`),
          axios.get(`${import.meta.env.VITE_API_URL}/sub-categories`)
        ]);
        setCategories(catRes.data.categories || []);
        setSubCategories(subRes.data.subCategories || []);
      } catch (err) {
        console.error("Error loading category/subcategory data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 240;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-slate-400 text-sm font-bold animate-pulse">
        <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        Loading categories...
      </div>
    );
  }

  const isSelected = (catId) => selectedCategory === catId;
  const categoriesToRender = selectedCategory 
    ? categories.filter(cat => cat._id === selectedCategory)
    : categories;

  return (
    <div className="space-y-6">
      {/* 1. Shop by Category Section */}
      <div className="relative group">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">Shop by Category</h2>
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs font-bold text-[#6B21D9] hover:text-[#5B18C2] flex items-center gap-0.5 transition duration-200 bg-transparent border-none cursor-pointer"
          >
            View all <ChevronRight size={14} className="stroke-[2.5]" />
          </button>
        </div>

        <div className="relative">
          {/* Left Arrow Button (visible on desktop hover) */}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full border border-slate-150 shadow-md hover:bg-slate-50 text-slate-650 transition duration-200 hidden md:block cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Categories Strip */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide py-1 w-full"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((category) => {
              const selected = isSelected(category._id);
              const categoryImage = category.icon || category.image;

              return (
                <div
                  key={category._id}
                  onClick={() => onSelectCategory(selected ? null : category._id)}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer text-center group"
                >
                  {/* Rounded Square Image Container */}
                  <div
                    className={`w-14 h-14 md:w-18 md:h-18 rounded-2xl flex items-center justify-center overflow-hidden border transition-all duration-200 shadow-2xs ${
                      selected
                        ? "border-[#5B21B6] ring-3 ring-purple-100 bg-purple-50"
                        : "border-slate-100 bg-slate-50 group-hover:scale-105 group-hover:border-purple-300"
                    }`}
                  >
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt={category.name}
                        className="w-full h-full object-cover animate-fade-in"
                      />
                    ) : (
                      <span className="text-xl">🛒</span>
                    )}
                  </div>

                  {/* Name Label */}
                  <span
                    className={`text-[10px] md:text-[12px] mt-2 font-bold line-clamp-2 leading-tight max-w-[65px] md:max-w-[85px] transition-colors duration-200 ${
                      selected ? "text-[#5B21B6] font-black" : "text-slate-700 group-hover:text-[#5B21B6]"
                    }`}
                  >
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Arrow Button (visible on desktop hover) */}
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full border border-slate-150 shadow-md hover:bg-slate-50 text-slate-650 transition duration-200 hidden md:block cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 2. Per-category subcategory sections */}
      <div className="space-y-8 mt-6">
        {categoriesToRender.map((cat) => {
          // Filter subcategories belonging to this category
          const catSubs = subCategories.filter(
            (sub) => sub.categoryId?._id === cat._id || sub.categoryId === cat._id
          );
          
          if (catSubs.length === 0) return null;
          
          // Slice to max 8 (2 rows of 4 columns)
          const visibleSubs = catSubs.slice(0, 8);
          
          return (
            <div key={cat._id} className="space-y-4">
              {/* Heading Row */}
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
                  {cat.name}
                </h3>
                <button
                  onClick={() => onSelectCategory(cat._id)}
                  className="text-xs font-bold text-[#6B21D9] hover:text-[#5B18C2] flex items-center gap-0.5 transition duration-200 bg-transparent border-none cursor-pointer"
                >
                  View all <ChevronRight size={14} className="stroke-[2.5]" />
                </button>
              </div>

              {/* 4-Column Grid of Subcategories */}
              <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {visibleSubs.map((sub) => {
                  return (
                    <div
                      key={sub._id}
                      onClick={() => {
                        const newParams = { category: cat._id, subCategory: sub._id };
                        if (searchQuery) newParams.search = searchQuery;
                        setSearchParams(newParams);
                      }}
                      className="flex flex-col items-center cursor-pointer text-center group"
                    >
                      {/* Rounded Square Subcategory Image Container */}
                      <div className="w-full aspect-square rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 bg-slate-50 group-hover:scale-105 group-hover:border-[#5B21B6] transition-all duration-200 shadow-2xs">
                        {sub.image ? (
                          <img
                            src={sub.image}
                            alt={sub.name}
                            className="w-full h-full object-cover animate-fade-in"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <span className="text-slate-400 text-xs">📷</span>
                          </div>
                        )}
                      </div>

                      {/* Plain-text Label */}
                      <span className="text-[10px] md:text-[12px] mt-2 font-bold line-clamp-2 leading-tight max-w-full text-slate-700 group-hover:text-[#5B21B6] transition-colors duration-205">
                        {sub.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CategorySection;