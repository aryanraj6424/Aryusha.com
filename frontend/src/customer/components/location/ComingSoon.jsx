import React from "react";
import { MapPin } from "lucide-react";

/**
 * Reusable ComingSoon component to display when no vendors cover the customer's location.
 */
function ComingSoon() {
  return (
    <div className="py-16 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm max-w-xl mx-auto my-8 space-y-6">
      <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-4xl mx-auto mb-2 animate-bounce">
        🚧
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-850">We are coming soon in this area!</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed font-medium">
          We don't have any delivery partners serving your current coordinates or address yet. We are expanding rapidly and hope to serve you very soon!
        </p>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-purple-700 bg-purple-50 px-4 py-2.5 rounded-2xl w-fit mx-auto border border-purple-100">
        <MapPin size={14} className="text-purple-600 animate-pulse" />
        Please check back shortly or select a different address
      </div>
    </div>
  );
}

export default ComingSoon;
