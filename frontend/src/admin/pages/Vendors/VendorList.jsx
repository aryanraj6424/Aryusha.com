import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, Plus, Edit2, Trash2 } from "lucide-react";
import SearchBox from "../../components/SearchBox";
import DeleteModal from "../../components/DeleteModal";
import { useToast } from "../../../components/Toast";

const API = `${import.meta.env.VITE_API_URL}/admin/vendors`;

export default function VendorList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [assignArea, setAssignArea] = useState("");
  const [assignRadius, setAssignRadius] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/all`);
      setVendors(response.data.vendors || []);
    } catch (error) {
      console.log(error);
      showToast({ type: "error", message: "Failed to fetch vendors." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API}/approve/${id}`);
      showToast({ type: "success", message: "Vendor approved successfully." });
      fetchVendors();
    } catch (error) {
      console.log(error);
      showToast({ type: "error", message: "Failed to approve vendor." });
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`${API}/reject/${id}`);
      showToast({ type: "success", message: "Vendor rejected successfully." });
      fetchVendors();
    } catch (error) {
      console.log(error);
      showToast({ type: "error", message: "Failed to reject vendor." });
    }
  };

  const handleAccountStatusChange = async (id, status) => {
    try {
      await axios.put(`${API}/account-status/${id}`, {
        accountStatus: status,
      });
      fetchVendors();
    } catch (error) {
      console.log(error);
      showToast({ type: "error", message: "Failed to update account status." });
    }
  };

  const openAreaModal = (vendor) => {
    setSelectedVendor(vendor);
    setAssignArea(vendor.assignedArea || "");
    setAssignRadius(vendor.assignedRadius || "");
    setShowAreaModal(true);
  };

  const handleAssignArea = async () => {
    try {
      if (!selectedVendor) return;
      await axios.put(`${API}/assign-area/${selectedVendor._id}`, {
        assignedArea: assignArea,
        assignedRadius: Number(assignRadius),
      });
      showToast({ type: "success", message: "Vendor area assigned successfully." });
      setShowAreaModal(false);
      setSelectedVendor(null);
      setAssignArea("");
      setAssignRadius("");
      fetchVendors();
    } catch (error) {
      console.log(error);
      showToast({ type: "error", message: "Failed to assign vendor area." });
    }
  };

  const handleDelete = async () => {
    if (!selectedVendor) return;
    try {
      await axios.delete(`${API}/${selectedVendor._id}`);
      showToast({ type: "success", message: "Vendor deleted successfully." });
      setDeleteModal(false);
      setSelectedVendor(null);
      fetchVendors();
    } catch (error) {
      console.log(error);
      showToast({ type: "error", message: "Failed to delete vendor." });
    }
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) =>
      vendor.shopName.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, vendors]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendor Management</h1>
          <p className="text-gray-500 mt-1">Review pending vendors, approve/reject requests, and assign delivery areas.</p>
        </div>
        <button
          onClick={() => navigate("/admin/vendors/add")}
          className="flex items-center gap-2 rounded-lg bg-[#1a5d1a] px-5 py-2.5 text-white hover:bg-[#154a15]"
        >
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      <SearchBox value={search} onChange={setSearch} onClear={() => setSearch("")} placeholder="Search vendors..." />

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-3 text-left">Shop Name</th>
              <th className="px-5 py-3 text-left">Phone</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Account Status</th>
              <th className="px-5 py-3 text-left">Assigned Area</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  Loading vendors...
                </td>
              </tr>
            ) : filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  No vendors found.
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor) => (
                <tr key={vendor._id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium">{vendor.shopName}</td>
                  <td className="px-5 py-4">{vendor.phone}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        vendor.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : vendor.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={vendor.accountStatus || "active"}
                      onChange={(e) => handleAccountStatusChange(vendor._id, e.target.value)}
                      className="w-full rounded-2xl border px-3 py-2"
                    >
                      <option value="active">Active</option>
                      <option value="hold">Hold</option>
                      <option value="suspended">Suspended</option>
                      <option value="deactivated">Deactivated</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    {vendor.assignedArea ? `${vendor.assignedArea}${vendor.assignedRadius ? ` (${vendor.assignedRadius} km)` : ""}` : "Not assigned"}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex flex-wrap justify-center gap-2">
                      {vendor.status === "pending" && (
                        <>
                          <button onClick={() => handleApprove(vendor._id)} className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600">
                            Approve
                          </button>
                          <button onClick={() => handleReject(vendor._id)} className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600">
                            Reject
                          </button>
                        </>
                      )}
                      {vendor.status === "approved" && (
                        <button onClick={() => openAreaModal(vendor)} className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                          {vendor.assignedArea ? "Edit Area" : "Assign Area"}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                        className="rounded-lg bg-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-300"
                        title="View Profile Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/vendors/edit/${vendor._id}`)}
                        className="rounded-lg bg-yellow-100 px-3 py-2 text-yellow-700 hover:bg-yellow-200"
                        title="Edit Profile"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setDeleteModal(true);
                        }}
                        className="rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200"
                        title="Delete Vendor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DeleteModal
        isOpen={deleteModal}
        onClose={() => {
          setDeleteModal(false);
          setSelectedVendor(null);
        }}
        onDelete={handleDelete}
      />

      {showAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-bold">Assign Vendor Area</h2>
            <p className="text-gray-600 mt-2">Set the area where this vendor can list products and receive orders.</p>
            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Area Name</span>
                <input
                  value={assignArea}
                  onChange={(e) => setAssignArea(e.target.value)}
                  className="mt-2 w-full rounded-2xl border px-4 py-3"
                  placeholder="Example: South Delhi"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Service Radius (km)</span>
                <input
                  type="number"
                  min={0}
                  value={assignRadius}
                  onChange={(e) => setAssignRadius(e.target.value)}
                  className="mt-2 w-full rounded-2xl border px-4 py-3"
                  placeholder="Example: 10"
                />
              </label>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => setShowAreaModal(false)} className="rounded-2xl border border-slate-300 px-6 py-3 text-slate-700 hover:border-slate-400">
                Cancel
              </button>
              <button onClick={handleAssignArea} className="rounded-2xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
                Save Area
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
