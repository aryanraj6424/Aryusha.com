import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Navigation, MapPin, Store, CheckCircle, Phone, ExternalLink, Compass, Clock, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { loadGoogleMaps } from "../../../utils/googleMapsLoader";

/**
 * Delivery partner active order live navigation map.
 * Features real-time GPS tracking, Google Maps Directions API routing,
 * real-time ETA/distance calculation, turn-by-turn instruction steps,
 * and direct launch to Google Maps App navigation.
 */
export default function OnTheWay() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: "", duration: "", steps: [] });
  const [showSteps, setShowSteps] = useState(false);
  const { showToast } = useToast();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

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

  // 1. Continuous Live GPS Watch for Delivery Boy
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRiderLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.warn("Initial GPS capture error:", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch position continuously as rider moves
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setRiderLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.warn("Watch position error:", err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 2. Resolve Exact Customer Drop Coordinates (Direct GPS or Geocoding fallback)
  useEffect(() => {
    if (!order) return;

    const lat = Number(order.deliveryAddress?.latitude || 0);
    const lng = Number(order.deliveryAddress?.longitude || 0);

    if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
      setCustomerCoords({ lat, lng });
    } else {
      // Fallback: Geocode the customer's exact text address
      loadGoogleMaps().then((google) => {
        const geocoder = new google.maps.Geocoder();
        const addressStr = `${order.deliveryAddress?.houseNo || ''}, ${order.deliveryAddress?.area || ''}, ${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} ${order.deliveryAddress?.pincode || ''}`;
        
        geocoder.geocode({ address: addressStr }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const loc = results[0].geometry.location;
            setCustomerCoords({ lat: loc.lat(), lng: loc.lng() });
          } else {
            // Secondary Fallback: Vendor store location offset
            const vendorLat = Number(order.vendorId?.latitude || 28.6139);
            const vendorLng = Number(order.vendorId?.longitude || 77.2090);
            setCustomerCoords({ lat: vendorLat + 0.015, lng: vendorLng + 0.015 });
          }
        });
      }).catch((err) => console.error("Geocoder load error:", err));
    }
  }, [order]);

  // 3. Render Google Maps & Turn-by-Turn Route Navigation
  useEffect(() => {
    if (!order || !mapRef.current || !customerCoords) return;

    let isMounted = true;

    loadGoogleMaps().then((google) => {
      if (!isMounted || !mapRef.current) return;

      const originPos = riderLocation || {
        lat: Number(order.vendorId?.latitude || 28.6139),
        lng: Number(order.vendorId?.longitude || 77.2090)
      };

      // Initialize Map instance if not created
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: originPos,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
        });

        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: true, // We use custom SVG markers for Rider and Customer
          polylineOptions: {
            strokeColor: "#047857",
            strokeWeight: 6,
            strokeOpacity: 0.9,
          }
        });
      }

      // Customer Icon SVG Pin
      const customerSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#e11d48" stroke="#FFFFFF" stroke-width="3"/>
          <path d="M20 10 C14.5 10 10 14.5 10 20 C10 26.5 20 32 20 32 C20 32 30 26.5 30 20 C30 14.5 25.5 10 20 10 Z" fill="#FFFFFF"/>
          <circle cx="20" cy="18" r="4" fill="#e11d48"/>
        </svg>
      `)}`;

      if (!customerMarkerRef.current) {
        customerMarkerRef.current = new google.maps.Marker({
          position: customerCoords,
          map: mapInstanceRef.current,
          title: `Dropoff: ${order.deliveryAddress?.fullName || "Customer"}`,
          icon: {
            url: customerSvg,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40)
          }
        });
      } else {
        customerMarkerRef.current.setPosition(customerCoords);
      }

      // Rider Marker SVG
      const riderSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="42" height="42" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
          <circle cx="21" cy="21" r="19" fill="#0B2214" stroke="#FFFFFF" stroke-width="3"/>
          <circle cx="21" cy="21" r="10" fill="#047857"/>
          <text x="21" y="25" font-size="12" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">🛵</text>
        </svg>
      `)}`;

      if (!riderMarkerRef.current) {
        riderMarkerRef.current = new google.maps.Marker({
          position: originPos,
          map: mapInstanceRef.current,
          title: "Your Live Location",
          icon: {
            url: riderSvg,
            scaledSize: new google.maps.Size(42, 42),
            anchor: new google.maps.Point(21, 21)
          }
        });
      } else {
        riderMarkerRef.current.setPosition(originPos);
      }

      // Compute Driving Route via Directions API
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: originPos,
          destination: customerCoords,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result && directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result);

            const leg = result.routes[0]?.legs[0];
            if (leg) {
              setRouteInfo({
                distance: leg.distance?.text || "",
                duration: leg.duration?.text || "",
                steps: leg.steps?.map(s => s.instructions.replace(/<[^>]*>/g, "")) || []
              });
            }
          }
        }
      );
    }).catch((err) => console.error("Google Maps load error in OnTheWay:", err));

    return () => {
      isMounted = false;
    };
  }, [order, customerCoords, riderLocation]);

  const handleUpdateStatus = async (nextStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = {
        status: nextStatus,
        latitude: riderLocation?.lat || customerCoords?.lat || 28.6289,
        longitude: riderLocation?.lng || customerCoords?.lng || 77.3659,
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

  const handleOpenExternalGoogleMaps = () => {
    if (!customerCoords) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${customerCoords.lat},${customerCoords.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B2214]"></div>
      </div>
    );
  }

  const dropAddressStr = `${order.deliveryAddress?.houseNo || ''}, ${order.deliveryAddress?.area || ''}, ${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.pincode || ''}`;

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-3">
      {/* Back Header & External Navigation Button */}
      <div className="flex items-center justify-between gap-2">
        <button 
          onClick={() => navigate(`/delivery-boy/orders/${id}`)}
          className="flex items-center gap-1.5 text-slate-600 hover:text-[#0B2214] font-black text-xs transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Details
        </button>

        <button
          onClick={handleOpenExternalGoogleMaps}
          className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-sm transition cursor-pointer"
        >
          <ExternalLink size={13} /> Open in Google Maps
        </button>
      </div>

      {/* Floating Live Navigation Header Banner */}
      <div className="bg-[#0B2214] text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0">
            <Compass size={20} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Live Navigation</span>
              {routeInfo.duration && (
                <span className="text-xs font-black bg-[#047857] text-white px-2 py-0.5 rounded-full">
                  {routeInfo.duration} ({routeInfo.distance})
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-100 truncate mt-0.5">{order.deliveryAddress?.fullName}</p>
            <p className="text-[10px] text-slate-300 truncate font-medium">{dropAddressStr}</p>
          </div>
        </div>

        {order.deliveryAddress?.phoneNumber && (
          <a
            href={`tel:${order.deliveryAddress.phoneNumber}`}
            className="p-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl transition shrink-0"
            title="Call Customer"
          >
            <Phone size={18} />
          </a>
        )}
      </div>

      {/* Interactive Map Box */}
      <div className="flex-1 w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative shadow-inner">
        <div ref={mapRef} className="w-full h-full min-h-[320px]"></div>

        {/* Turn-by-Turn Instruction Steps Toggle Bar */}
        {routeInfo.steps.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-2.5 shadow-lg space-y-2">
            <div
              onClick={() => setShowSteps(!showSteps)}
              className="flex justify-between items-center cursor-pointer text-xs font-extrabold text-[#0B2214] px-1"
            >
              <span className="flex items-center gap-1.5">
                <Navigation size={14} className="text-[#047857]" />
                <span>Turn-by-Turn Route Steps ({routeInfo.steps.length})</span>
              </span>
              {showSteps ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>

            {showSteps && (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1 border-t border-slate-100 pr-1 text-xs text-slate-700 font-semibold">
                {routeInfo.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] leading-snug">
                    <span className="w-4 h-4 bg-emerald-50 text-[#047857] rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-md space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pickup Store</span>
            <p className="truncate font-extrabold text-slate-800">{order.vendorId?.shopName || "Partner Merchant"}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Customer Drop</span>
            <p className="truncate font-extrabold text-[#047857]">{order.deliveryAddress?.fullName}</p>
          </div>
        </div>

        {order.deliveryStatus === "On_the_Way" && (
          <button
            onClick={() => handleUpdateStatus("Reached_Customer")}
            disabled={updating}
            className="w-full py-3.5 bg-[#0B2214] hover:bg-[#062c1a] text-white rounded-2xl font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle size={18} /> {updating ? "Updating..." : "I Have Reached Customer"}
          </button>
        )}

        {order.deliveryStatus === "Reached_Customer" && (
          <button
            onClick={() => navigate(`/delivery-boy/orders/${id}/verify`)}
            className="w-full py-3.5 bg-[#047857] hover:bg-[#065f46] text-white rounded-2xl font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle size={18} /> Enter Verification OTP
          </button>
        )}
      </div>
    </div>
  );
}
