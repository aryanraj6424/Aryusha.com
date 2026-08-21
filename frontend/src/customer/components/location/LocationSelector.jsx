import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, Search, X, Loader2, Home, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "../../../components/Toast";
import { getUserAddresses } from "../../../services/addressApi";
import { getAddressFromCoords, searchLocation } from "../../../services/locationApi";
import { loadGoogleMaps } from "../../../utils/googleMapsLoader";

/**
 * Customer header modal for setting delivery address by dragging the map, searching places via autocomplete,
 * or clicking "Locate Me".
 * 
 * MIGRATED FROM LEAFLET TO GOOGLE MAPS JS API:
 * - Replaced Leaflet `L.map` & `L.tileLayer` with `google.maps.Map`
 * - Removed `leaflet/dist/leaflet.css` import
 * - Kept the exact same CSS-centered `<MapPin>` overlay design (no Google Maps marker created, to preserve UI drag feel)
 * - Replaced Leaflet `map.on("moveend")` with Google Maps `map.addListener("idle")` with 700ms debounce
 */
function LocationSelector() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Center coordinates
  const [lat, setLat] = useState(() => {
    const stored = localStorage.getItem("selectedAddress");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.latitude) return parsed.latitude;
      } catch (e) { /* ignore */ }
    }
    return 28.6139; // Default New Delhi lat
  });

  const [lng, setLng] = useState(() => {
    const stored = localStorage.getItem("selectedAddress");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.longitude) return parsed.longitude;
      } catch (e) { /* ignore */ }
    }
    return 77.2090; // Default New Delhi lng
  });

  const [address, setAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showSavedList, setShowSavedList] = useState(false);

  // Load Saved Addresses
  const loadSavedAddresses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const token = localStorage.getItem("userToken") || localStorage.getItem("token");
      if (!user || !token) return;
      const response = await getUserAddresses(user._id);
      setSavedAddresses(response.addresses || []);
    } catch (error) {
      if (error.response?.status === 401) {
        // Clear expired/invalid token data gracefully
        localStorage.removeItem("userToken");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setSavedAddresses([]);
        return;
      }
      console.error("Failed to load addresses:", error);
    }
  };

  useEffect(() => {
    loadSavedAddresses();

    // Lock body scroll while location picker is active
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Initialize Google Map (Replaces Leaflet L.map)
  useEffect(() => {
    if (!mapRef.current) return;

    let isMounted = true;

    loadGoogleMaps().then((google) => {
      if (!isMounted || !mapRef.current) return;

      const initialCoords = { lat, lng };

      // Create Google Map instance without default UI controls to match original Leaflet layout
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: initialCoords,
        zoom: 16,
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      // Initial Address resolution
      fetchAddressDetails(lat, lng);

      // Listen to map idle/drag movement (Replaces Leaflet moveend event)
      mapInstanceRef.current.addListener("idle", () => {
        const center = mapInstanceRef.current.getCenter();
        const currentLat = center.lat();
        const currentLng = center.lng();

        setLat(currentLat);
        setLng(currentLng);

        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
          fetchAddressDetails(currentLat, currentLng);
        }, 700); // 700ms drag debounce
      });

      // Geolocate user on first visit if no stored address exists
      const hasStored = localStorage.getItem("selectedAddress");
      if (!hasStored) {
        handleCurrentLocation();
      }

      // Invalidate map layout size after modal mount
      setTimeout(() => {
        if (mapInstanceRef.current && google.maps.event) {
          google.maps.event.trigger(mapInstanceRef.current, "resize");
        }
      }, 250);
    }).catch((err) => {
      console.error("Google Maps Load Error in LocationSelector:", err);
    });

    return () => {
      isMounted = false;
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const fetchAddressDetails = async (latitude, longitude, forceFresh = false) => {
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    if (!forceFresh && cacheRef.current.has(cacheKey)) {
      setAddress(cacheRef.current.get(cacheKey));
      return;
    }

    setLoadingAddress(true);
    try {
      const result = await getAddressFromCoords(latitude, longitude);
      if (result && result.formatted) {
        cacheRef.current.set(cacheKey, result);
        setAddress(result);
      } else {
        setAddress({ formatted: "Unknown location coordinates", postcode: "", city: "", state: "", road: "" });
      }
    } catch (err) {
      console.error(err);
      setAddress({ formatted: "Failed to load address", postcode: "", city: "", state: "", road: "" });
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast({
        type: "warning",
        message: "Geolocation is not supported by your browser or environment. Please search or drag the pin on the map.",
      });
      return;
    }

    setGpsLoading(true);

    const onGpsSuccess = (position, isFallback = false) => {
      const { latitude, longitude, accuracy } = position.coords;
      setLat(latitude);
      setLng(longitude);
      setGpsLoading(false);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setZoom(16);
        mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
      }

      fetchAddressDetails(latitude, longitude, true);

      if (isFallback || accuracy > 2000) {
        showToast({
          type: "warning",
          message: "Showing your approximate area — drag the pin on the map for a more precise location.",
        });
      }
    };

    const tryFallbackPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => onGpsSuccess(position, true),
        (err) => {
          setGpsLoading(false);
          if (err.code === 1) {
            showToast({
              type: "warning",
              message: "Location access is turned off for this site. You can set your address by searching above or dragging the pin — or enable location access in browser settings.",
            });
          } else {
            showToast({
              type: "info",
              message: "We couldn't detect your location automatically. No worries — just drag the pin on the map to your delivery address, or use the search bar above.",
            });
          }
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: Infinity }
      );
    };

    // Stage 1: Fast network/Wi-Fi positioning (8-second timeout, allowing cached location up to 1 min)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onGpsSuccess(position, false);

        // Optional background GPS refinement if accuracy is coarse and hardware GPS might be available
        if (position.coords.accuracy > 100 && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (refinedPos) => {
              if (mapInstanceRef.current && refinedPos.coords.accuracy < position.coords.accuracy) {
                onGpsSuccess(refinedPos, false);
              }
            },
            () => {},
            { timeout: 6000, enableHighAccuracy: true, maximumAge: 0 }
          );
        }
      },
      (err) => {
        if (err.code === 1) {
          // Permission denied by browser — do not retry, show friendly guidance
          setGpsLoading(false);
          showToast({
            type: "warning",
            message: "Location access is turned off for this site. You can set your address by searching above or dragging the pin — or enable location access in browser settings.",
          });
        } else {
          // Stage 2: Automatic fallback query
          tryFallbackPosition();
        }
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(value);
        setSuggestions(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 500); // 500ms search autocomplete debounce
  };

  const handleSelectSuggestion = (place) => {
    const latitude = parseFloat(place.properties.lat);
    const longitude = parseFloat(place.properties.lon);
    setSearch(place.properties.formatted);
    setSuggestions([]);
    setLat(latitude);
    setLng(longitude);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
    }
    fetchAddressDetails(latitude, longitude);
  };

  const handleConfirmLocation = () => {
    if (!address) return;
    const currentAddress = {
      addressType: "Map Location",
      fullAddress: address.formatted,
      latitude: lat,
      longitude: lng,
      pincode: address.postcode,
      city: address.city,
    };
    localStorage.setItem("selectedAddress", JSON.stringify(currentAddress));
    window.dispatchEvent(new Event("location-updated"));
    window.dispatchEvent(new Event("storage"));
    showToast({ type: "success", message: "Location Selected Successfully" });
    navigate("/");
  };

  const handleAddNewAddress = () => {
    navigate("/customer/addresses", {
      state: {
        prefill: {
          latitude: lat,
          longitude: lng,
          address: address
        }
      }
    });
  };

  const handleUseSavedAddress = (savedAddr) => {
    const sessionAddr = {
      ...savedAddr,
      fullAddress: savedAddr.fullAddress || `${savedAddr.houseNo || ""}, ${savedAddr.area || ""}, ${savedAddr.city || ""}, ${savedAddr.state || ""}`.replace(/^,|,$/g, "").trim(),
    };
    localStorage.setItem("selectedAddress", JSON.stringify(sessionAddr));
    window.dispatchEvent(new Event("location-updated"));
    window.dispatchEvent(new Event("storage"));
    showToast({ type: "success", message: "Address Selected Successfully" });
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-[100] md:relative md:z-auto w-full md:max-w-xl md:mx-auto bg-white md:rounded-3xl shadow-2xl flex flex-col h-full md:h-auto max-h-[100dvh] md:max-h-[85vh] overflow-hidden pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-white z-20 flex-shrink-0 sticky top-0">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Select Location</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Drag to place pin at delivery location</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
        {/* Map Container */}
        <div className="relative w-full h-[320px] md:h-[360px] flex-shrink-0 bg-slate-50 min-h-[250px]">
          <div ref={mapRef} className="w-full h-full z-0" />

          {/* Absolute Centered Pin Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none flex flex-col items-center select-none">
            <MapPin size={38} className="text-purple-600 drop-shadow-xl fill-purple-100" />
            <div className="w-2.5 h-0.5 bg-black/40 rounded-full blur-[0.5px] -mt-0.5" />
          </div>

          {/* Autocomplete Input */}
          <div className="absolute top-4 left-4 right-4 z-[1000] max-w-[calc(100%-32px)]">
            <div className="flex items-center bg-white border border-slate-100 shadow-lg rounded-2xl px-3 py-1 focus-within:ring-2 focus-within:ring-purple-300">
              <Search size={18} className="text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search area, street, city..."
                className="w-full py-2 text-sm outline-none bg-transparent"
              />
              {loadingSuggestions && (
                <Loader2 size={16} className="animate-spin text-purple-600 mr-2" />
              )}
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setSuggestions([]); }}
                  className="text-slate-400 hover:text-slate-650"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="mt-1.5 bg-white border rounded-xl overflow-hidden shadow-xl max-h-[180px] overflow-y-auto z-[2000] relative">
                {suggestions.map((place) => (
                  <button
                    key={place.properties.place_id}
                    onClick={() => handleSelectSuggestion(place)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-purple-50 border-b text-xs flex gap-2 font-semibold text-slate-700 transition"
                  >
                    <MapPin size={14} className="mt-0.5 text-purple-600 flex-shrink-0" />
                    <span className="truncate">{place.properties.formatted}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Locate Me Floating Button */}
          <button
            onClick={handleCurrentLocation}
            disabled={gpsLoading}
            className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg border border-slate-100 text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            title="Locate Me"
          >
            {gpsLoading ? (
              <Loader2 size={18} className="animate-spin text-purple-600" />
            ) : (
              <Navigation size={18} className="text-purple-600 rotate-45" />
            )}
          </button>
        </div>

        {/* Bottom Control Sheet */}
        <div className="bg-white border-t flex-shrink-0 z-10 relative">
        <div className="p-4 bg-slate-50/50">
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-purple-700 font-extrabold text-xs mb-1 tracking-wider uppercase">
              <MapPin size={12} />
              <span>Delivery Address</span>
            </div>
            {loadingAddress ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1 font-semibold animate-pulse">
                <Loader2 size={12} className="animate-spin text-purple-600" />
                Resolving address from coordinates...
              </div>
            ) : address ? (
              <div>
                <p className="text-sm font-black text-slate-800 truncate">
                  {address.road || address.city || "Selected spot"}
                </p>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed font-semibold">
                  {address.formatted}
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-100 p-2 rounded-lg">
                Drag the map to pinpoint delivery details.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirmLocation}
              disabled={!address || loadingAddress}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-extrabold py-3.5 px-4 rounded-xl shadow-md transition active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              Confirm Location
            </button>
            <button
              onClick={handleAddNewAddress}
              disabled={!address || loadingAddress}
              className="bg-purple-100 hover:bg-purple-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed text-purple-700 text-sm font-extrabold px-4 rounded-xl transition active:scale-[0.98]"
            >
              Add New Address
            </button>
          </div>
        </div>

        {/* Collapsible Saved Addresses Drawer */}
        {savedAddresses.length > 0 && (
          <div className="border-t">
            <button
              onClick={() => setShowSavedList(!showSavedList)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
            >
              <div className="flex items-center gap-1.5">
                <Home size={14} className="text-purple-600" />
                <span>SAVED ADDRESSES ({savedAddresses.length})</span>
              </div>
              {showSavedList ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {showSavedList && (
              <div className="max-h-[180px] overflow-y-auto px-4 pb-4 space-y-2.5 bg-white border-t pt-3">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => handleUseSavedAddress(addr)}
                    className="border border-slate-100 rounded-xl p-3 cursor-pointer hover:border-purple-400 hover:bg-purple-50/20 transition flex gap-3 text-left"
                  >
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Home size={14} className="text-purple-600" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-800">{addr.addressType}</span>
                        {addr.fullName && (
                          <span className="text-[10px] text-slate-400 font-bold">({addr.fullName})</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-1 leading-relaxed">
                        {addr.houseNo}, {addr.area}, {addr.city}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

export default LocationSelector;