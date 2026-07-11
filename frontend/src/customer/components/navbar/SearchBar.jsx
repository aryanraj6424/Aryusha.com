// customer/components/navbar/SearchBar.jsx

import { Search } from "lucide-react";

function SearchBar() {
  return (
    <div className="w-full">

      <div className="flex items-center h-12 md:h-14 bg-purple-50 border border-purple-200 rounded-2xl px-4">

        <Search
          size={20}
          className="text-purple-600"
        />

        <input
          type="text"
          placeholder="Search for milk, fruits, vegetables..."
          className="flex-1 px-3 bg-transparent outline-none text-sm md:text-base"
        />

      </div>

    </div>
  );
}

export default SearchBar;