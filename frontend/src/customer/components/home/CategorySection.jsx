import { useState, useEffect } from "react";
import axios from "axios";

function CategorySection({ selectedCategory, onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-gray-400 text-sm py-4">Loading categories...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-slate-800">Shop by Category</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {categories.map((category) => {
          const isSelected = selectedCategory === category._id;
          return (
            <div
              key={category._id}
              onClick={() => onSelectCategory(isSelected ? null : category._id)}
              className={`p-4 rounded-2xl border text-center cursor-pointer transition shadow-sm hover:shadow-md ${
                isSelected
                  ? "bg-purple-50 border-purple-500 text-purple-700"
                  : "bg-white border-purple-100 hover:border-purple-300"
              }`}
            >
              <div className="text-3xl mb-2">
                {category.image ? (
                  <img src={category.image} alt={category.name} className="w-12 h-12 object-cover mx-auto rounded-lg" />
                ) : (
                  "🛒"
                )}
              </div>

              <p className="text-sm font-bold truncate">
                {category.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CategorySection;