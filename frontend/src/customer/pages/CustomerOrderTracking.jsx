import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, User, Phone, CheckCircle2, Clock, MapPin, KeyRound, Copy, Star } from "lucide-react";

export default function CustomerOrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Fetch tracking details
  const fetchTracking = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/customer/orders/${id}/tracking`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setTracking(res.data.tracking);
      }
    } catch (err) {
      console.error("Failed to fetch order tracking info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTracking();

    // Start 6-second short polling interval for live tracking & status updates
    const timer = setInterval(() => {
      fetchTracking();
    }, 6000);

    return () => clearInterval(timer);
  }, [id]);

  // Leaflet Map Initialization and Updates
  useEffect(() => {
    if (!tracking) return;

    const deliveryStatus = tracking.deliveryStatus;
    const isTransiting = ["On_the_Way", "Reached_Customer"].includes(deliveryStatus);
    const trackingEnabled = tracking.liveTracking !== false;

    // We only show map view if transit is active and live location is enabled
    if (!isTransiting || !trackingEnabled || !tracking.deliveryBoy) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        riderMarkerRef.current = null;
        dropoffMarkerRef.current = null;
        polylineRef.current = null;
      }
      return;
    }

    const riderLat = Number(tracking.deliveryBoy.latitude) || 28.6139;
    const riderLng = Number(tracking.deliveryBoy.longitude) || 77.2090;
    
    const dropoffLat = Number(tracking.deliveryAddress?.latitude) || 28.6289;
    const dropoffLng = Number(tracking.deliveryAddress?.longitude) || 77.3659;

    if (!mapRef.current) return;

    // Fix default Leaflet icon paths
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });

    if (!mapInstanceRef.current) {
      // 1. Setup Leaflet map instance
      mapInstanceRef.current = L.map(mapRef.current).setView([riderLat, riderLng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Create Custom Icons
      const riderIcon = L.divIcon({
        html: `<div class="bg-purple-600 text-white p-2 rounded-full border-2 border-white shadow flex items-center justify-center w-9 h-9"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></div>`,
        className: 'custom-leaflet-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      const customerIcon = L.divIcon({
        html: `<div class="bg-rose-600 text-white p-2 rounded-full border-2 border-white shadow flex items-center justify-center w-9 h-9"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
        className: 'custom-leaflet-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      // Place markers
      riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: riderIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>Delivery Agent</strong><br/>Heading towards your dropoff location`);

      dropoffMarkerRef.current = L.marker([dropoffLat, dropoffLng], { icon: customerIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>Your Dropoff</strong><br/>${tracking.deliveryAddress?.fullName}`);

      // Draw polyline route
      polylineRef.current = L.polyline([[riderLat, riderLng], [dropoffLat, dropoffLng]], {
        color: '#7c3aed',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 10'
      }).addTo(mapInstanceRef.current);

      // Fit map boundary
      const bounds = L.latLngBounds([[riderLat, riderLng], [dropoffLat, dropoffLng]]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });

    } else {
      // 2. Smoothly update marker and route positions on poll interval updates
      riderMarkerRef.current.setLatLng([riderLat, riderLng]);
      polylineRef.current.setLatLngs([[riderLat, riderLng], [dropoffLat, dropoffLng]]);
    }

    // Auto fit boundary if markers move significantly
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [tracking]);

  const handleCopyOtp = () => {
    if (!tracking?.deliveryOtp) return;
    navigator.clipboard.writeText(tracking.deliveryOtp);
    alert("OTP copied to clipboard!");
  };

  const submitFeedbackRating = () => {
    if (rating === 0) return;
    setRatingSubmitted(true);
    alert(`Thank you for rating your delivery experience: ${rating} Stars!`);
  };

  if (loading && !tracking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3 animate-pulse"></div>
        <p className="text-slate-500 font-bold text-sm">Initializing order tracking...</p>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Tracking details unavailable.</h2>
        <button onClick={() => navigate("/customer/orders")} className="px-4 py-2 bg-purple-650 text-white rounded-xl font-bold">
          Go to My Orders
        </button>
      </div>
    );
  }

  // Delivery status list
  const steps = ["Placed", "Assigned", "Picked_Up", "On_the_Way", "Reached_Customer", "Delivered"];
  const currentStepIdx = steps.indexOf(tracking.deliveryStatus === "None" ? "Placed" : tracking.deliveryStatus);
  const isDelivered = tracking.deliveryStatus === "Delivered";

  const getStepColor = (idx) => {
    if (idx <= currentStepIdx) return "bg-purple-600 text-white border-purple-600";
    return "bg-white text-slate-400 border-slate-200";
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      
      {/* Back to list */}
      <button 
        onClick={() => navigate("/customer/orders")}
        className="flex items-center gap-2 text-slate-450 hover:text-slate-800 font-extrabold text-xs transition cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to My Orders
      </button>

      {/* Header card info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Track Delivery</h1>
          <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Order #{tracking.orderId}</p>
        </div>

        {/* ETA badge */}
        {tracking.eta && !isDelivered && (
          <div className="bg-purple-50 border border-purple-100 px-4 py-2 rounded-2xl text-right">
            <span className="text-[9px] text-purple-650 font-black block uppercase tracking-wider">Estimated Delivery</span>
            <span className="text-xs font-black text-slate-800 flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-purple-600" /> {tracking.eta}
            </span>
          </div>
        )}
      </div>

      {/* ── 1. STEP PROGRESS TIMELINE ── */}
      <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Delivery Status</h3>
        
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 relative py-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isActive = idx === currentStepIdx;
            return (
              <div key={step} className="flex flex-col items-center text-center space-y-1.5 relative">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs transition shadow-sm ${getStepColor(idx)} ${
                  isActive ? "ring-4 ring-purple-100 animate-pulse" : ""
                }`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  isCompleted ? "text-purple-700" : "text-slate-400"
                }`}>
                  {step.replace(/_/g, " ").replace("Reached Customer", "Reached")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. LIVE LOCATION MAP ── */}
      {["On_the_Way", "Reached_Customer"].includes(tracking.deliveryStatus) && tracking.liveTracking !== false && tracking.deliveryBoy && (
        <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden space-y-2.5 p-4">
          <div className="flex items-center gap-1.5 px-1 pt-1">
            <MapPin size={16} className="text-rose-600" />
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-slate-400">Live Delivery Route</h3>
          </div>
          <div ref={mapRef} className="h-64 rounded-2xl border border-slate-200 z-10" />
        </div>
      )}

      {/* ── 3. SHARE OTP WIDGET ── */}
      {tracking.deliveryStatus === "Reached_Customer" && tracking.deliveryOtp && (
        <div className="bg-amber-50/50 border border-dashed border-amber-250 p-6 rounded-3xl text-center space-y-4 shadow-sm animate-pulse-subtle">
          <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
            <KeyRound size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Share Delivery OTP</h3>
            <p className="text-xs text-slate-500 font-medium">Provide this security pin to the rider once you collect your order.</p>
          </div>
          
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            <div className="flex-1 bg-white border border-amber-200 py-3 rounded-2xl font-black text-2xl tracking-[8px] text-amber-900 text-center pl-[8px] shadow-sm select-all">
              {tracking.deliveryOtp}
            </div>
            <button
              onClick={handleCopyOtp}
              className="p-3 bg-white hover:bg-slate-50 border border-amber-200 rounded-2xl text-amber-800 cursor-pointer shadow-sm"
              title="Copy OTP to clipboard"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── 4. RIDER CARD INFO ── */}
      {tracking.deliveryBoy && (
        <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-50 text-purple-700 font-black rounded-2xl flex items-center justify-center text-lg">
              {tracking.deliveryBoy.fullName.charAt(0)}
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Assigned Rider</span>
              <h4 className="font-extrabold text-slate-800 text-sm">{tracking.deliveryBoy.fullName}</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                ★ {tracking.deliveryBoy.rating} Delivery Partner
              </p>
            </div>
          </div>

          <a 
            href={`tel:${tracking.deliveryBoy.phone}`}
            className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl shadow-inner font-extrabold text-xs flex items-center gap-1.5 transition"
          >
            <Phone size={14} /> Call Partner
          </a>
        </div>
      )}

      {/* ── 5. POST-DELIVERY RATINGS WIDGET ── */}
      {isDelivered && (
        <div className="bg-emerald-50/20 border border-emerald-100 p-6 rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Order Delivered Successfully</h3>
            <p className="text-xs text-slate-500 font-medium">Thank you! Your package was verified and completed.</p>
          </div>

          {!ratingSubmitted ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-500 font-semibold">Rate your delivery partner experience:</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-115 transition"
                  >
                    <Star 
                      size={24} 
                      className={star <= rating ? "fill-yellow-400 stroke-yellow-500" : "text-slate-300"} 
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <button
                  onClick={submitFeedbackRating}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-5 py-2 rounded-xl transition cursor-pointer"
                >
                  Submit Rating
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-emerald-700 font-bold">Feedback submitted. Thank you for your review!</p>
          )}
        </div>
      )}

    </div>
  );
}
