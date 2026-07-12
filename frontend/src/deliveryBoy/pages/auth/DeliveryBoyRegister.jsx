import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDeliveryBoy } from "../../context/DeliveryBoyContext";
import { User, Phone, Lock, Truck, Shield, ArrowRight } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function DeliveryBoyRegister() {
  const navigate = useNavigate();
  const { login } = useDeliveryBoy();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !phone || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/delivery-boy/auth/register`, {
        fullName,
        phone,
        password,
        vehicleType,
        vehicleNumber
      });

      if (res.data.success) {
        showToast({ type: "success", message: "Registration successful! You are approved and logged in." });
        login(res.data.token, res.data.deliveryBoy);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 border border-slate-100">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 bg-purple-100 text-[#6d28d9] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Rider Registration</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Join our delivery network</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-sm"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Mobile Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-sm"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-sm"
                required
              />
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-sm cursor-pointer"
              >
                <option value="Bike">Bike (Motorcycle)</option>
                <option value="Scooter">Scooter</option>
                <option value="E-Bike">Electric Bike</option>
                <option value="Cycle">Bicycle</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Plate Number</label>
              <div className="relative">
                <Truck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. DL3C AB 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Registering..." : "Submit Registration"} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs font-semibold text-slate-400">
          Already registered?{" "}
          <Link to="/delivery-boy/login" className="text-[#6d28d9] hover:text-[#5b21b6] font-black underline">
            Login Here
          </Link>
        </div>

      </div>
    </div>
  );
}
