import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

function CategorySection({ selectedCategory, onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories`);
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error("Error loading categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
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

  return (
    <div className="relative group">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-black text-slate-800">Shop by Category</h2>
        <button
          onClick={() => onSelectCategory(null)}
          className="border border-purple-200 text-[#6B21D9] hover:bg-purple-50 text-[10px] font-black px-4 py-1 rounded-full transition flex items-center justify-center min-h-[28px] cursor-pointer"
        >
          View All
        </button>
      </div>

      <div className="relative">
        {/* Left Arrow Button (visible on desktop hover) */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full border border-slate-150 shadow-md hover:bg-slate-50 text-slate-650 transition duration-200 hidden md:block"
          title="Scroll Left"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Categories Grid/Strip */}
        <div
          ref={scrollContainerRef}
          className="grid grid-cols-6 gap-1 md:flex md:gap-5 overflow-x-auto scroll-smooth scrollbar-hide py-1 w-full"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.slice(0, 6).map((category) => {
            const isSelected = selectedCategory === category._id;
            const categoryImage = category.icon || category.image;

            return (
              <div
                key={category._id}
                onClick={() => onSelectCategory(isSelected ? null : category._id)}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer text-center group"
              >
                {/* Circular Image Container */}
                <div
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all duration-200 shadow-sm ${
                    isSelected
                      ? "border-purple-600 ring-2 ring-purple-100 bg-purple-50"
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
                    <span className="text-xl md:text-2xl">🛒</span>
                  )}
                </div>

                {/* Name Label */}
                <span
                  className={`text-[9px] md:text-[11px] mt-2 font-bold line-clamp-2 leading-none max-w-[60px] md:max-w-[80px] transition-colors duration-200 ${
                    isSelected ? "text-purple-700 font-extrabold" : "text-slate-600 group-hover:text-purple-650"
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
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full border border-slate-150 shadow-md hover:bg-slate-50 text-slate-650 transition duration-200 hidden md:block"
          title="Scroll Right"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default CategorySection;