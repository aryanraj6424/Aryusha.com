import React, { useEffect, useState } from "react";
import { useVendor } from "../../context/VendorContext";
import { MapPin, ShieldAlert, Navigation, Map } from "lucide-react";
import CoverageMap from "../../components/CoverageMap";

export default function VendorAssignedArea() {
  const { vendor, refresh } = useVendor(); // use vendor context dynamically
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Refresh vendor profile on mount to sync coordinates in real time
    const syncProfile = async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (error) {
        console.error("Failed to sync vendor location profile:", error);
      } finally {
        setLoading(false);
      }
    };
    syncProfile();
  }, []);

  if (loading || !vendor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const hasLocation = vendor.latitude !== undefined && vendor.longitude !== undefined && vendor.latitude !== null && vendor.longitude !== null;
  const radius = vendor.deliveryRadius || 0;
  const serviceAreas = vendor.serviceAreas || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Assigned Service Area</h1>
          <p className="text-slate-500 font-medium">View your delivery range and pinned coordinates. This screen is read-only.</p>
        </div>
        <button
          onClick={() => refresh()}
          className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 font-bold text-xs text-slate-600 transition flex items-center gap-1.5 shadow-sm"
        >
          🔄 Sync Area Info
        </button>
      </div>

      {!hasLocation ? (
        /* Empty State */
        <div className="py-20 px-6 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-4xl mx-auto mb-2">
            📍
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-850">Your service area hasn't been assigned yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed font-medium">
              Deliveries cannot be serviced until coordinates and range are set. Please contact the administrator to assign your store's coverage area.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 px-4 py-2.5 rounded-2xl w-fit mx-auto border border-rose-100">
            <ShieldAlert size={14} className="text-rose-600" />
            Awaiting Administrative Assignment
          </div>
        </div>
      ) : (
        /* Map and Details Card */
        <div className="space-y-6">
          <div className="border p-6 rounded-3xl bg-white shadow-sm space-y-6">
            {/* Visual Header */}
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                <Navigation size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Active Delivery Coverage</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Service status is active & serving customers
                </p>
              </div>
            </div>

            {/* Reusable CoverageMap in Read-Only Mode */}
            <CoverageMap
              latitude={vendor.latitude}
              longitude={vendor.longitude}
              radiusKm={radius}
              isEditable={false}
              height="h-96"
            />

            {/* Info Details below */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">Location Pinned</span>
                <p className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <MapPin size={14} className="text-purple-600" />
                  {vendor.latitude.toFixed(6)}, {vendor.longitude.toFixed(6)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">Delivery Range Limit</span>
                <p className="text-sm font-bold text-slate-700 font-extrabold">
                  {radius} KM radius circle
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">Profile Last Updated</span>
                <p className="text-sm font-bold text-slate-700">
                  {vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleString() : "Recently synced"}
                </p>
              </div>
            </div>
          </div>

          {/* Service Pincodes list assigned by admin */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Map size={18} className="text-purple-600" />
                <h3 className="font-extrabold text-slate-800 text-base">Assigned Service Areas & Pincodes</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                {serviceAreas.length} Areas Pinned
              </span>
            </div>
            <div className="overflow-x-auto">
              {serviceAreas.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold text-sm">
                  No additional service pincodes assigned yet. Pincodes added by admin will appear here.
                </div>
              ) : (
                <table className="w-full text-sm font-semibold text-slate-650">
                  <thead className="bg-slate-50/70 border-b text-xs font-bold text-slate-500 uppercase tracking-wider text-left">
                    <tr>
                      <th className="px-6 py-4">Pincode</th>
                      <th className="px-6 py-4">Area Name</th>
                      <th className="px-6 py-4">City</th>
                      <th className="px-6 py-4">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceAreas.map((area, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 text-purple-600 font-black tracking-wide">{area.pincode}</td>
                        <td className="px-6 py-4 text-slate-800 font-extrabold">{area.areaName}</td>
                        <td className="px-6 py-4 text-slate-700">{area.city}</td>
                        <td className="px-6 py-4 text-slate-500">{area.state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
