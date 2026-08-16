import { useState, useEffect, useMemo } from "react";
import {
  Award,
  Search,
  Package,
  TrendingUp,
  ShoppingBag,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { getTopSellingProducts } from "../../services/vendorApi";

export default function VendorTopSelling() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("units_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTopSellingData = async () => {
    setLoading(true);
    try {
      // Fetch up to 500 products ranked by top selling
      const res = await getTopSellingProducts(500);
      if (res && res.success) {
        setProducts(res.topSelling || []);
      } else {
        console.warn("getTopSellingProducts call was not successful:", res);
      }
    } catch (error) {
      console.error("Error fetching top selling products list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopSellingData();
  }, []);

  // Filter and sort items
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.packSize?.toLowerCase().includes(term)
      );
    }

    // Sort items
    result.sort((a, b) => {
      if (sortBy === "units_desc") return b.totalQtySold - a.totalQtySold;
      if (sortBy === "units_asc") return a.totalQtySold - b.totalQtySold;
      if (sortBy === "revenue_desc") return b.totalRevenue - a.totalRevenue;
      if (sortBy === "revenue_asc") return a.totalRevenue - b.totalRevenue;
      if (sortBy === "orders_desc") return b.distinctOrdersCount - a.distinctOrdersCount;
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

    return result;
  }, [products, searchTerm, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage) || 1;
  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedProducts.slice(start, start + itemsPerPage);
  }, [processedProducts, currentPage]);

  // Overall totals
  const totalUnitsMoved = useMemo(
    () => products.reduce((sum, p) => sum + (p.totalQtySold || 0), 0),
    [products]
  );
  const totalRevenueGenerated = useMemo(
    () => products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0),
    [products]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Award size={24} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Top Selling Products
            </h1>
          </div>
          <p className="text-slate-500 font-medium mt-1">
            Complete sales performance ranking of all your listed products
          </p>
        </div>
        <button
          onClick={fetchTopSellingData}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          🔄 Refresh Performance Data
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 rounded-2xl text-purple-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Ranked Products
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {products.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Total Units Sold
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {totalUnitsMoved.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Total Item Revenue
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              ₹{totalRevenueGenerated.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Controls Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search products or pack sizes..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            />
          </div>

          {/* Sort & Counter */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              Sort By:
            </span>
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                <option value="units_desc">Units Sold (High to Low)</option>
                <option value="revenue_desc">Revenue (High to Low)</option>
                <option value="orders_desc">Orders Count (High to Low)</option>
                <option value="units_asc">Units Sold (Low to High)</option>
                <option value="revenue_asc">Revenue (Low to High)</option>
                <option value="name_asc">Product Name (A-Z)</option>
              </select>
              <ArrowUpDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Product List Table / Card Rows */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-bold text-sm">
              {searchTerm
                ? "No top selling products match your search filter."
                : "No sales recorded yet for listed products."}
            </div>
          ) : (
            <div className="space-y-4">
              {currentProducts.map((item, idx) => {
                const overallRank =
                  (currentPage - 1) * itemsPerPage + idx + 1;

                return (
                  <div
                    key={`${item.productId}-${item.variantId || idx}`}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 hover:bg-purple-50/40 rounded-2xl border border-slate-100 gap-4 transition"
                  >
                    {/* Rank & Product Information */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                        #{overallRank}
                      </div>

                      {item.img ? (
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                          <Package size={24} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-slate-800 text-base truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.packSize && (
                            <span className="inline-block text-[11px] font-extrabold text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded-md">
                              {item.packSize}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-medium">
                            {item.distinctOrdersCount}{" "}
                            {item.distinctOrdersCount === 1 ? "order" : "orders"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sales Metrics */}
                    <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Units Sold
                        </p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">
                          {item.totalQtySold.toLocaleString("en-IN")}{" "}
                          <span className="text-xs font-bold text-purple-600">
                            {item.totalQtySold === 1 ? "unit" : "units"}
                          </span>
                        </p>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Total Revenue
                        </p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">
                          ₹{item.totalRevenue.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, processedProducts.length)} of{" "}
              {processedProducts.length} items
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
