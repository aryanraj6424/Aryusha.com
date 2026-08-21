import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search, X, Loader2 } from "lucide-react";
import { getAddressFromCoords, searchLocation } from "../../../services/locationApi";
import { loadGoogleMaps } from "../../../utils/googleMapsLoader";

/**
 * Modal map selector inside customer address book management for pinpointing custom address coordinates.
 * 
 * MIGRATED FROM LEAFLET TO GOOGLE MAPS JS API:
 * - Replaced Leaflet `L.map` & `L.tileLayer` with `google.maps.Map`
 * - Removed `leaflet/dist/leaflet.css` import
 * - Kept the exact same CSS-centered `<MapPin>` overlay design (no Google Maps marker created, to preserve UI drag feel)
 * - Replaced Leaflet `map.on("moveend")` with Google Maps `map.addListener("idle")` with 700ms debounce
 */
export default function LocationMapSelector({ onConfirm, onClose, initialLocation }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const cacheRef = useRef(new Map());

  const [lat, setLat] = useState(initialLocation?.latitude || 28.6139);
  const [lng, setLng] = useState(initialLocation?.longitude || 77.2090);
  const [address, setAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Initialize Google Map (Replaces Leaflet L.map)
  useEffect(() => {
    if (!mapRef.current) return;

    let isMounted = true;

    loadGoogleMaps().then((google) => {
      if (!isMounted || !mapRef.current) return;

      const initialCoords = { lat, lng };

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

      // Detect GPS on startup if no coordinates passed
      if (!initialLocation) {
        handleCurrentLocation();
      }
    }).catch((err) => {
      console.error("Google Maps Load Error in LocationMapSelector:", err);
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
    // Round to 5 decimals to cache locations within ~1m range
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
        setAddress({ formatted: "Unknown location details", postcode: "", city: "", state: "", road: "" });
      }
    } catch (err) {
      console.error(err);
      setAddress({ formatted: "Failed to load address. Please enter details manually.", postcode: "", city: "", state: "", road: "" });
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
        mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
      }

      fetchAddressDetails(latitude, longitude, true);

      if (isFallback || accuracy > 2000) {
        showToast({
          type: "warning",
          message: "Showing your approximate area — drag the pin on the map for a more precise location.",
        });
      }
    };

    const tryLowAccuracyFallback = () => {
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
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 0 }
      );
    };

    // Stage 1: High-accuracy GPS / Wi-Fi positioning (15-second timeout, fresh fix)
    navigator.geolocation.getCurrentPosition(
      (position) => onGpsSuccess(position, false),
      (err) => {
        if (err.code === 1) {
          // Permission denied by browser — stop loading, show friendly guidance
          setGpsLoading(false);
          showToast({
            type: "warning",
            message: "Location access is turned off for this site. You can set your address by searching above or dragging the pin — or enable location access in browser settings.",
          });
        } else {
          // Stage 2: Low-accuracy fallback query
          tryLowAccuracyFallback();
        }
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
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
    }, 500); // 500ms search-as-you-type debounce
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

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <div className="w-full h-full md:max-w-2xl md:h-auto max-h-[100dvh] md:max-h-[85vh] bg-white md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white z-20 flex-shrink-0 sticky top-0">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base md:text-lg">Locate on Map</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Drag map to position pin exactly</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
          {/* Map Area */}
          <div className="relative w-full h-[320px] md:h-[360px] flex-shrink-0 bg-slate-50 min-h-[250px]">
            <div ref={mapRef} className="w-full h-full z-0" />

            {/* Centered Fixed Pin Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none flex flex-col items-center select-none">
              <MapPin size={38} className="text-purple-600 drop-shadow-xl fill-purple-100" />
              <div className="w-2.5 h-0.5 bg-black/40 rounded-full blur-[0.5px] -mt-0.5" />
            </div>

            {/* Floating Search Autocomplete */}
            <div className="absolute top-4 left-4 right-4 z-[1000] max-w-[calc(100%-32px)]">
              <div className="flex items-center bg-white border border-slate-100 shadow-lg rounded-2xl px-3 py-1 focus-within:ring-2 focus-within:ring-purple-300">
                <Search size={18} className="text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search area, town, pincode..."
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
                <div className="mt-1.5 bg-white border rounded-xl overflow-hidden shadow-xl max-h-[220px] overflow-y-auto z-[2000] relative">
                  {suggestions.map((place) => (
                    <button
                      key={place.properties.place_id}
                      onClick={() => handleSelectSuggestion(place)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-purple-50 border-b text-xs flex gap-2 font-medium text-slate-700 transition"
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
              type="button"
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

          {/* Bottom Card */}
          <div className="p-4 border-t bg-slate-50/50 flex-shrink-0 z-10">
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-purple-700 font-extrabold text-xs mb-1 tracking-wider uppercase">
                <MapPin size={12} />
                <span>Resolved Address</span>
              </div>
              {loadingAddress ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1 font-semibold">
                  <Loader2 size={12} className="animate-spin text-purple-600" />
                  Resolving address from coordinates...
                </div>
              ) : address ? (
                <div>
                  <p className="text-sm font-black text-slate-800 truncate">
                    {address.road || address.city || "Selected Spot"}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed font-semibold">
                    {address.formatted}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-amber-600 font-semibold">
                  Drag the map to resolve coordinates to an address.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onConfirm({ latitude: lat, longitude: lng, address })}
              disabled={!address || loadingAddress}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-extrabold py-3.5 px-4 rounded-xl shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Confirm Location & Prefill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
