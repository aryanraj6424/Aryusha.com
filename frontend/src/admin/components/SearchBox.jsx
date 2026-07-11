import { Search, X } from "lucide-react";

export default function SearchBox({
  value,
  onChange,
  placeholder = "Search...",
  onClear,
}) {
  return (
    <div className="relative w-full max-w-sm">
      {/* Search Icon */}
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full
          rounded-lg
          border
          border-gray-300
          bg-white
          py-2.5
          pl-10
          pr-10
          text-sm
          outline-none
          focus:border-green-600
          focus:ring-2
          focus:ring-green-200
          transition
        "
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}