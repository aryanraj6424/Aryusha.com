import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Navigation, MapPin, Store, CheckCircle } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { loadGoogleMaps } from "../../../utils/googleMapsLoader";

/**
 * Delivery partner active order map showing route from merchant store to customer dropoff address.
 * 
 * MIGRATED FROM LEAFLET TO GOOGLE MAPS JS API:
 * - Replaced Leaflet `L.map` & `L.tileLayer` with `google.maps.Map`
 * - Replaced Leaflet `L.divIcon` markers with Google Maps `google.maps.Marker` using SVG Data URIs matching original Leaflet styling
 * - Replaced Leaflet `L.polyline` with Google Maps dashed `google.maps.Polyline`
 * - Replaced Leaflet `L.latLngBounds` and `fitBounds([50,50])` with `google.maps.LatLngBounds`
 */
export default function OnTheWay() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const polylineRef = useRef(null);

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

    // Collect all vendor pickup stores (multi-vendor support)
    const subOrders = order.vendorSubOrders || [];
    const pickupStores = subOrders.length > 0
      ? subOrders.map((sub, idx) => {
          const v = sub.vendorId || {};
          return {
            id: v._id || idx,
            shopName: v.shopName || `Store #${idx + 1}`,
            lat: Number(v.latitude || order.vendorId?.latitude || 0),
            lng: Number(v.longitude || order.vendorId?.longitude || 0),
            isPicked: sub.pickupStatus === "PICKED"
          };
        }).filter(s => s.lat !== 0 && s.lng !== 0)
      : [
          {
            id: order.vendorId?._id || "single",
            shopName: order.vendorId?.shopName || "Merchant Store",
            lat: Number(order.vendorId?.latitude || 0),
            lng: Number(order.vendorId?.longitude || 0),
            isPicked: false
          }
        ].filter(s => s.lat !== 0 && s.lng !== 0);

    const customerLat = Number(order.deliveryAddress?.latitude || 0);
    const customerLng = Number(order.deliveryAddress?.longitude || 0);
    const hasCustomerCoords = customerLat !== 0 && customerLng !== 0;

    let isMounted = true;

    loadGoogleMaps().then((google) => {
      if (!isMounted || !mapRef.current) return;

      const customerPos = hasCustomerCoords ? { lat: customerLat, lng: customerLng } : null;

      // Helper to generate SVG Data URI for Store Markers (Green if picked up, Purple if pending)
      const getStoreIcon = (isPicked, stopNum) => {
        const bg = isPicked ? "#10b981" : "#0B2214";
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="${bg}" stroke="#ffffff" stroke-width="2"/>
          <text x="18" y="22" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">${stopNum}</text>
        </svg>`;
        return {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        };
      };

      const getCustomerIcon = () => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="#e11d48" stroke="#ffffff" stroke-width="2"/>
          <g transform="translate(6, 6)" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </g>
        </svg>`;
        return {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        };
      };

      const bounds = new google.maps.LatLngBounds();
      const pathWaypoints = [];

      if (!mapInstanceRef.current) {
        const initialCenter = pickupStores[0] ? { lat: pickupStores[0].lat, lng: pickupStores[0].lng } : (customerPos || { lat: 25.6727, lng: 85.8361 });

        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 13,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
      }

      // Add Store Markers for all pickup stops
      pickupStores.forEach((store, idx) => {
        const pos = { lat: store.lat, lng: store.lng };
        pathWaypoints.push(pos);
        bounds.extend(pos);

        const marker = new google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          icon: getStoreIcon(store.isPicked, idx + 1),
          title: `Stop #${idx + 1}: ${store.shopName}`,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div><strong>Stop #${idx + 1}:</strong> ${store.shopName}<br/>Status: ${store.isPicked ? '✓ Picked Up' : 'Pending Pickup'}</div>`,
        });
        marker.addListener("click", () => infoWindow.open(mapInstanceRef.current, marker));
      });

      // Add Customer Dropoff Marker
      if (customerPos) {
        pathWaypoints.push(customerPos);
        bounds.extend(customerPos);

        const customerMarker = new google.maps.Marker({
          position: customerPos,
          map: mapInstanceRef.current,
          icon: getCustomerIcon(),
          title: `Dropoff: ${order.deliveryAddress?.fullName || "Customer"}`,
        });

        const customerInfoWindow = new google.maps.InfoWindow({
          content: `<strong>Customer Dropoff:</strong> ${order.deliveryAddress?.fullName || "Customer"}`,
        });
        customerMarker.addListener("click", () => customerInfoWindow.open(mapInstanceRef.current, customerMarker));
      }

      // Draw routing polyline path through all waypoints
      if (pathWaypoints.length >= 2) {
        const lineSymbol = {
          path: "M 0,-1 0,1",
          strokeOpacity: 1,
          scale: 4,
        };

        if (polylineRef.current) polylineRef.current.setMap(null);

        polylineRef.current = new google.maps.Polyline({
          path: pathWaypoints,
          geodesic: true,
          strokeColor: '#0B2214',
          strokeOpacity: 0,
          icons: [
            {
              icon: lineSymbol,
              offset: "0",
              repeat: "16px",
            },
          ],
          map: mapInstanceRef.current,
        });
      }

      // Fit map view to bounds
      if (!bounds.isEmpty()) {
        mapInstanceRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
      }

      const timer = setTimeout(() => {
        if (mapInstanceRef.current && google.maps.event) {
          google.maps.event.trigger(mapInstanceRef.current, "resize");
        }
      }, 200);

      return () => clearTimeout(timer);
    }).catch((err) => {
      console.error("Google Maps Load Error in OnTheWay:", err);
    });

    return () => {
      isMounted = false;
    };
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
            className="w-full py-4 bg-[#0B2214] hover:bg-[#153e25] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
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
