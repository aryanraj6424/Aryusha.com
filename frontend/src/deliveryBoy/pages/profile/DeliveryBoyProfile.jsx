import { useState } from "react";
import { useDeliveryBoy } from "../../context/DeliveryBoyContext";
import { User, Phone, Truck, LogOut, Edit3, CheckSquare, ShieldCheck, Mail } from "lucide-react";
import axios from "axios";

export default function DeliveryBoyProfile() {
  const { deliveryBoy, setDeliveryBoy, logout } = useDeliveryBoy();
  const [isEditing, setIsEditing] = useState(false);
  
  const [fullName, setFullName] = useState(deliveryBoy?.fullName || "");
  const [vehicleType, setVehicleType] = useState(deliveryBoy?.vehicleDetails?.type || "Bike");
  const [vehicleNumber, setVehicleNumber] = useState(deliveryBoy?.vehicleDetails?.number || "");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/delivery-boy/profile`, {
        fullName,
        vehicleType,
        vehicleNumber
      }, { headers });

      if (res.data.success) {
        const updated = res.data.deliveryBoy;
        setDeliveryBoy(updated);
        localStorage.setItem("deliveryBoy", JSON.stringify(updated));
        setMessage("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-800">My Profile</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manage your account details and vehicle settings</p>
      </div>

      {message && (
        <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl text-purple-700 text-xs font-bold text-center">
          {message}
        </div>
      )}

      {/* Profile Header Summary */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 text-center">
        <div className="w-20 h-20 bg-purple-100 text-[#6d28d9] rounded-full flex items-center justify-center mx-auto shadow-inner border border-purple-200">
          <User size={36} />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-800">{deliveryBoy?.fullName}</h3>
          <p className="text-xs text-slate-400 font-bold flex items-center justify-center gap-1 mt-0.5">
            <ShieldCheck size={14} className="text-purple-650" /> ID Verified Partner
          </p>
        </div>
      </div>

      {/* Details or Edit Form */}
      {!isEditing ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">Partner Details</h4>
            <button 
              onClick={() => setIsEditing(true)} 
              className="text-xs text-purple-650 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 size={12} /> Edit
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-slate-600 font-semibold pl-1">
            <div className="flex items-center gap-3">
              <User size={16} className="text-slate-400" />
              <div>
                <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Full Name</span>
                <span className="text-slate-850 font-extrabold text-xs">{deliveryBoy?.fullName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={16} className="text-slate-400" />
              <div>
                <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Contact phone</span>
                <span className="text-slate-855 font-extrabold text-xs">{deliveryBoy?.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Truck size={16} className="text-slate-400" />
              <div>
                <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Linked Vehicle</span>
                <span className="text-slate-850 font-extrabold text-xs">
                  {deliveryBoy?.vehicleDetails?.type} ({deliveryBoy?.vehicleDetails?.number || "No Plate Number"})
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Form */
        <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-150 rounded-3xl p-5 shadow-md space-y-4">
          <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider pb-2 border-b border-slate-50">
            Update Details
          </h4>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
              required
            />
          </div>

          {/* Vehicle type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold cursor-pointer"
            >
              <option value="Bike">Bike</option>
              <option value="Scooter">Scooter</option>
              <option value="E-Bike">Electric Bike</option>
              <option value="Cycle">Bicycle</option>
            </select>
          </div>

          {/* Vehicle Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plate Number</label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-bold transition border border-rose-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
      >
        <LogOut size={16} /> Sign Out Account
      </button>

    </div>
  );
}
