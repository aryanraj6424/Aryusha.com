// customer/components/navbar/SearchBar.jsx

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/customer/dashboard?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate(`/customer/dashboard`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center h-12 md:h-14 bg-purple-50 border border-purple-200 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-purple-300 transition">
        <Search
          size={20}
          className="text-purple-650"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for milk, fruits, vegetables..."
          className="flex-1 px-3 bg-transparent outline-none text-sm md:text-base text-slate-800 placeholder-slate-400 font-medium"
        />
      </div>
    </form>
  );
}

export default SearchBar;