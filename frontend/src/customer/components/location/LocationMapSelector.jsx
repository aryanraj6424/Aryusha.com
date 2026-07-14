import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Search, X, Loader2 } from "lucide-react";
import { getAddressFromCoords, searchLocation } from "../../../services/locationApi";

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

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Fix default Leaflet icon paths in React / Vite
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });

    const initialCoords = [lat, lng];

    // Setup map
    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: false,
    }).setView(initialCoords, 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    // Initial Address
    fetchAddressDetails(lat, lng);

    // Moveend handler
    mapInstanceRef.current.on("moveend", () => {
      const center = mapInstanceRef.current.getCenter();
      setLat(center.lat);
      setLng(center.lng);

      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        fetchAddressDetails(center.lat, center.lng);
      }, 700); // 700ms drag debounce
    });

    // Detect GPS on startup if no coordinates passed
    if (!initialLocation) {
      handleCurrentLocation();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const fetchAddressDetails = async (latitude, longitude) => {
    // Round to 5 decimals to cache locations within ~1m range
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    if (cacheRef.current.has(cacheKey)) {
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
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        setGpsLoading(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
        }
      },
      (err) => {
        console.error(err);
        setGpsLoading(false);
      },
      { timeout: 8000 }
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

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 16);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <div className="w-full h-full md:max-w-2xl md:h-[650px] bg-white md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white z-10 flex-shrink-0">
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

        {/* Map Area */}
        <div className="flex-1 relative bg-slate-50 min-h-0">
          <div ref={mapRef} className="w-full h-full z-0" />

          {/* Centered Fixed Pin */}
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
  );
}
