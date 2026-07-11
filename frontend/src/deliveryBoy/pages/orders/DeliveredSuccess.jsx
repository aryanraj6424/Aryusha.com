import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, DollarSign } from "lucide-react";

export default function DeliveredSuccess() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center px-4 py-8 text-center space-y-8">
      
      {/* Icon checkmark animated */}
      <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-lg border border-emerald-150 animate-bounce">
        <CheckCircle2 size={56} />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-850 tracking-tight">Delivery Confirmed!</h2>
        <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed">
          The order has been marked as delivered. Payout credits have been credited to your active wallet immediately.
        </p>
      </div>

      {/* Recap details card */}
      <div className="w-full bg-white rounded-3xl p-5 border border-slate-150 shadow-sm space-y-4 max-w-xs">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400">Order ID:</span>
          <span className="font-extrabold text-slate-800">#{id?.slice(-6).toUpperCase() || "QK-ORDER"}</span>
        </div>
        <div className="h-px bg-slate-50"></div>
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400">Status:</span>
          <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
            Delivered
          </span>
        </div>
        <div className="h-px bg-slate-50"></div>
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400">Earned:</span>
          <span className="font-black text-emerald-700 text-sm flex items-center gap-0.5">
            ₹42.00
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-2.5">
        <button
          onClick={() => navigate("/delivery-boy/orders")}
          className="w-full py-4 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          Go to My Assignments <ArrowRight size={18} />
        </button>
        <button
          onClick={() => navigate("/delivery-boy/dashboard")}
          className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold transition border border-slate-200 cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>

    </div>
  );
}
