import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PhoneCall, HelpCircle, Send, MessageSquare, CheckCircle2 } from "lucide-react";

export default function Support() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("App Issues");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setDescription("");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header back */}
      <button 
        onClick={() => navigate("/delivery-boy/dashboard")}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-extrabold text-xs transition"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-800">Support Center</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact rider support and dispatcher desks</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />
          <span>Support Ticket Submitted! Our dispatcher team will contact you shortly.</span>
        </div>
      )}

      {/* Dispatch Hotline cards */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-855 text-xs uppercase tracking-wider">Emergency Hotlines</h3>
        <div className="space-y-2.5 text-xs font-semibold">
          
          <a 
            href="tel:18001111" 
            className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-2xl hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <PhoneCall size={16} className="text-purple-650" />
              <div>
                <p className="font-black text-slate-800 text-xs">Rider Support Line</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Available 24x7 for active deliveries</p>
              </div>
            </div>
            <span className="text-[#6d28d9] font-bold text-xs uppercase">Call</span>
          </a>

          <a 
            href="tel:18002222" 
            className="flex items-center justify-between p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl hover:bg-rose-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={16} className="text-rose-600" />
              <div>
                <p className="font-black text-rose-800 text-xs">Accident & Emergency Desk</p>
                <p className="text-[10px] text-rose-400 font-semibold mt-0.5">Report route accidents or vehicle breakdown</p>
              </div>
            </div>
            <span className="text-rose-600 font-bold text-xs uppercase">Call</span>
          </a>

        </div>
      </div>

      {/* Ticket form */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">File Support Inquiry</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Topic</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs font-semibold cursor-pointer"
            >
              <option value="App Issues">Rider App Bugs / Location Failures</option>
              <option value="Payout Issues">Wallet / Cash Out Failures</option>
              <option value="Customer Refusal">Customer Refused OTP / Address Unreachable</option>
              <option value="Order Issues">Items Missing / Package Damaged</option>
              <option value="Other">General Queries</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              placeholder="Describe your query in detail..."
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs font-semibold"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send size={14} /> {submitting ? "Sending Inquiry..." : "Submit Ticket"}
          </button>
        </form>
      </div>

    </div>
  );
}
