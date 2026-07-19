import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Shield, Search, RefreshCw, FileText, CheckCircle } from "lucide-react";

export default function OnboardingRequests() {
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchOnboardingRiders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/delivery-boys/onboarding`,
        {
          params: { status: statusFilter, search, page: pagination.page },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.data.success) {
        setRiders(res.data.riders || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingRiders();
  }, [statusFilter, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchOnboardingRiders();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rider Onboarding Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Manage onboarding, verify KYC documents, and assign stores for new riders.</p>
        </div>
        <button 
          onClick={fetchOnboardingRiders}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-600 bg-slate-50/50"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-650 bg-white cursor-pointer font-semibold text-slate-700"
          >
            <option value="">All Onboarding Stages</option>
            <option value="signup_pending">Signup Verification OTP</option>
            <option value="kyc_pending">KYC Documents Pending</option>
            <option value="kyc_verified">KYC Verified / Training Preps</option>
            <option value="training_pending">Active Training Modules</option>
            <option value="training_completed">Training Complete / Store Assign</option>
            <option value="agreement_pending">Agreement E-Sign Contract</option>
          </select>
        </div>
      </div>

      {/* Grid of Rider Cards */}
      {loading ? (
        <div className="text-center py-12 text-sm text-slate-400 font-bold">Loading onboarding applications...</div>
      ) : riders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-250 bg-white rounded-3xl">
          <p className="text-sm text-slate-400 font-bold">No onboarding requests found matching this status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map((r) => (
            <div key={r._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-700">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{r.fullName}</h3>
                      <p className="text-xs text-slate-450 font-bold">{r.phone}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    r.onboardingStatus === "kyc_pending"
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : r.onboardingStatus === "kyc_verified" || r.onboardingStatus === "training_completed"
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : r.onboardingStatus === "agreement_pending"
                      ? "bg-purple-50 text-purple-650 border border-purple-100"
                      : "bg-slate-50 text-slate-500 border border-slate-100"
                  }`}>
                    {r.onboardingStatus.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="space-y-1.5 my-4 border-t border-b border-slate-50 py-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Vehicle Selected:</span>
                    <span className="text-slate-800 uppercase text-[11px]">{r.vehicleTypeSelection || "none"}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Preferred Shift:</span>
                    <span className="text-slate-800">{r.preferredShift || "None"}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Docs Uploaded:</span>
                    <span className="text-slate-800">{(r.documents || []).length} / 7</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => navigate(`/admin/delivery-kyc?rider=${r._id}`)}
                  className="flex-1 py-2 text-center text-xs font-bold border border-slate-205 rounded-xl hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                >
                  Verify KYC
                </button>
                <button
                  onClick={() => navigate(`/admin/delivery-assignment?rider=${r._id}`)}
                  className="flex-1 py-2 text-center text-xs font-bold bg-[#1a5d1a] hover:bg-[#154b15] text-white rounded-xl shadow-sm transition cursor-pointer"
                >
                  Assign Store
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500 font-bold">Page {pagination.page} of {pagination.totalPages}</span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
