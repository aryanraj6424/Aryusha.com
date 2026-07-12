import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Navigation, MapPin, Store, CheckCircle } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { useToast } from "../../../components/Toast";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function OnTheWay() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/orders/${id}`, { headers });
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.error("Failed to load map order details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  useEffect(() => {
    if (!order || !mapRef.current) return;

    // Use order coordinates, fallback to default Delhi values if missing
    const storeLat = Number(order.vendorId?.latitude) || 28.6139;
    const storeLng = Number(order.vendorId?.longitude) || 77.2090;

    const customerLat = Number(order.deliveryAddress?.latitude) || 28.6289;
    const customerLng = Number(order.deliveryAddress?.longitude) || 77.3659;

    if (!mapInstanceRef.current) {
      // Setup Leaflet map
      mapInstanceRef.current = L.map(mapRef.current).setView([storeLat, storeLng], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Create Custom Icons using simple Leaflet divIcon
      const storeIcon = L.divIcon({
        html: `<div class="bg-purple-600 text-white p-2 rounded-full border border-white shadow flex items-center justify-center w-8 h-8"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const customerIcon = L.divIcon({
        html: `<div class="bg-rose-600 text-white p-2 rounded-full border border-white shadow flex items-center justify-center w-8 h-8"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      // Add Markers
      const storeMarker = L.marker([storeLat, storeLng], { icon: storeIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>Store:</strong> ${order.vendorId?.shopName || "Merchant"}`);

      const customerMarker = L.marker([customerLat, customerLng], { icon: customerIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>Dropoff:</strong> ${order.deliveryAddress?.fullName}`);

      // Draw routing polyline path
      const routePath = L.polyline([[storeLat, storeLng], [customerLat, customerLng]], {
        color: '#6d28d9',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 12'
      }).addTo(mapInstanceRef.current);

      // Fit map view to coordinate bounds
      const bounds = L.latLngBounds([
        [storeLat, storeLng],
        [customerLat, customerLng]
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // Invalidate Leaflet map layout dimensions after loading
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [order]);

  const handleUpdateStatus = async (nextStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = {
        status: nextStatus,
        latitude: order.deliveryAddress?.latitude || 28.6289,
        longitude: order.deliveryAddress?.longitude || 77.3659,
        note: `Rider reached dropoff point`
      };

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/delivery-boy/orders/${id}/status`, payload, { headers });
      
      if (res.data.success) {
        setOrder(res.data.order);
        showToast({ type: "success", message: `Status updated to: ${nextStatus.replace(/_/g, " ")}` });
        if (nextStatus === "Reached_Customer") {
          navigate(`/delivery-boy/orders/${id}/verify`);
        }
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to update status" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-650"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4">
      {/* Back Header */}
      <button 
        onClick={() => navigate(`/delivery-boy/orders/${id}`)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-extrabold text-xs transition"
      >
        <ArrowLeft size={16} /> Back to Details
      </button>

      {/* Map Content Box */}
      <div className="flex-1 w-full bg-slate-200 rounded-3xl overflow-hidden border border-slate-150 relative shadow-inner">
        <div ref={mapRef} className="w-full h-full min-h-[300px]"></div>
      </div>

      {/* Action panel */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-md space-y-4">
        
        {/* Addresses checklist summary */}
        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
          <div className="space-y-1">
            <div className="flex items-center gap-1 font-bold text-slate-400 uppercase text-[8px] tracking-wider">
              <Store size={10} className="text-purple-600" />
              <span>Store pickup</span>
            </div>
            <p className="truncate font-extrabold text-slate-700">{order.vendorId?.shopName}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 font-bold text-slate-400 uppercase text-[8px] tracking-wider">
              <MapPin size={10} className="text-rose-600" />
              <span>Drop off</span>
            </div>
            <p className="truncate font-extrabold text-slate-700">{order.deliveryAddress?.fullName}</p>
          </div>
        </div>

        {/* Buttons */}
        {order.deliveryStatus === "On_the_Way" && (
          <button
            onClick={() => handleUpdateStatus("Reached_Customer")}
            disabled={updating}
            className="w-full py-4 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle size={18} /> {updating ? "Updating..." : "I have Reached Customer"}
          </button>
        )}

        {order.deliveryStatus === "Reached_Customer" && (
          <button
            onClick={() => navigate(`/delivery-boy/orders/${id}/verify`)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition shadow-lg shadow-emerald-250 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle size={18} /> Enter Verification OTP
          </button>
        )}
      </div>
      
    </div>
  );
}
